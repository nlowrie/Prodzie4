import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, Tag, Clock, GripVertical } from 'lucide-react';
import { Tables } from '../types/supabase';

interface HierarchicalTask extends Tables<'project_tasks'> {
  children: HierarchicalTask[];
  level: number;
}

interface SortableBacklogItemProps {
  item: HierarchicalTask;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getTypeColor: (type: string) => string;
  formatUserStory: (story: HierarchicalTask) => React.ReactNode;
  onItemClick?: (item: HierarchicalTask) => void;
}

export default function SortableBacklogItem({
  item,
  isExpanded,
  onToggleExpand,
  getPriorityColor,
  getTypeColor,
  formatUserStory,
  onItemClick,
}: SortableBacklogItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: item.id,
    data: {
      type: item.type,
      level: item.level,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${item.level * 2}rem`,
    opacity: isDragging ? 0.5 : 1,
  };

  const shouldShowDetails = item.type !== 'epic' && (!item.children || item.children.length === 0);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`
        relative
        ${isOver ? 'before:absolute before:inset-0 before:border-2 before:border-indigo-500 before:rounded-lg before:pointer-events-none' : ''}
      `}
    >
      <div
        className={`
          grid grid-cols-7 gap-4 border-t border-gray-200 p-4 
          ${isDragging ? 'bg-gray-50 shadow-lg' : 'hover:bg-gray-50'} 
          cursor-pointer
          transition-colors duration-200
        `}
        onClick={() => onItemClick?.(item)}
      >
        <div className="col-span-2 flex items-center space-x-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>
          
          {item.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(item.id);
              }}
              className="p-1 hover:bg-gray-100 rounded"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse section" : "Expand section"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(item.type)}`}>
            {item.type}
          </span>
          <span className="font-medium text-gray-900">{item.title}</span>
        </div>
        <div>
          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
        </div>
        <div>
          <span className="text-sm text-gray-500">{item.status}</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">{item.story_points || '-'}</span>
        </div>
        <div>
          <span className="text-sm text-gray-500">{item.assignee}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="mr-1 h-4 w-4" />
          {new Date(item.due_date).toLocaleDateString()}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4" style={{ marginLeft: `${item.level * 2}rem` }}>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {shouldShowDetails && (
              <>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1">
                    {item.type === 'user_story' ? formatUserStory(item) : (
                      <div className="text-sm text-gray-700">{item.description || 'No description'}</div>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Acceptance Criteria</dt>
                  <dd className="mt-1 text-sm text-gray-900">{item.acceptance_criteria || 'No acceptance criteria'}</dd>
                </div>
              </>
            )}
            {item.labels && item.labels.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Labels</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {item.labels.map((label, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {label}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}