import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, ArrowLeft, Edit2, Download } from 'lucide-react';
import { ChromePicker } from 'react-color';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Tables } from '../types/supabase';

interface Column {
  id: string;
  name: string;
  limit?: number;
  color: string;
}

interface CardField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

interface BoardConfig {
  name: string;
  description: string;
  columns: Column[];
  cardFields: CardField[];
  allowAttachments: boolean;
  allowedFileTypes: string[];
  defaultView: 'compact' | 'detailed';
  accessLevel: 'private' | 'team' | 'public';
  importBacklogItems: boolean;
  workflowId?: string;
}

const defaultCardField: CardField = {
  id: '',
  name: '',
  type: 'text',
  required: false,
  placeholder: '',
  helpText: '',
};

const defaultCardFields: CardField[] = [
  { 
    id: '1', 
    name: 'Title', 
    type: 'text', 
    required: true,
    placeholder: 'Enter task title',
    helpText: 'A brief, descriptive title for the task'
  },
  { 
    id: '2', 
    name: 'Type', 
    type: 'select', 
    required: true, 
    options: ['epic', 'user_story', 'task', 'bug'],
    helpText: 'The type of work item'
  },
  { 
    id: '3', 
    name: 'Description', 
    type: 'textarea', 
    required: false,
    placeholder: 'Describe the task in detail',
    helpText: 'Detailed description of what needs to be done'
  },
  { 
    id: '4', 
    name: 'Acceptance Criteria', 
    type: 'textarea', 
    required: false,
    placeholder: 'Define when this task is considered complete',
    helpText: 'Clear criteria for task completion'
  },
  { 
    id: '5', 
    name: 'Story Points', 
    type: 'select', 
    required: false, 
    options: ['1', '2', '3', '5', '8', '13', '21'],
    helpText: 'Effort estimation using story points'
  },
  { 
    id: '6', 
    name: 'Priority', 
    type: 'select', 
    required: true, 
    options: ['low', 'medium', 'high'],
    helpText: 'Task priority level'
  },
  { 
    id: '7', 
    name: 'Labels', 
    type: 'multiselect', 
    required: false,
    options: ['frontend', 'backend', 'design', 'testing', 'documentation'],
    helpText: 'Tags to categorize the task'
  },
  { 
    id: '8', 
    name: 'Assignee', 
    type: 'text', 
    required: true,
    placeholder: 'Enter assignee name',
    helpText: 'Person responsible for this task'
  },
  { 
    id: '9', 
    name: 'Due Date', 
    type: 'date', 
    required: true,
    helpText: 'When this task should be completed'
  },
  { 
    id: '10', 
    name: 'Estimated Hours', 
    type: 'number', 
    required: false,
    placeholder: 'Enter estimated hours',
    helpText: 'Time estimation in hours'
  },
  { 
    id: '11', 
    name: 'Status', 
    type: 'select', 
    required: true, 
    options: ['backlog', 'ready', 'in_progress', 'review', 'done'],
    helpText: 'Current status of the task'
  }
];

const defaultColumns: Column[] = [
  { id: 'backlog', name: 'Backlog', color: '#F3F4F6' },
  { id: 'ready', name: 'Ready', color: '#DBEAFE' },
  { id: 'in_progress', name: 'In Progress', color: '#FEF3C7' },
  { id: 'review', name: 'Review', color: '#F3E8FF' },
  { id: 'done', name: 'Done', color: '#DCFCE7' }
];

interface KanbanBoardConfigProps {
  existingBoard?: Tables<'kanban_boards'>;
}

