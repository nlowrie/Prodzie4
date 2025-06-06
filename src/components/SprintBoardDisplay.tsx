import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import LoadingSpinner from './LoadingSpinner';
import ProjectDetailPanel from './ProjectDetailPanel';
import BacklogItemFormDialog from './BacklogItemFormDialog';
import SprintSettingsPanel from './SprintSettingsPanel';
import { useBacklogSync } from '../hooks/useBacklogSync';
import toast from 'react-hot-toast';
import { getNextOrder } from '../utils/taskOrdering';
import { GripVertical, Filter, SortAsc, Clock, User, Tag, Settings, BarChart2, AlertTriangle, Plus, Calendar, Target, ArrowRight, X } from 'lucide-react';

type Task = Tables<'project_tasks'>;
type SprintBoard = Tables<'sprint_boards'>;
type Sprint = Tables<'sprints'>;

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

interface SprintBoardSettings {
  columns: Column[];
  sprintDuration: number;
  workingDaysPerWeek: number;
  teamCapacity: number;
  storyPointScale: 'fibonacci' | 'linear' | 'custom';
  customScale?: number[];
  sprintNamingPattern: string;
  ceremonies: {
    planning: boolean;
    review: boolean;
    retrospective: boolean;
  };
  autoCreateSprints: boolean;
  rolloverUnfinishedItems: boolean;
  burndownChartType: 'remaining' | 'velocity';
}

const defaultColumns: Column[] = [
  { id: 'todo', name: 'To Do', color: '#F3F4F6' },
  { id: 'in_progress', name: 'In Progress', color: '#FEF3C7' },
  { id: 'review', name: 'Review', color: '#F3E8FF' },
  { id: 'done', name: 'Done', color: '#DCFCE7' }
];

