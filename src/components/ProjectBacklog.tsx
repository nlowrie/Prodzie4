import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, ArrowUpDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../lib/supabase';
import BacklogItemFormDialog from './BacklogItemFormDialog';
import SprintFormDialog from './SprintFormDialog';
import ProjectDetailPanel from './ProjectDetailPanel';
import BacklogItemTree from './BacklogItemTree';
import SprintCard from './SprintCard';
import { reindexTasks, getNextOrder } from '../utils/taskOrdering';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { Tables } from '../types/supabase';

type Task = Tables<'project_tasks'>;
type Sprint = Tables<'sprints'>;
type SortField = 'title' | 'type' | 'priority' | 'status' | 'due_date' | 'story_points';
type SortDirection = 'asc' | 'desc';

interface HierarchicalTask extends Task {
  children: HierarchicalTask[];
  level: number;
}

interface ProjectBacklogProps {
  scrollRef?: React.RefObject<HTMLElement>;
}

export default function ProjectBacklog({ scrollRef }: ProjectBacklogProps) {
  const { projectId } = useParams();
  const [backlogItems, setBacklogItems] = useState<HierarchicalTask[]>([]);
  const [independentStories, setIndependentStories] = useState<HierarchicalTask[]>([]);
  const [tasksAndBugs, setTasksAndBugs] = useState<HierarchicalTask[]>([]);
  const [allProjectTasks, setAllProjectTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBacklogForm, setShowBacklogForm] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: 'task' | 'user_story' | 'bug' | 'epic' | 'sprint';
  } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const findItemById = (id: string): Task | undefined => {
    return allProjectTasks.find(task => task.id === id);
  };

  useEffect(() => {
    fetchBacklogItems();
    fetchSprints();
  }, [projectId]);

  const fetchSprints = async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Error fetching sprints:', error);
      toast.error('Failed to load sprints');
    }
  };

  const fetchBacklogItems = async () => {
    try {
      setLoading(true);

      const { data: allTasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (tasksError) throw tasksError;
      
      setAllProjectTasks(allTasks || []);

      const backlogTasks = (allTasks || []).filter(task => !task.sprint_id);
      
      const { epics, independentStories, tasksAndBugs } = buildHierarchy(backlogTasks);
      setBacklogItems(sortItems(epics));
      setIndependentStories(sortItems(independentStories));
      setTasksAndBugs(sortItems(tasksAndBugs));
    } catch (error) {
      console.error('Error fetching backlog items:', error);
      toast.error('Failed to load backlog items');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (items: Task[]): { 
    epics: HierarchicalTask[], 
    independentStories: HierarchicalTask[],
    tasksAndBugs: HierarchicalTask[]
  } => {
    const itemMap = new Map<string, HierarchicalTask>();
    const epics: HierarchicalTask[] = [];
    const independentStories: HierarchicalTask[] = [];
    const tasksAndBugs: HierarchicalTask[] = [];

    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [], level: 0 });
    });

    items.forEach(item => {
      const node = itemMap.get(item.id)!;

      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else if (item.type === 'epic') {
        epics.push(node);
      } else if (item.type === 'user_story') {
        independentStories.push(node);
      } else if (item.type === 'task' || item.type === 'bug') {
        tasksAndBugs.push(node);
      }
    });

    const updateChildLevels = (node: HierarchicalTask, level: number) => {
      node.level = level;
      node.children.forEach(child => updateChildLevels(child, level + 1));
    };

    epics.forEach(epic => updateChildLevels(epic, 0));
    independentStories.forEach(story => updateChildLevels(story, 0));
    tasksAndBugs.forEach(item => updateChildLevels(item, 0));

    return { epics, independentStories, tasksAndBugs };
  };

  const handleCreateSprint = async (data: {
    name: string;
    start_date: string;
    end_date: string;
    goal: string;
    capacity: number;
  }) => {
    try {
      const { error } = await supabase
        .from('sprints')
        .insert({
          project_id: projectId,
          ...data
        });

      if (error) throw error;

      toast.success('Sprint created successfully');
      setShowSprintForm(false);
      fetchSprints();
    } catch (error) {
      console.error('Error creating sprint:', error);
      toast.error('Failed to create sprint');
    }
  };

  const handleCreateBacklogItem = async (data: Task) => {
    try {
      const nextOrder = await getNextOrder(projectId!, data.parent_id, data.sprint_id);

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
      fetchBacklogItems();
    } catch (error) {
      console.error('Error creating backlog item:', error);
      toast.error('Failed to create backlog item');
    }
  };

  const sortItems = (items: HierarchicalTask[]): HierarchicalTask[] => {
    const sortedItems = [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'due_date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'story_points':
          comparison = (a.story_points || 0) - (b.story_points || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sortedItems.map(item => ({
      ...item,
      children: sortItems(item.children)
    }));
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const isChildOf = (childId: string, parentId: string): boolean => {
    const child = findItemById(childId);
    if (!child) return false;
    if (child.parent_id === parentId) return true;
    if (child.parent_id) return isChildOf(child.parent_id, parentId);
    return false;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active) {
      setActiveId(null);
      return;
    }

    const activeItem = findItemById(active.id as string);
    if (!activeItem) {
      setActiveId(null);
      return;
    }

    try {
      // Handle dropping onto a sprint
      if (over.data.current?.type === 'sprint') {
        const sprintId = over.data.current.sprintId;
        
        // Get the next order value for the sprint
        const nextOrder = await getNextOrder(projectId!, null, sprintId);

        // Update the task
        const { error } = await supabase
          .from('project_tasks')
          .update({ 
            sprint_id: sprintId,
            parent_id: null,
            order: nextOrder
          })
          .eq('id', activeItem.id);

        if (error) throw error;

        // Get tasks for reindexing
        const sprintTasks = allProjectTasks.filter(t => t.sprint_id === sprintId);
        const originalGroupTasks = allProjectTasks.filter(t => 
          t.parent_id === activeItem.parent_id && 
          t.sprint_id === activeItem.sprint_id &&
          t.id !== activeItem.id
        );

        // Reindex both groups
        await Promise.all([
          reindexTasks(sprintTasks, null, sprintId),
          reindexTasks(originalGroupTasks, activeItem.parent_id, activeItem.sprint_id)
        ]);

        toast.success('Task added to sprint');
      } 
      // Handle reordering or nesting
      else {
        const overItem = findItemById(over.id as string);
        if (!overItem) {
          setActiveId(null);
          return;
        }

        // Prevent nesting an item under itself or its children
        if (isChildOf(overItem.id, activeItem.id)) {
          toast.error('Cannot nest an item under itself or its children');
          setActiveId(null);
          return;
        }

        const shouldNest = (
          (overItem.type === 'epic' && activeItem.type === 'user_story') ||
          (overItem.type === 'user_story' && (activeItem.type === 'task' || activeItem.type === 'bug'))
        );

        // Get the next order value
        const nextOrder = await getNextOrder(
          projectId!,
          shouldNest ? overItem.id : overItem.parent_id,
          overItem.sprint_id
        );

        // Update the active item
        const { error } = await supabase
          .from('project_tasks')
          .update({ 
            parent_id: shouldNest ? overItem.id : overItem.parent_id,
            sprint_id: overItem.sprint_id,
            order: nextOrder
          })
          .eq('id', activeItem.id);

        if (error) throw error;

        // Get tasks for reindexing
        const newGroupTasks = allProjectTasks.filter(t => 
          t.parent_id === (shouldNest ? overItem.id : overItem.parent_id) &&
          t.sprint_id === overItem.sprint_id
        );

        const originalGroupTasks = allProjectTasks.filter(t => 
          t.parent_id === activeItem.parent_id && 
          t.sprint_id === activeItem.sprint_id &&
          t.id !== activeItem.id
        );

        // Reindex both groups
        await Promise.all([
          reindexTasks(newGroupTasks, shouldNest ? overItem.id : overItem.parent_id, overItem.sprint_id),
          reindexTasks(originalGroupTasks, activeItem.parent_id, activeItem.sprint_id)
        ]);
        
        toast.success(shouldNest ? 'Item nested successfully' : 'Item reordered successfully');
      }

      await fetchBacklogItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to move item');
    }

    setActiveId(null);
  };

  const getPriorityColor = (priority: string) => {
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
  };

  const getTypeColor = (type: string) => {
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
  };

  const formatUserStory = (story: HierarchicalTask) => {
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
  };

  const handleItemClick = (item: Task | Sprint) => {
    if ('name' in item) {
      setSelectedItem({ id: item.id, type: 'sprint' });
    } else {
      setSelectedItem({ id: item.id, type: item.type as 'task' | 'user_story' | 'bug' | 'epic' });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-6" ref={scrollRef}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Project Backlog</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowSprintForm(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Sprint
          </button>
          <button
            onClick={() => setShowBacklogForm(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Backlog Item
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          {sprints.length > 0 && (
            <div>
              <h3 className="bg-gray-50 p-4 text-sm font-medium text-gray-700">
                Active Sprints
              </h3>
              <div>
                {sprints.map(sprint => (
                  <SprintCard
                    key={sprint.id}
                    sprint={sprint}
                    tasks={allProjectTasks.filter(task => task.sprint_id === sprint.id)}
                    onItemClick={handleItemClick}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-4 border-b border-gray-200 p-4 font-medium text-gray-500">
            <div className="col-span-2">
              <button
                onClick={() => handleSort('title')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Title</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
            <div>
              <button
                onClick={() => handleSort('priority')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Priority</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
            <div>
              <button
                onClick={() => handleSort('status')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Status</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
            <div>
              <button
                onClick={() => handleSort('story_points')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Points</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
            <div>
              <span>Assignee</span>
            </div>
            <div>
              <button
                onClick={() => handleSort('due_date')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Due Date</span>
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            {backlogItems.length === 0 && independentStories.length === 0 && tasksAndBugs.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center">
                <AlertCircle className="h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No backlog items found</p>
              </div>
            ) : (
              <>
                {backlogItems.length > 0 && (
                  <div>
                    <h3 className="border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                      Epics and Child Issues
                    </h3>
                    <BacklogItemTree
                      items={backlogItems}
                      expandedItems={expandedItems}
                      onToggleExpand={toggleItemExpansion}
                      getPriorityColor={getPriorityColor}
                      getTypeColor={getTypeColor}
                      formatUserStory={formatUserStory}
                      onItemClick={handleItemClick}
                    />
                  </div>
                )}

                {independentStories.length > 0 && (
                  <div>
                    <h3 className="border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                      Independent User Stories
                    </h3>
                    <BacklogItemTree
                      items={independentStories}
                      expandedItems={expandedItems}
                      onToggleExpand={toggleItemExpansion}
                      getPriorityColor={getPriorityColor}
                      getTypeColor={getTypeColor}
                      formatUserStory={formatUserStory}
                      onItemClick={handleItemClick}
                    />
                  </div>
                )}

                {tasksAndBugs.length > 0 && (
                  <div>
                    <h3 className="border-b border-gray-200 bg-gray-50 p-4 text-sm font-medium text-gray-700">
                      Independent Tasks and Bugs
                    </h3>
                    <BacklogItemTree
                      items={tasksAndBugs}
                      expandedItems={expandedItems}
                      onToggleExpand={toggleItemExpansion}
                      getPriorityColor={getPriorityColor}
                      getTypeColor={getTypeColor}
                      formatUserStory={formatUserStory}
                      onItemClick={handleItemClick}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="w-full min-w-[600px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      getTypeColor((findItemById(activeId)?.type || 'task'))
                    }`}>
                      {findItemById(activeId)?.type}
                    </span>
                    <span className="font-medium text-gray-900">
                      {findItemById(activeId)?.title}
                    </span>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    getPriorityColor((findItemById(activeId)?.priority || 'medium'))
                  }`}>
                    {findItemById(activeId)?.priority}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showBacklogForm && (
        <BacklogItemFormDialog
          isOpen={showBacklogForm}
          onClose={() => setShowBacklogForm(false)}
          onSubmit={handleCreateBacklogItem}
        />
      )}

      {showSprintForm && (
        <SprintFormDialog
          isOpen={showSprintForm}
          onClose={() => setShowSprintForm(false)}
          onSubmit={handleCreateSprint}
        />
      )}

      {selectedItem && (
        <ProjectDetailPanel
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          itemType={selectedItem.type}
          itemId={selectedItem.id}
          onItemUpdated={() => {
            fetchBacklogItems();
            fetchSprints();
          }}
        />
      )}
    </div>
  );
}