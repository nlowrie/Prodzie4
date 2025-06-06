import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';

interface CardField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

interface ConfigurableBacklogItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  boardId?: string;
  initialContent?: string;
}

export default function ConfigurableBacklogItemForm({
  isOpen,
  onClose,
  onSubmit,
  boardId,
  initialContent = '',
}: ConfigurableBacklogItemFormProps) {
  const { projectId } = useParams();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [cardFields, setCardFields] = useState<CardField[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableParents, setAvailableParents] = useState<Tables<'project_tasks'>[]>([]);

  useEffect(() => {
    if (isOpen && boardId) {
      fetchBoardConfiguration();
    }
  }, [isOpen, boardId]);

  useEffect(() => {
    if (formData.type === 'user_story') {
      fetchAvailableParents('epic');
    } else if (formData.type === 'task' || formData.type === 'bug') {
      fetchAvailableParents('user_story');
    }
  }, [formData.type]);

  const fetchBoardConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('card_fields')
        .eq('id', boardId)
        .single();

      if (error) throw error;

      const fields = data.card_fields as CardField[];
      setCardFields(fields);

      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      fields.forEach(field => {
        if (field.name.toLowerCase() === 'description') {
          initialData[field.name.toLowerCase().replace(/\s+/g, '_')] = initialContent;
        } else if (field.type === 'multiselect') {
          initialData[field.name.toLowerCase().replace(/\s+/g, '_')] = [];
        } else if (field.type === 'date') {
          initialData[field.name.toLowerCase().replace(/\s+/g, '_')] = new Date().toISOString().split('T')[0];
        } else {
          initialData[field.name.toLowerCase().replace(/\s+/g, '_')] = '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching board configuration:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Transform form data to match the expected structure
    const transformedData = {
      title: formData.title || '',
      type: formData.type || 'task',
      description: formData.description || '',
      acceptance_criteria: formData.acceptance_criteria || '',
      story_points: parseInt(formData.story_points) || 0,
      priority: formData.priority || 'medium',
      labels: Array.isArray(formData.labels) ? formData.labels : 
              typeof formData.labels === 'string' ? formData.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      assignee: formData.assignee || '',
      due_date: formData.due_date || new Date().toISOString().split('T')[0],
      estimated_hours: parseInt(formData.estimated_hours) || 0,
      status: formData.status || 'backlog',
      parent_id: formData.parent_id || null,
    };

    onSubmit(transformedData);
  };

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (field: CardField) => {
    const fieldKey = field.name.toLowerCase().replace(/\s+/g, '_');
    const value = formData[fieldKey] || '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={e => handleChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={e => handleChange(fieldKey, e.target.value)}
            placeholder={field.placeholder}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={e => handleChange(fieldKey, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          />
        );

      case 'select':
        // Special handling for parent_id field
        if (fieldKey === 'parent_id' || field.name.toLowerCase().includes('parent')) {
          return (
            <select
              value={value}
              onChange={e => handleChange(fieldKey, e.target.value || null)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required={field.required}
            >
              <option value="">None</option>
              {availableParents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.title}
                </option>
              ))}
            </select>
          );
        }

        return (
          <select
            value={value}
            onChange={e => handleChange(fieldKey, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required={field.required}
          >
            <option value="">Select {field.name}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="mt-1">
            {field.options?.map(option => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={e => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange(fieldKey, [...currentValues, option]);
                    } else {
                      handleChange(fieldKey, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {cardFields.map(field => (
                <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.name}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                  {field.helpText && (
                    <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                  )}
                </div>
              ))}
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