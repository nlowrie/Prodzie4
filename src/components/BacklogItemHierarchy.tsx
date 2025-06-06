import React from 'react';
import { Tables } from '../types/supabase';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface HierarchyProps {
  parent?: Tables<'project_tasks'>;
  sprint?: Tables<'sprints'>;
  children: Tables<'project_tasks'>[];
  onItemClick?: (item: Tables<'project_tasks'> | Tables<'sprints'>) => void;
}

export default function BacklogItemHierarchy({
  parent,
  sprint,
  children,
  onItemClick,
}: HierarchyProps) {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user_story':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'bug':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Item Hierarchy</h3>
      
      <div className="space-y-6">
        {/* Parent Relationship */}
        {parent && (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="relative flex items-start">
              <ArrowUpRight className="h-6 w-6 text-gray-400 mr-2" />
              <div 
                className={`flex-1 cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50`}
                onClick={() => onItemClick?.(parent)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(parent.type)}`}>
                      {parent.type}
                    </span>
                    <span className="text-sm font-medium text-gray-900">Parent</span>
                  </div>
                </div>
                <h4 className="text-sm font-medium text-gray-700">{parent.title}</h4>
              </div>
            </div>
          </div>
        )}

        {/* Sprint Assignment */}
        {sprint && (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="relative flex items-start">
              <ArrowRight className="h-6 w-6 text-gray-400 mr-2" />
              <div 
                className="flex-1 cursor-pointer rounded-lg border border-indigo-200 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
                onClick={() => onItemClick?.(sprint)}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800">
                      Sprint
                    </span>
                    <span className="text-sm font-medium text-gray-900">Assigned Sprint</span>
                  </div>
                </div>
                <h4 className="text-sm font-medium text-gray-700">{sprint.name}</h4>
              </div>
            </div>
          </div>
        )}

        {/* Child Items */}
        {children.length > 0 && (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="relative">
              <div className="flex items-center mb-3">
                <ArrowDownRight className="h-6 w-6 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  Child Items ({children.length})
                </span>
              </div>
              <div className="ml-8 space-y-3">
                {children.map(child => (
                  <div
                    key={child.id}
                    className="cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
                    onClick={() => onItemClick?.(child)}
                  >
                    <div className="mb-1 flex items-center space-x-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeColor(child.type)}`}>
                        {child.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-700">{child.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}