export default function KanbanBoardConfig({ existingBoard }: KanbanBoardConfigProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableWorkflows, setAvailableWorkflows] = useState<{ id: string; name: string }[]>([]);
  const [config, setConfig] = useState<BoardConfig>({
    name: '',
    description: '',
    columns: [
      { id: '1', name: 'To Do', color: '#F3F4F6' },
      { id: '2', name: 'In Progress', color: '#FEF3C7' },
      { id: '3', name: 'Done', color: '#DCFCE7' }
    ],
    cardFields: defaultCardFields,
    allowAttachments: true,
    allowedFileTypes: ['image/*', 'application/pdf', '.doc,.docx'],
    defaultView: 'detailed',
    accessLevel: 'team',
    importBacklogItems: true,
    workflowId: undefined
  });

  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<CardField | null>(null);
  const [backlogItemsCount, setBacklogItemsCount] = useState(0);
  const [backlogItemsPreview, setBacklogItemsPreview] = useState<Tables<'project_tasks'>[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  useEffect(() => {
    fetchWorkflows();
  }, [projectId]);

  useEffect(() => {
    if (existingBoard) {
      fetchExistingWorkflow(existingBoard.id);
    }
  }, [existingBoard]);

  useEffect(() => {
    if (existingBoard) {
      setConfig({
        name: existingBoard.name,
        description: existingBoard.description || '',
        columns: existingBoard.columns as Column[],
        cardFields: existingBoard.card_fields as CardField[],
        allowAttachments: existingBoard.allow_attachments,
        allowedFileTypes: existingBoard.allowed_file_types,
        defaultView: existingBoard.default_view as 'compact' | 'detailed',
        accessLevel: existingBoard.access_level as 'private' | 'team' | 'public',
        importBacklogItems: false, // Don't show import option for existing boards
      });
    } else {
      // Fetch backlog items for new boards
      fetchBacklogItems();
    }
  }, [existingBoard, projectId]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name')
        .eq('project_id', projectId)
        .eq('type', 'kanban');
      
      if (error) throw error;
      setAvailableWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load available workflows');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingWorkflow = async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('workflow_board_assignments')
        .select('workflow_id')
        .eq('board_id', boardId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }
      }
      
      if (data) {
        setConfig(prev => ({ ...prev, workflowId: data.workflow_id }));
        // Fetch and apply workflow statuses as columns
        const { data: workflow, error: workflowError } = await supabase
          .from('workflows')
          .select('statuses')
          .eq('id', data.workflow_id)
          .single();
        
        if (workflowError) throw workflowError;
        
        if (workflow && workflow.statuses) {
          const workflowColumns = workflow.statuses.map((status: string, index: number) => ({
            id: crypto.randomUUID(),
            name: status,
            color: config.columns[index]?.color || '#F3F4F6'
          }));
          setConfig(prev => ({ ...prev, columns: workflowColumns }));
        }
      }
    } catch (error) {
      console.error('Error fetching existing workflow:', error);
    }
  };

  const handleWorkflowChange = async (workflowId: string) => {
    if (!workflowId) {
      setConfig(prev => ({ ...prev, workflowId: undefined }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('statuses')
        .eq('id', workflowId)
        .single();
      
      if (error) throw error;
      
      if (data && data.statuses) {
        const workflowColumns = data.statuses.map((status: string, index: number) => ({
          id: crypto.randomUUID(),
          name: status,
          color: config.columns[index]?.color || '#F3F4F6'
        }));
        setConfig(prev => ({ 
          ...prev, 
          workflowId,
          columns: workflowColumns 
        }));
      }
    } catch (error) {
      console.error('Error fetching workflow statuses:', error);
      toast.error('Failed to load workflow configuration');
    }
  };

  const fetchBacklogItems = async () => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .is('sprint_id', null) // Only get items not assigned to sprints
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBacklogItemsCount(data?.length || 0);
      setBacklogItemsPreview(data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching backlog items:', error);
    }
  };

  const addColumn = () => {
    setConfig(prev => ({
      ...prev,
      columns: [...prev.columns, { id: crypto.randomUUID(), name: '', color: '#F3F4F6' }],
    }));
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === id ? { ...col, ...updates } : col
      ),
    }));
  };

  const removeColumn = (id: string) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== id),
    }));
  };

  const moveColumn = (id: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const index = prev.columns.findIndex(col => col.id === id);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.columns.length - 1)
      ) {
        return prev;
      }

      const newColumns = [...prev.columns];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];

      return { ...prev, columns: newColumns };
    });
  };

  const addCardField = () => {
    const newField: CardField = {
      ...defaultCardField,
      id: crypto.randomUUID(),
      name: 'New Field',
    };
    setConfig(prev => ({
      ...prev,
      cardFields: [...prev.cardFields, newField],
    }));
    setEditingField(newField);
  };

  const updateCardField = (id: string, updates: Partial<CardField>) => {
    setConfig(prev => ({
      ...prev,
      cardFields: prev.cardFields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeCardField = (id: string) => {
    setConfig(prev => ({
      ...prev,
      cardFields: prev.cardFields.filter(field => field.id !== id),
    }));
  };

  const moveCardField = (id: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const index = prev.cardFields.findIndex(field => field.id === id);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prev.cardFields.length - 1)
      ) {
        return prev;
      }

      const newFields = [...prev.cardFields];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

      return { ...prev, cardFields: newFields };
    });
  };

  const importBacklogItemsToBoard = async (boardId: string) => {
    try {
      // Fetch all backlog items not assigned to sprints
      const { data: backlogItems, error: fetchError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .is('sprint_id', null);

      if (fetchError) throw fetchError;

      if (!backlogItems || backlogItems.length === 0) {
        return;
      }

      // Map task statuses to board columns
      const statusMapping: Record<string, string> = {};
      config.columns.forEach(column => {
        // Map common status values to column IDs
        const columnName = column.name.toLowerCase();
        const columnId = column.id;
        
        if (columnName.includes('backlog') || columnName.includes('todo')) {
          statusMapping['backlog'] = columnId;
        } else if (columnName.includes('ready') || columnName.includes('planned')) {
          statusMapping['ready'] = columnId;
        } else if (columnName.includes('progress') || columnName.includes('doing')) {
          statusMapping['in_progress'] = columnId;
        } else if (columnName.includes('review') || columnName.includes('testing')) {
          statusMapping['review'] = columnId;
        } else if (columnName.includes('done') || columnName.includes('complete')) {
          statusMapping['done'] = columnId;
        }
      });

      // Update tasks to map their status to the appropriate column
      const updates = backlogItems.map(item => {
        const mappedStatus = statusMapping[item.status] || config.columns[0]?.id || 'backlog';
        return {
          id: item.id,
          status: mappedStatus
        };
      });

      // Batch update task statuses
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('project_tasks')
          .update({ status: update.status })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating task status:', updateError);
        }
      }

      toast.success(`Imported ${backlogItems.length} items from project backlog`);
    } catch (error) {
      console.error('Error importing backlog items:', error);
      toast.error('Failed to import some backlog items');
    }
  };

  const handleSave = async () => {
    if (!config.name) {
      toast.error('Board name is required');
      return;
    }

    if (config.columns.length === 0) {
      toast.error('At least one column is required');
      return;
    }

    if (config.cardFields.length === 0) {
      toast.error('At least one card field is required');
      return;
    }

    try {
      setSaving(true);

      if (existingBoard) {
        const { error } = await supabase
          .from('kanban_boards')
          .update({
            name: config.name,
            description: config.description,
            columns: config.columns,
            card_fields: config.cardFields,
            allow_attachments: config.allowAttachments,
            allowed_file_types: config.allowedFileTypes,
            default_view: config.defaultView,
            access_level: config.accessLevel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBoard.id);

        if (error) throw error;
        toast.success('Board updated successfully');
      } else {
        const { data, error } = await supabase
          .from('kanban_boards')
          .insert({
            project_id: projectId,
            name: config.name,
            description: config.description,
            columns: config.columns,
            card_fields: config.cardFields,
            allow_attachments: config.allowAttachments,
            allowed_file_types: config.allowedFileTypes,
            default_view: config.defaultView,
            access_level: config.accessLevel,
          })
          .select()
          .single();

        if (error) throw error;

        // Import backlog items if requested
        if (config.importBacklogItems && backlogItemsCount > 0) {
          await importBacklogItemsToBoard(data.id);
        }

        toast.success('Board created successfully');
        
        // Navigate to the new board
        navigate(`/dashboard/projects/${projectId}/delivery/kanban/${data.id}`);
        return;
      }

      navigate(`/dashboard/projects/${projectId}/delivery`);
    } catch (error) {
      console.error('Error saving board:', error);
      toast.error('Failed to save board');
    } finally {
      setSaving(false);
    }
  };

  const renderFieldEditor = () => {
    if (!editingField) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Edit Card Field</h3>
              <button
                onClick={() => setEditingField(null)}
                className="rounded p-1 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Field Name</label>
                <input
                  type="text"
                  value={editingField.name}
                  onChange={e => setEditingField({ ...editingField, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Field Type</label>
                <select
                  value={editingField.type}
                  onChange={e => setEditingField({ 
                    ...editingField, 
                    type: e.target.value as CardField['type'],
                    options: e.target.value === 'select' || e.target.value === 'multiselect' ? [] : undefined
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Select (Single)</option>
                  <option value="multiselect">Select (Multiple)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Placeholder</label>
                <input
                  type="text"
                  value={editingField.placeholder || ''}
                  onChange={e => setEditingField({ ...editingField, placeholder: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Help Text</label>
                <input
                  type="text"
                  value={editingField.helpText || ''}
                  onChange={e => setEditingField({ ...editingField, helpText: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              {(editingField.type === 'select' || editingField.type === 'multiselect') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Options (one per line)</label>
                  <textarea
                    value={editingField.options?.join('\n') || ''}
                    onChange={e => setEditingField({ 
                      ...editingField, 
                      options: e.target.value.split('\n').filter(Boolean)
                    })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="option1&#10;option2&#10;option3"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingField.required}
                    onChange={e => setEditingField({ ...editingField, required: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Required Field</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingField(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateCardField(editingField.id, editingField);
                  setEditingField(null);
                }}
                className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Save Field
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewCard = () => {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="space-y-3">
          {config.cardFields.slice(0, 6).map(field => (
            <div key={field.id}>
              <label className="text-xs font-medium text-gray-500">
                {field.name}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1">
                {field.type === 'text' && (
                  <div className="h-4 w-full rounded bg-gray-100" />
                )}
                {field.type === 'textarea' && (
                  <div className="h-8 w-full rounded bg-gray-100" />
                )}
                {field.type === 'select' && (
                  <div className="h-6 w-24 rounded bg-gray-100" />
                )}
                {field.type === 'multiselect' && (
                  <div className="flex space-x-1">
                    <div className="h-5 w-12 rounded bg-blue-100" />
                    <div className="h-5 w-16 rounded bg-green-100" />
                  </div>
                )}
                {field.type === 'date' && (
                  <div className="h-6 w-32 rounded bg-gray-100" />
                )}
                {field.type === 'number' && (
                  <div className="h-6 w-16 rounded bg-gray-100" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBacklogImportSection = () => {
    if (existingBoard || backlogItemsCount === 0) return null;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Import Backlog Items</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="importBacklog"
              checked={config.importBacklogItems}
              onChange={e => setConfig(prev => ({ ...prev, importBacklogItems: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="importBacklog" className="text-sm font-medium text-gray-700">
              Import existing backlog items ({backlogItemsCount} items available)
            </label>
          </div>
          
          {config.importBacklogItems && (
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Import Details</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    All {backlogItemsCount} backlog items will be imported and placed in appropriate columns based on their current status.
                  </p>
                  {backlogItemsPreview.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-blue-900">Preview of items to import:</p>
                      <ul className="mt-1 space-y-1">
                        {backlogItemsPreview.map(item => (
                          <li key={item.id} className="text-xs text-blue-700">
                            • {item.title} ({item.type}, {item.status})
                          </li>
                        ))}
                        {backlogItemsCount > 5 && (
                          <li className="text-xs text-blue-600">
                            ... and {backlogItemsCount - 5} more items
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/dashboard/projects/${projectId}/delivery`)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Boards
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {existingBoard ? 'Edit Kanban Board' : 'Create Kanban Board'}
          </h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setIsPreviewVisible(!isPreviewVisible)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : existingBoard ? 'Save Changes' : 'Save & Launch Board'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Board Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Board Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Board Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Workflow
                </label>
                <select
                  value={config.workflowId || ''}
                  onChange={e => handleWorkflowChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={loading}
                >
                  <option value="">No workflow</option>
                  {availableWorkflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {loading ? 'Loading workflows...' : 
                    config.workflowId ? 'The board columns will be synchronized with the workflow statuses.' :
                    'Select a workflow to automatically set up and synchronize board columns with workflow statuses.'}
                </p>
              </div>
            </div>
          </div>

          {/* Import Backlog Items */}
          {renderBacklogImportSection()}

          {/* Card Fields Configuration */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Card Fields</h2>
              <button
                onClick={addCardField}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Field
              </button>
            </div>
            <div className="space-y-4">
              {config.cardFields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{field.name}</span>
                        {field.required && (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            Required
                          </span>
                        )}
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          {field.type}
                        </span>
                      </div>
                      {field.helpText && (
                        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                      )}
                      {field.options && field.options.length > 0 && (
                        <p className="mt-1 text-xs text-gray-400">
                          Options: {field.options.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingField(field)}
                        className="rounded p-1 hover:bg-gray-100"
                      >
                        <Edit2 className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => moveCardField(field.id, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveCardField(field.id, 'down')}
                        disabled={index === config.cardFields.length - 1}
                        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeCardField(field.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columns Configuration */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Columns</h2>
              <button
                onClick={addColumn}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Column
              </button>
            </div>
            <div className="space-y-4">
              {config.columns.map((column, index) => (
                <div key={column.id} className="relative rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={column.name}
                        onChange={e => updateColumn(column.id, { name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        WIP Limit
                      </label>
                      <input
                        type="number"
                        value={column.limit || ''}
                        onChange={e => updateColumn(column.id, { limit: parseInt(e.target.value) || undefined })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Color
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <button
                          onClick={() => setShowColorPicker(showColorPicker === column.id ? null : column.id)}
                          className="h-8 w-8 rounded-md border border-gray-300"
                          style={{ backgroundColor: column.color }}
                        />
                        {showColorPicker === column.id && (
                          <div className="absolute z-10">
                            <div
                              className="fixed inset-0"
                              onClick={() => setShowColorPicker(null)}
                            />
                            <ChromePicker
                              color={column.color}
                              onChange={color => updateColumn(column.id, { color: color.hex })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end space-x-2">
                      <button
                        onClick={() => moveColumn(column.id, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveColumn(column.id, 'down')}
                        disabled={index === config.columns.length - 1}
                        className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeColumn(column.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Board Preferences */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Board Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default View
                </label>
                <select
                  value={config.defaultView}
                  onChange={e => setConfig(prev => ({ ...prev, defaultView: e.target.value as 'compact' | 'detailed' }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="compact">Compact</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Access Level
                </label>
                <select
                  value={config.accessLevel}
                  onChange={e => setConfig(prev => ({ ...prev, accessLevel: e.target.value as 'private' | 'team' | 'public' }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="private">Private</option>
                  <option value="team">Team</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.allowAttachments}
                    onChange={e => setConfig(prev => ({ ...prev, allowAttachments: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Attachments</span>
                </label>
              </div>
              {config.allowAttachments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={config.allowedFileTypes.join(', ')}
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      allowedFileTypes: e.target.value.split(',').map(type => type.trim())
                    }))}
                    placeholder=".pdf, .doc, .docx, .png, .jpg"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Board Preview */}
        {isPreviewVisible && (
          <div className="sticky top-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Preview</h2>
            
            {/* Form Preview */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-700">Card Creation Form</h3>
              {renderPreviewCard()}
            </div>

            {/* Board Layout Preview */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-700">Board Layout</h3>
              <div className="grid grid-cols-2 gap-4">
                {config.columns.slice(0, 4).map(column => (
                  <div
                    key={column.id}
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: column.color }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{column.name || 'Unnamed Column'}</h4>
                      {column.limit && (
                        <span className="text-sm text-gray-500">0/{column.limit}</span>
                      )}
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="rounded bg-white p-2 shadow-sm">
                        <div className="text-xs text-gray-500">Sample Task</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import Preview */}
            {!existingBoard && config.importBacklogItems && backlogItemsCount > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-4 text-sm font-medium text-gray-700">Import Preview</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {backlogItemsCount} items will be imported and distributed across columns based on their status.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {config.columns.slice(0, 4).map(column => {
                      const matchingItems = backlogItemsPreview.filter(item => {
                        const columnName = column.name.toLowerCase();
                        if (columnName.includes('backlog') && item.status === 'backlog') return true;
                        if (columnName.includes('ready') && item.status === 'ready') return true;
                        if (columnName.includes('progress') && item.status === 'in_progress') return true;
                        if (columnName.includes('review') && item.status === 'review') return true;
                        if (columnName.includes('done') && item.status === 'done') return true;
                        return false;
                      });
                      
                      return (
                        <div key={column.id} className="text-xs">
                          <div className="font-medium">{column.name}</div>
                          <div className="text-gray-500">{matchingItems.length} items</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {renderFieldEditor()}
    </div>
  );
}