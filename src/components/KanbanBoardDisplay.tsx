import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import LoadingSpinner from './LoadingSpinner';
import ProjectDetailPanel from './ProjectDetailPanel';
import ConfigurableBacklogItemForm from './ConfigurableBacklogItemForm';
import { useBacklogSync } from '../hooks/useBacklogSync';
import toast from 'react-hot-toast';
import { getNextOrder } from '../utils/taskOrdering';
import { GripVertical, Filter, SortAsc, Clock, User, Tag, Settings, BarChart2, AlertTriangle, Plus } from 'lucide-react';

type Task = Tables<'project_tasks'>;
type KanbanBoard = Tables<'kanban_boards'>;

interface Column {
  id: string;
  name: string;
  color: string;
  limit?: number;
  description?: string;
}

interface DraggableTaskProps {
  task: Task;
  onClick: () => void;
  view: 'compact' | 'detailed';
}

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isOver: boolean;
  view: 'compact' | 'detailed';
}

interface SwimlaneConfig {
  enabled: boolean;
  groupBy: 'type' | 'assignee' | 'priority' | 'epic';
}

function DraggableTask({ task, onClick, view, showDependencies = false }: DraggableTaskProps & { showDependencies?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  } : undefined;

  const renderDependencies = () => {
    if (!showDependencies || !task.dependencies?.length) return null;
    
    return (
      <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
        <span>Dependencies: {task.dependencies.length}</span>
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg bg-white p-4 shadow transition-all hover:shadow-md ${
        isDragging ? 'ring-2 ring-indigo-500' : 'hover:translate-x-1'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 flex h-8 w-4 -translate-y-1/2 cursor-grab items-center justify-center rounded-l opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

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
        
        {view === 'detailed' && (
          <>
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {task.description}
            </p>
            
            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
              {task.story_points && (
                <span className="flex items-center">
                  <span className="font-medium">Points:</span>
                  <span className="ml-1">{task.story_points}</span>
                </span>
              )}
              {task.estimated_hours && (
                <span className="flex items-center">
                  <span className="font-medium">Est:</span>
                  <span className="ml-1">{task.estimated_hours}h</span>
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{task.assignee}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(task.due_date).toLocaleDateString()}</span>
              </span>
            </div>

            {task.labels && task.labels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {task.labels.map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        
        {view === 'compact' && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>{task.assignee}</span>
            {task.story_points && (
              <span className="rounded bg-gray-100 px-2 py-1">
                {task.story_points} points
              </span>
            )}
          </div>
        )}
        {renderDependencies()}
      </div>
    </div>
  );
}

function TaskColumn({ column, tasks, onTaskClick, isOver, view }: TaskColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { status: column.id }
  });

  const isOverLimit = column.limit && tasks.length > column.limit;

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full flex-col rounded-lg border-2 ${
        isOver ? 'ring-2 ring-indigo-500' : 'border-gray-200'
      } transition-all duration-200`}
      style={{ backgroundColor: column.color }}
    >
      <div className="border-b-2 border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">{column.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-full ${
              isOverLimit ? 'bg-red-100 text-red-800' : 'bg-white text-gray-600'
            } px-2 text-xs font-medium shadow-sm`}>
              {tasks.length}{column.limit ? `/${column.limit}` : ''}
            </span>
            {isOverLimit && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {tasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            view={view}
          />
        ))}
      </div>
    </div>
  );
}

function CumulativeFlowDiagram({ tasks }: { tasks: Task[] }) {
  return (
    <div className="h-40 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex h-full items-center justify-center">
        <BarChart2 className="h-6 w-6 text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Cumulative Flow Diagram</span>
      </div>
    </div>
  );
}

interface KanbanBoardDisplayProps {
  board: KanbanBoard;
}

export default function KanbanBoardDisplay({ board }: KanbanBoardDisplayProps) {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [view, setView] = useState<'compact' | 'detailed'>(board.default_view as 'compact' | 'detailed');
  const [filters, setFilters] = useState({
    type: [] as string[],
    priority: [] as string[],
    assignee: [] as string[],
  });
  const [sortBy, setSortBy] = useState<'priority' | 'due_date' | 'story_points'>('priority');
  const [swimlanes, setSwimlanes] = useState<SwimlaneConfig>({
    enabled: false,
    groupBy: 'type'
  });
  const [showCFD, setShowCFD] = useState(false);
  const [showBacklogForm, setShowBacklogForm] = useState(false);

  // Enable auto-sync for this board
  const { manualSync } = useBacklogSync({
    projectId: projectId!,
    boardId: board.id,
    onNewItem: (newItem) => {
      // Refresh tasks when new item is added
      fetchTasks();
    },
    enabled: true
  });

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

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

  const handleCreateBacklogItem = async (data: any) => {
    try {
      const nextOrder = await getNextOrder(projectId!, data.parent_id, null);

      const { error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          ...data,
          order: nextOrder
        });

      if (error) throw error;

      toast.success('Backlog item created successfully');
      setShowBacklogForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating backlog item:', error);
      toast.error('Failed to create backlog item');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverColumn(over.id as string);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverColumn(null);

    if (!over || active.id === over.id) return;

    try {
      const taskId = active.id as string;
      const newStatus = over.id as string;
      const task = tasks.find(t => t.id === taskId);
      
      if (!task || task.status === newStatus) return;

      const column = (board.columns as Column[]).find(c => c.id === newStatus);
      const tasksInColumn = tasks.filter(t => t.status === newStatus);
      if (column?.limit && tasksInColumn.length >= column.limit) {
        toast.error(`Column "${column.name}" has reached its WIP limit of ${column.limit} items`);
        return;
      }

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

  const groupTasksBySwimlane = (tasks: Task[]) => {
    if (!swimlanes.enabled) return { '': tasks };

    return tasks.reduce((groups, task) => {
      const key = swimlanes.groupBy === 'epic' 
        ? task.parent_id || 'No Epic'
        : task[swimlanes.groupBy] || 'Unassigned';
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
      return groups;
    }, {} as Record<string, Task[]>);
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (filters.type.length && !filters.type.includes(task.type)) return false;
      if (filters.priority.length && !filters.priority.includes(task.priority)) return false;
      if (filters.assignee.length && !filters.assignee.includes(task.assignee)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        case 'due_date':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'story_points':
          return (b.story_points || 0) - (a.story_points || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowBacklogForm(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </button>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="rounded-md border-gray-300 text-sm"
              onChange={e => setFilters(prev => ({
                ...prev,
                type: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              multiple
            >
              <option value="epic">Epics</option>
              <option value="user_story">User Stories</option>
              <option value="task">Tasks</option>
              <option value="bug">Bugs</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <SortAsc className="h-4 w-4 text-gray-500" />
            <select
              className="rounded-md border-gray-300 text-sm"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="priority">Priority</option>
              <option value="due_date">Due Date</option>
              <option value="story_points">Story Points</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Swimlanes:</label>
            <select
              className="rounded-md border-gray-300 text-sm"
              value={swimlanes.enabled ? swimlanes.groupBy : ''}
              onChange={e => setSwimlanes({
                enabled: !!e.target.value,
                groupBy: e.target.value as SwimlaneConfig['groupBy'] || 'type'
              })}
            >
              <option value="">None</option>
              <option value="type">By Type</option>
              <option value="assignee">By Assignee</option>
              <option value="priority">By Priority</option>
              <option value="epic">By Epic</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCFD(!showCFD)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            {showCFD ? 'Hide' : 'Show'} Flow Diagram
          </button>

          <select
            className="rounded-md border-gray-300 text-sm"
            value={view}
            onChange={e => setView(e.target.value as 'compact' | 'detailed')}
          >
            <option value="compact">Compact View</option>
            <option value="detailed">Detailed View</option>
          </select>
        </div>
      </div>

      {showCFD && <CumulativeFlowDiagram tasks={tasks} />}

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid h-[calc(100vh-12rem)] grid-cols-4 gap-6">
          {swimlanes.enabled ? (
            Object.entries(groupTasksBySwimlane(filteredAndSortedTasks)).map(([lane, laneTasks]) => (
              <div key={lane} className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">{lane}</h3>
                <div className="grid grid-cols-4 gap-4">
                  {(board.columns as Column[]).map(column => (
                    <TaskColumn
                      key={column.id}
                      column={column}
                      tasks={laneTasks.filter(task => task.status === column.id)}
                      onTaskClick={setSelectedTask}
                      isOver={overColumn === column.id}
                      view={view}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            (board.columns as Column[]).map(column => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={filteredAndSortedTasks.filter(task => task.status === column.id)}
                onTaskClick={setSelectedTask}
                isOver={overColumn === column.id}
                view={view}
              />
            ))
          )}
        </div>

        {activeId && (
          <div 
            className="pointer-events-none fixed left-0 top-0 z-50"
            style={{
              transform: `translate3d(${event?.clientX || 0}px, ${event?.clientY || 0}px, 0)`
            }}
          >
            <div className="w-64 rounded-lg bg-white p-4 shadow-lg ring-2 ring-indigo-500">
              {tasks.find(t => t.id === activeId)?.title}
            </div>
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

      {showBacklogForm && (
        <ConfigurableBacklogItemForm
          isOpen={showBacklogForm}
          onClose={() => setShowBacklogForm(false)}
          onSubmit={handleCreateBacklogItem}
          boardId={board.id}
        />
      )}
    </div>
  );
}