function DraggableTask({ task, onClick, view }: DraggableTaskProps) {
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

interface SprintBoardDisplayProps {
  board: SprintBoard;
}

export default function SprintBoardDisplay({ board }: SprintBoardDisplayProps) {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [view, setView] = useState<'compact' | 'detailed'>('detailed');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showBacklogForm, setShowBacklogForm] = useState(false);
  const [boardSettings, setBoardSettings] = useState<SprintBoardSettings | null>(null);
  const [showBacklogPanel, setShowBacklogPanel] = useState(false);

  // Enable auto-sync for sprint items
  const { manualSync } = useBacklogSync({
    projectId: projectId!,
    boardId: board.id,
    onNewItem: (newItem) => {
      // Only refresh if the item is assigned to the active sprint
      if (newItem.sprint_id === activeSprint?.id) {
        fetchTasks();
      } else {
        fetchBacklogTasks();
      }
    },
    enabled: true
  });

  useEffect(() => {
    fetchSprints();
    fetchBoardSettings();
    fetchBacklogTasks();
  }, [projectId]);

  useEffect(() => {
    if (activeSprint) {
      fetchTasks();
    }
  }, [activeSprint]);

  const fetchSprints = async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSprints(data || []);
      
      // Set the most recent sprint as active by default
      if (data && data.length > 0) {
        setActiveSprint(data[0]);
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
      toast.error('Failed to load sprints');
    }
  };

  const fetchBacklogTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .is('sprint_id', null)
        .order('order', { ascending: true });

      if (error) throw error;
      setBacklogTasks(data || []);
    } catch (error) {
      console.error('Error fetching backlog tasks:', error);
    }
  };

  const fetchBoardSettings = async () => {
    try {
      const settings = board.settings as SprintBoardSettings;
      setBoardSettings({
        columns: settings.columns || defaultColumns,
        sprintDuration: settings.sprintDuration || 2,
        workingDaysPerWeek: settings.workingDaysPerWeek || 5,
        teamCapacity: settings.teamCapacity || 0,
        storyPointScale: settings.storyPointScale || 'fibonacci',
        customScale: settings.customScale,
        sprintNamingPattern: settings.sprintNamingPattern || 'Sprint #{number}',
        ceremonies: settings.ceremonies || {
          planning: true,
          review: true,
          retrospective: true,
        },
        autoCreateSprints: settings.autoCreateSprints || false,
        rolloverUnfinishedItems: settings.rolloverUnfinishedItems || true,
        burndownChartType: settings.burndownChartType || 'remaining',
      });
    } catch (error) {
      console.error('Error parsing board settings:', error);
      setBoardSettings({
        columns: defaultColumns,
        sprintDuration: 2,
        workingDaysPerWeek: 5,
        teamCapacity: 0,
        storyPointScale: 'fibonacci',
        sprintNamingPattern: 'Sprint #{number}',
        ceremonies: {
          planning: true,
          review: true,
          retrospective: true,
        },
        autoCreateSprints: false,
        rolloverUnfinishedItems: true,
        burndownChartType: 'remaining',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!activeSprint) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('sprint_id', activeSprint.id)
        .order('order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load sprint tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBacklogItem = async (data: any) => {
    try {
      const nextOrder = await getNextOrder(projectId!, data.parent_id, activeSprint?.id || null);

      const { error } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          sprint_id: activeSprint?.id || null,
          ...data,
          order: nextOrder
        });

      if (error) throw error;

      toast.success('Sprint item created successfully');
      setShowBacklogForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating sprint item:', error);
      toast.error('Failed to create sprint item');
    }
  };

  const handleAssignToSprint = async (taskId: string) => {
    if (!activeSprint) {
      toast.error('Please select an active sprint first');
      return;
    }

    try {
      const nextOrder = await getNextOrder(projectId!, null, activeSprint.id);

      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          sprint_id: activeSprint.id,
          order: nextOrder
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task assigned to sprint');
      fetchTasks();
      fetchBacklogTasks();
    } catch (error) {
      console.error('Error assigning task to sprint:', error);
      toast.error('Failed to assign task to sprint');
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

      const column = boardSettings?.columns.find(c => c.id === newStatus);
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

  const getSprintProgress = () => {
    if (!activeSprint || !tasks.length) return { completed: 0, total: 0, percentage: 0 };
    
    const completedTasks = tasks.filter(task => task.status === 'done');
    const totalTasks = tasks.length;
    const percentage = Math.round((completedTasks.length / totalTasks) * 100);
    
    return { completed: completedTasks.length, total: totalTasks, percentage };
  };

  const getSprintCapacityInfo = () => {
    const totalPoints = tasks.reduce((sum, task) => sum + (task.story_points || 0), 0);
    const completedPoints = tasks
      .filter(task => task.status === 'done')
      .reduce((sum, task) => sum + (task.story_points || 0), 0);
    
    return {
      totalPoints,
      completedPoints,
      capacity: boardSettings?.teamCapacity || 0,
      remaining: (boardSettings?.teamCapacity || 0) - totalPoints
    };
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!boardSettings) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Board configuration error</h2>
          <p className="mt-2 text-gray-600">Unable to load board settings</p>
        </div>
      </div>
    );
  }

  const progress = getSprintProgress();
  const capacity = getSprintCapacityInfo();

  return (
    <div className="h-full space-y-4 p-6">
      {/* Sprint Header */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
              <p className="text-sm text-gray-500">{board.description}</p>
            </div>
            {activeSprint && (
              <div className="rounded-lg bg-indigo-50 p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-medium text-indigo-900">{activeSprint.name}</h3>
                    <p className="text-sm text-indigo-600">
                      {new Date(activeSprint.start_date).toLocaleDateString()} - {new Date(activeSprint.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {activeSprint.goal && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Target className="h-4 w-4 text-indigo-600" />
                    <p className="text-sm text-indigo-700">{activeSprint.goal}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Sprint Selection */}
            <select
              value={activeSprint?.id || ''}
              onChange={(e) => {
                const sprint = sprints.find(s => s.id === e.target.value);
                setActiveSprint(sprint || null);
              }}
              className="rounded-md border-gray-300 text-sm"
            >
              <option value="">Select Sprint</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowBacklogPanel(!showBacklogPanel)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Backlog ({backlogTasks.length})
            </button>

            <button
              onClick={() => setShowBacklogForm(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </button>

            <button
              onClick={() => setShowSettingsPanel(true)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
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

        {/* Sprint Metrics */}
        {activeSprint && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Progress</p>
                  <p className="text-lg font-semibold text-gray-900">{progress.percentage}%</p>
                  <p className="text-xs text-gray-500">{progress.completed}/{progress.total} tasks</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-500">Story Points</p>
                  <p className="text-lg font-semibold text-blue-900">{capacity.completedPoints}/{capacity.totalPoints}</p>
                  <p className="text-xs text-blue-600">Completed/Total</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-500">Capacity</p>
                  <p className="text-lg font-semibold text-green-900">{capacity.capacity}</p>
                  <p className="text-xs text-green-600">Team capacity</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-500">Remaining</p>
                  <p className="text-lg font-semibold text-yellow-900">{capacity.remaining}</p>
                  <p className="text-xs text-yellow-600">Points available</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-6">
        {/* Main Board */}
        <div className={`${showBacklogPanel ? 'flex-1' : 'w-full'} transition-all duration-300`}>
          {!activeSprint ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
              <Calendar className="h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active sprint</h3>
              <p className="mt-1 text-sm text-gray-500">Select a sprint to view its tasks</p>
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid h-[calc(100vh-20rem)] grid-cols-4 gap-6">
                {boardSettings.columns.map(column => (
                  <TaskColumn
                    key={column.id}
                    column={column}
                    tasks={tasks.filter(task => task.status === column.id)}
                    onTaskClick={setSelectedTask}
                    isOver={overColumn === column.id}
                    view={view}
                  />
                ))}
              </div>

              {activeId && (
                <div className="w-64 rounded-lg bg-white p-4 shadow-lg ring-2 ring-indigo-500">
                  {tasks.find(t => t.id === activeId)?.title}
                </div>
              )}
            </DndContext>
          )}
        </div>

        {/* Backlog Panel */}
        {showBacklogPanel && (
          <div className="w-80 rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Project Backlog</h3>
                <button
                  onClick={() => setShowBacklogPanel(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {backlogTasks.length} items not assigned to sprints
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-3">
                {backlogTasks.map(task => (
                  <div
                    key={task.id}
                    className="group rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            task.type === 'epic' ? 'bg-purple-100 text-purple-800' :
                            task.type === 'user_story' ? 'bg-blue-100 text-blue-800' :
                            task.type === 'bug' ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.type}
                          </span>
                          {task.story_points && (
                            <span className="text-xs text-gray-500">{task.story_points} pts</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignToSprint(task.id)}
                        className="opacity-0 group-hover:opacity-100 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-opacity"
                        disabled={!activeSprint}
                      >
                        Add to Sprint
                      </button>
                    </div>
                  </div>
                ))}
                {backlogTasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No backlog items available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
        <BacklogItemFormDialog
          isOpen={showBacklogForm}
          onClose={() => setShowBacklogForm(false)}
          onSubmit={handleCreateBacklogItem}
          preSelectedSprint={activeSprint?.id || null}
        />
      )}

      {showSettingsPanel && (
        <SprintSettingsPanel
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          board={board}
          activeSprint={activeSprint}
          sprints={sprints}
          onSprintChange={setActiveSprint}
          onSettingsUpdate={fetchBoardSettings}
        />
      )}
    </div>
  );
}