import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Tables } from '../types/supabase';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import SortableBacklogItem from './SortableBacklogItem';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface SprintCardProps {
  sprint: Tables<'sprints'>;
  tasks: Tables<'project_tasks'>[];
  onItemClick?: (item: Tables<'sprints'> | Tables<'project_tasks'>) => void;
}

export default function SprintCard({ sprint, tasks, onItemClick }: SprintCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { setNodeRef, isOver } = useDroppable({
    id: `sprint-${sprint.id}`,
    data: {
      type: 'sprint',
      sprintId: sprint.id,
    },
  });

  const totalPoints = tasks.reduce((sum, task) => sum + (task.story_points || 0), 0);
  const remainingCapacity = (sprint.capacity || 0) - totalPoints;

  const getSprintStatus = () => {
    const now = new Date();
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);

    if (now < startDate) return 'Not Started';
    if (now > endDate) return 'Completed';
    return 'In Progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleHeaderClick = () => {
    onItemClick?.(sprint);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      className={`border-t ${
        isOver ? 'border-2 border-indigo-500 bg-indigo-50' : 'border-gray-200'
      }`}
    >
      <div 
        className="grid grid-cols-7 gap-4 p-4 hover:bg-gray-50 cursor-pointer"
        onClick={handleHeaderClick}
      >
        <div className="col-span-2 flex items-center space-x-2">
          <button
            onClick={handleExpandClick}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800">
            Sprint
          </span>
          <span className="font-medium text-gray-900">{sprint.name}</span>
        </div>
        <div>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(getSprintStatus())}`}>
            {getSprintStatus()}
          </span>
        </div>
        <div>
          <span className="text-sm text-gray-500">{totalPoints} / {sprint.capacity} points</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">{remainingCapacity} remaining</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">-</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="mr-1 h-4 w-4" />
          {new Date(sprint.end_date).toLocaleDateString()}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700">Sprint Goal</h4>
            <p className="mt-1 text-sm text-gray-600">{sprint.goal || 'No goal set'}</p>
          </div>

          {tasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Sprint Tasks</h4>
              <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                {tasks.map((task) => (
                  <div key={task.id} className="ml-4">
                    <SortableBacklogItem
                      item={{
                        ...task,
                        children: [],
                        level: 0,
                      }}
                      isExpanded={false}
                      onToggleExpand={() => {}}
                      getPriorityColor={(priority) => {
                        switch (priority.toLowerCase()) {
                          case 'high':
                            return 'bg-red-100 text-red-800';
                          case 'medium':
                            return 'bg-yellow-100 text-yellow-800';
                          case 'low':
                            return 'bg-green-100 text-green-800';
                          default:
                            return 'bg-gray-100 text-gray-800';
                        }
                      }}
                      getTypeColor={(type) => {
                        switch (type.toLowerCase()) {
                          case 'epic':
                            return 'bg-purple-100 text-purple-800';
                          case 'user_story':
                            return 'bg-blue-100 text-blue-800';
                          case 'task':
                            return 'bg-green-100 text-green-800';
                          case 'bug':
                            return 'bg-red-100 text-red-800';
                          default:
                            return 'bg-gray-100 text-gray-800';
                        }
                      }}
                      formatUserStory={(story) => {
                        const description = story.description || '';
                        const match = description.match(/As a (.*?), I want (.*?) so that (.*)/);
                        
                        if (match) {
                          const [, userType, action, benefit] = match;
                          return (
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">As a</span> {userType},<br />
                              <span className="font-medium">I want</span> {action}<br />
                              <span className="font-medium">so that</span> {benefit}
                            </div>
                          );
                        }
                        
                        return <div className="text-sm text-gray-700">{description}</div>;
                      }}
                      onItemClick={onItemClick}
                    />
                  </div>
                ))}
              </SortableContext>
            </div>
          )}
        </div>
      )}
    </div>
  );
}