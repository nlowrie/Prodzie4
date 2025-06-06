import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import BacklogItemHierarchy from './BacklogItemHierarchy';
import ConfirmationDialog from './ConfirmationDialog';
import { Tables } from '../types/supabase';

interface ProjectDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'sprint' | 'task' | 'user_story' | 'bug' | 'epic';
  itemId: string;
  onItemUpdated: () => void;
}

export default function ProjectDetailPanel({ isOpen, onClose, itemType, itemId, onItemUpdated }: ProjectDetailPanelProps) {
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [parent, setParent] = useState<Tables<'project_tasks'> | null>(null);
  const [children, setChildren] = useState<Tables<'project_tasks'>[]>([]);
  const [sprint, setSprint] = useState<Tables<'sprints'> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      fetchItemData();
    }
  }, [isOpen, itemId, itemType]);

  const fetchItemData = async () => {
    try {
      setLoading(true);
      const table = itemType === 'sprint' ? 'sprints' : 'project_tasks';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      setFormData(data);

      // If it's a task, fetch related items
      if (itemType !== 'sprint') {
        // Fetch parent if exists
        if (data.parent_id) {
          const { data: parentData } = await supabase
            .from('project_tasks')
            .select('*')
            .eq('id', data.parent_id)
            .single();
          setParent(parentData);
        }

        // Fetch children
        const { data: childrenData } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('parent_id', data.id);
        setChildren(childrenData || []);

        // Fetch sprint if assigned
        if (data.sprint_id) {
          const { data: sprintData } = await supabase
            .from('sprints')
            .select('*')
            .eq('id', data.sprint_id)
            .single();
          setSprint(sprintData);
        }
      }
    } catch (error) {
      console.error('Error fetching item data:', error);
      toast.error('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (itemType === 'sprint') {
      if (!formData.name) newErrors.name = 'Sprint name is required';
      if (!formData.start_date) newErrors.start_date = 'Start date is required';
      if (!formData.end_date) newErrors.end_date = 'End date is required';
      if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
        newErrors.end_date = 'End date must be after start date';
      }
    } else {
      if (!formData.title) newErrors.title = 'Title is required';
      if (!formData.assignee) newErrors.assignee = 'Assignee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const table = itemType === 'sprint' ? 'sprints' : 'project_tasks';
      
      const { error } = await supabase
        .from(table)
        .update(formData)
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Changes saved successfully');
      onItemUpdated();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const table = itemType === 'sprint' ? 'sprints' : 'project_tasks';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
      onItemUpdated();
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 overflow-y-auto bg-white shadow-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-6">
          <h3 className="text-lg font-medium text-gray-900">
            {itemType === 'sprint' ? 'Sprint Details' : `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Details`}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-white text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {itemType !== 'sprint' && (
              <BacklogItemHierarchy
                parent={parent || undefined}
                sprint={sprint || undefined}
                children={children}
                onItemClick={(item) => {
                  if ('name' in item) {
                    setFormData(item);
                    setSprint(item);
                  } else {
                    setFormData(item);
                    fetchItemData();
                  }
                }}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {itemType === 'sprint' ? (
                <>
                  <div>
                    <label htmlFor="name\" className="block text-sm font-medium text-gray-700">
                      Sprint Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData?.name || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData?.start_date || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.start_date ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData?.end_date || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.end_date ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                      Sprint Goal
                    </label>
                    <textarea
                      id="goal"
                      name="goal"
                      rows={3}
                      value={formData?.goal || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                      Capacity (Story Points)
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData?.capacity || ''}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData?.title || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.title ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData?.type || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="epic">Epic</option>
                      <option value="user_story">User Story</option>
                      <option value="task">Task</option>
                      <option value="bug">Bug</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      {formData?.type === 'user_story' ? (
                        <>Description (Use format: "As a [user type], I want [action/feature] so that [benefit/value]")</>
                      ) : (
                        'Description'
                      )}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData?.description || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder={formData?.type === 'user_story' ? 'As a [user type], I want [action/feature] so that [benefit/value]' : ''}
                    />
                  </div>

                  <div>
                    <label htmlFor="acceptance_criteria" className="block text-sm font-medium text-gray-700">
                      Acceptance Criteria
                    </label>
                    <textarea
                      id="acceptance_criteria"
                      name="acceptance_criteria"
                      rows={3}
                      value={formData?.acceptance_criteria || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="story_points" className="block text-sm font-medium text-gray-700">
                      Story Points
                    </label>
                    <input
                      type="number"
                      id="story_points"
                      name="story_points"
                      value={formData?.story_points || ''}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData?.priority || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">
                      Assignee
                    </label>
                    <input
                      type="text"
                      id="assignee"
                      name="assignee"
                      value={formData?.assignee || ''}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors.assignee ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.assignee && (
                      <p className="mt-1 text-sm text-red-600">{errors.assignee}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      value={formData?.due_date || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      id="estimated_hours"
                      name="estimated_hours"
                      value={formData?.estimated_hours || ''}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData?.status || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="ready">Ready</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="labels" className="block text-sm font-medium text-gray-700">
                      Labels (comma-separated)
                    </label>
                    <input
                      type="text"
                      id="labels"
                      name="labels"
                      value={formData?.labels?.join(', ') || ''}
                      onChange={(e) => {
                        const labels = e.target.value.split(',').map(label => label.trim()).filter(Boolean);
                        setFormData(prev => ({ ...prev, labels }));
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="feature, frontend, urgent"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete ${itemType}`}
        message={`Are you sure you want to delete this ${itemType}? This action cannot be undone.`}
      />
    </div>
  );
}