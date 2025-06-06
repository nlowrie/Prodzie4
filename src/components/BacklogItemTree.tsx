import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableBacklogItem from './SortableBacklogItem';
import { Tables } from '../types/supabase';

interface HierarchicalTask extends Tables<'project_tasks'> {
  children: HierarchicalTask[];
  level: number;
}

interface BacklogItemTreeProps {
  items: HierarchicalTask[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getTypeColor: (type: string) => string;
  formatUserStory: (story: HierarchicalTask) => React.ReactNode;
  onItemClick?: (item: HierarchicalTask) => void;
}

export default function BacklogItemTree({
  items,
  expandedItems,
  onToggleExpand,
  getPriorityColor,
  getTypeColor,
  formatUserStory,
  onItemClick,
}: BacklogItemTreeProps) {
  const renderItems = (items: HierarchicalTask[]) => {
    return (
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <React.Fragment key={item.id}>
            <SortableBacklogItem
              item={item}
              isExpanded={expandedItems.has(item.id)}
              onToggleExpand={onToggleExpand}
              getPriorityColor={getPriorityColor}
              getTypeColor={getTypeColor}
              formatUserStory={formatUserStory}
              onItemClick={onItemClick}
            />
            {expandedItems.has(item.id) && item.children.length > 0 && (
              <div style={{ marginLeft: `${item.level * 2}rem` }}>
                {renderItems(item.children)}
              </div>
            )}
          </React.Fragment>
        ))}
      </SortableContext>
    );
  };

  return renderItems(items);
}