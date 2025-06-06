import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';

interface BacklogItemFormData {
  title: string;
  type: string;
  description: string;
  acceptance_criteria: string;
  story_points: number;
  priority: string;
  labels: string[];
  assignee: string;
  due_date: string;
  estimated_hours: number;
  status: string;
  parent_id: string | null;
  sprint_id: string | null;
}

interface BacklogItemFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BacklogItemFormData) => void;
  initialContent?: string;
  preSelectedSprint?: string | null;
}

const initialFormData: BacklogItemFormData = {
  title: '',
  type: 'user_story',
  description: '',
  acceptance_criteria: '',
  story_points: 0,
  priority: 'medium',
  labels: [],
  assignee: '',
  due_date: new Date().toISOString().split('T')[0],
  estimated_hours: 0,
  status: 'backlog',
  parent_id: null,
  sprint_id: null,
};

export default function BacklogItemFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialContent = '',
  preSelectedSprint = null,
}: BacklogItemFormDialogProps) {
  const { projectId } = useParams();
  const [formData, setFormData] = useState<BacklogItemFormData>({
    ...initialFormData,
    description: initialContent,
    sprint_id: preSelectedSprint,
  });
  const [availableParents, setAvailableParents] = useState<Tables<'project_tasks'>[]>([]);
  const [availableSprints, setAvailableSprints] = useState<Tables<'sprints'>[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSprints();
      fetchAvailableWorkflows();
      if (formData.type === 'user_story') {
        fetchAvailableParents('epic');
      } else if (formData.type === 'task' || formData.type === 'bug') {
        fetchAvailableParents('user_story');
      }
    }
  }, [isOpen, formData.type]);

  const fetchAvailableParents = async (parentType: string) => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', parentType);

      if (error) throw error;
      setAvailableParents(data || []);
    } catch (error) {
      console.error('Error fetching available parents:', error);
    }
  };

  const fetchAvailableSprints = async () => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAvailableSprints(data || []);
    } catch (error) {
      console.error('Error fetching available sprints:', error);
    }
  };

  const fetchAvailableWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) throw error;
      setAvailableWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching available workflows:', error);
    }
  };

  useEffect(() => {
    if (formData.workflow_id) {
      // When workflow changes, set the initial status from workflow statuses
      const workflow = availableWorkflows.find(w => w.id === formData.workflow_id);
      if (workflow && workflow.statuses.length > 0) {
        setFormData(prev => ({ ...prev, status: workflow.statuses[0] }));
      }
    }
  }, [formData.workflow_id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      setFormData(prev => ({ ...prev, [name]: value, parent_id: null }));
    } else if (name === 'labels') {
      setFormData(prev => ({
        ...prev,
        labels: value.split(',').map(label => label.trim()).filter(Boolean)
      }));
    } else if (name === 'workflow_id') {
      // Handle workflow selection
      const workflow = availableWorkflows.find(w => w.id === value);
      setFormData(prev => ({
        ...prev,
        workflow_id: value || null,
        // Reset status to first workflow status or 'backlog' if no workflow
        status: workflow?.statuses[0] || 'backlog'
      }));
    } else if (name === 'parent_id' || name === 'sprint_id') {
      // Convert empty string to null for parent_id and sprint_id
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Create Backlog Item</h2>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="epic">Epic</option>
                  <option value="user_story">User Story</option>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                </select>
              </div>

              {formData.type !== 'epic' && availableParents.length > 0 && (
                <div>
                  <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                    Parent {formData.type === 'user_story' ? 'Epic' : 'User Story'}
                  </label>
                  <select
                    id="parent_id"
                    name="parent_id"
                    value={formData.parent_id || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">None</option>
                    {availableParents.map(parent => (
                      <option key={parent.id} value={parent.id}>
                        {parent.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableSprints.length > 0 && (
                <div>
                  <label htmlFor="sprint_id" className="block text-sm font-medium text-gray-700">
                    Sprint Assignment
                  </label>
                  <select
                    id="sprint_id"
                    name="sprint_id"
                    value={formData.sprint_id || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">No Sprint (Backlog)</option>
                    {availableSprints.map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name} ({new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="workflow_id" className="block text-sm font-medium text-gray-700">
                  Workflow
                </label>
                <select
                  id="workflow_id"
                  name="workflow_id"
                  value={formData.workflow_id || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">No Workflow</option>
                  {availableWorkflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {formData.type === 'user_story' ? (
                    <>
                      Description (Use format: "As a [user type], I want [action/feature] so that [benefit/value]")
                    </>
                  ) : (
                    'Description'
                  )}
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={formData.type === 'user_story' ? 'As a [user type], I want [action/feature] so that [benefit/value]' : ''}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="acceptance_criteria" className="block text-sm font-medium text-gray-700">
                  Acceptance Criteria
                </label>
                <textarea
                  id="acceptance_criteria"
                  name="acceptance_criteria"
                  rows={3}
                  value={formData.acceptance_criteria}
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
                  value={formData.story_points}
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
                  value={formData.priority}
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
                  value={formData.assignee}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
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
                  value={formData.estimated_hours}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="workflow_id" className="block text-sm font-medium text-gray-700">
                  Workflow
                </label>
                <select
                  id="workflow_id"
                  name="workflow_id"
                  value={formData.workflow_id || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">No Workflow</option>
                  {availableWorkflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name} ({workflow.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {formData.workflow_id ? (
                    // Show workflow statuses if a workflow is selected
                    availableWorkflows
                      .find(w => w.id === formData.workflow_id)
                      ?.statuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))
                  ) : (
                    // Show default statuses if no workflow is selected
                    <>
                      <option value="backlog">Backlog</option>
                      <option value="ready">Ready</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </>
                  )}
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
                  value={formData.labels.join(', ')}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="feature, frontend, urgent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}