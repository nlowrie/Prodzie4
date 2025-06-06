import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectDetailPanel from '../components/ProjectDetailPanel';
import { useProject } from '../lib/ProjectContext';
import toast from 'react-hot-toast';
import { getNextOrder } from '../utils/taskOrdering';
import { GripVertical } from 'lucide-react';

type Task = Tables<'project_tasks'>;
type Project = Tables<'projects'>;

interface TaskColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isOver: boolean;
}

interface DraggableTaskProps {
  task: Task;
  onClick: () => void;
}

const statusColumns = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-50 border-gray-200' },
  { id: 'ready', title: 'Ready', color: 'bg-blue-50 border-blue-200' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 border-purple-200' },
  { id: 'done', title: 'Done', color: 'bg-green-50 border-green-200' }
];

function DraggableTask({ task, onClick }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg bg-white p-4 shadow transition-all hover:shadow-md ${
        isDragging ? 'ring-2 ring-indigo-500' : 'hover:translate-x-1'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 flex h-8 w-4 -translate-y-1/2 cursor-grab items-center justify-center rounded-l opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Card Content - Clickable */}
      <div onClick={onClick} className="cursor-pointer">
        <div className="mb-2 flex items-center justify-between">
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            task.type === 'epic' ? 'bg-purple-100 text-purple-800' :
            task.type === 'user_story' ? 'bg-blue-100 text-blue-800' :
            task.type === 'bug' ? 'bg-red-100 text-red-800' :
            'bg-green-100 text-green-800'
          }`}>
            {task.type}
          </span>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            task.priority === 'high' ? 'bg-red-100 text-red-800' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {task.priority}
          </span>
        </div>
        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{task.assignee}</span>
          {task.story_points && (
            <span className="rounded bg-gray-100 px-2 py-1">
              {task.story_points} points
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ id, title, tasks, onTaskClick, isOver }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: { status: id }
  });

  const column = statusColumns.find(col => col.id === id);
  const columnColor = column?.color || 'bg-gray-50 border-gray-200';

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full flex-col rounded-lg border-2 ${
        isOver ? 'ring-2 ring-indigo-500' : columnColor
      } transition-all duration-200`}
    >
      <div className={`rounded-t-lg border-b-2 ${columnColor} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-2 text-xs font-medium text-gray-600 shadow-sm">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {tasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}

export default function TaskBoardPage() {
  const { projectId } = useParams();
  const { setCurrentProject } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData();
    fetchTasks();

    return () => {
      setCurrentProject(null);
    };
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setCurrentProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project data');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverStatus(over.id as string);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverStatus(null);

    if (!over || active.id === over.id) return;

    try {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      const task = tasks.find(t => t.id === taskId);
      
      if (!task || task.status === newStatus) return;

      // Get the next order value for the new status column
      const nextOrder = await getNextOrder(
        projectId!,
        task.parent_id,
        task.sprint_id
      );

      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          status: newStatus,
          order: nextOrder
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Task Board</h2>
      
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid h-[calc(100vh-12rem)] grid-cols-5 gap-6">
          {statusColumns.map(column => (
            <TaskColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasks.filter(task => task.status === column.id)}
              onTaskClick={setSelectedTask}
              isOver={overStatus === column.id}
            />
          ))}
        </div>

        {activeId && (
          <div className="w-64 rounded-lg bg-white p-4 shadow-lg ring-2 ring-indigo-500">
            {tasks.find(t => t.id === activeId)?.title}
          </div>
        )}
      </DndContext>

      {selectedTask && (
        <ProjectDetailPanel
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          itemType={selectedTask.type}
          itemId={selectedTask.id}
          onItemUpdated={fetchTasks}
        />
      )}
    </div>
  );
}