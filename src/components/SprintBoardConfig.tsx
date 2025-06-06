import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, ArrowLeft, Edit2 } from 'lucide-react';
import { ChromePicker } from 'react-color';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Column {
  id: string;
  name: string;
  limit?: number;
  color: string;
}

interface SprintBoardConfig {
  name: string;
  description: string;
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
  workflowId?: string;
}

const defaultConfig: SprintBoardConfig = {
  name: '',
  description: '',
  columns: [
    { id: 'todo', name: 'To Do', color: '#F3F4F6' },
    { id: 'in_progress', name: 'In Progress', color: '#FEF3C7' },
    { id: 'review', name: 'Review', color: '#F3E8FF' },
    { id: 'done', name: 'Done', color: '#DCFCE7' }
  ],
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
};

const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34];
const linear = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SprintBoardConfig() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableWorkflows, setAvailableWorkflows] = useState<{ id: string; name: string }[]>([]);
  const [config, setConfig] = useState<SprintBoardConfig>({
    ...defaultConfig,
    workflowId: undefined
  });
  const [saving, setSaving] = useState(false);
  const [customScaleInput, setCustomScaleInput] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [projectId]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name')
        .eq('project_id', projectId)
        .eq('type', 'sprint');
      
      if (error) throw error;
      setAvailableWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load available workflows');
    } finally {
      setLoading(false);
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

  const handleCustomScaleChange = (value: string) => {
    setCustomScaleInput(value);
    const numbers = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    setConfig(prev => ({ ...prev, customScale: numbers }));
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

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('sprint_boards')
        .insert({
          project_id: projectId,
          name: config.name,
          description: config.description,
          settings: {
            columns: config.columns,
            sprintDuration: config.sprintDuration,
            workingDaysPerWeek: config.workingDaysPerWeek,
            teamCapacity: config.teamCapacity,
            storyPointScale: config.storyPointScale,
            customScale: config.customScale,
            sprintNamingPattern: config.sprintNamingPattern,
            ceremonies: config.ceremonies,
            autoCreateSprints: config.autoCreateSprints,
            rolloverUnfinishedItems: config.rolloverUnfinishedItems,
            burndownChartType: config.burndownChartType,
          },
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Sprint board created successfully');
      navigate(`/dashboard/projects/${projectId}/delivery/sprint/${data.id}`);
    } catch (error) {
      console.error('Error saving sprint board:', error);
      toast.error('Failed to save sprint board');
    } finally {
      setSaving(false);
    }
  };

  const renderSprintTimeline = () => {
    const today = new Date();
    const sprintStart = new Date(today);
    const sprintEnd = new Date(today);
    sprintEnd.setDate(sprintEnd.getDate() + (config.sprintDuration * 7));

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-medium text-gray-700">Sprint Timeline Preview</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 w-0 rounded-full bg-indigo-600 transition-all duration-500" 
                    style={{ width: '0%' }} />
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{sprintStart.toLocaleDateString()}</span>
              <span>{sprintEnd.toLocaleDateString()}</span>
            </div>
            <div className="text-sm text-gray-500">
              <p>Working days: {config.workingDaysPerWeek * config.sprintDuration}</p>
              <p>Team capacity: {config.teamCapacity} story points</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-medium text-gray-700">Board Layout Preview</h3>
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
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Create Sprint Board</h1>
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
            {saving ? 'Saving...' : 'Save & Launch Board'}
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

          {/* Columns Configuration */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Workflow Columns</h2>
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

          {/* Sprint Settings */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Sprint Settings</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Sprint Duration</label>
                <select
                  value={config.sprintDuration}
                  onChange={e => setConfig(prev => ({ ...prev, sprintDuration: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value={1}>1 Week</option>
                  <option value={2}>2 Weeks</option>
                  <option value={3}>3 Weeks</option>
                  <option value={4}>4 Weeks</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Working Days per Week</label>
                <select
                  value={config.workingDaysPerWeek}
                  onChange={e => setConfig(prev => ({ ...prev, workingDaysPerWeek: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value={5}>5 Days</option>
                  <option value={6}>6 Days</option>
                  <option value={7}>7 Days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Team Capacity (Story Points)</label>
                <input
                  type="number"
                  value={config.teamCapacity}
                  onChange={e => setConfig(prev => ({ ...prev, teamCapacity: parseInt(e.target.value) }))}
                  min={0}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sprint Naming Pattern</label>
                <input
                  type="text"
                  value={config.sprintNamingPattern}
                  onChange={e => setConfig(prev => ({ ...prev, sprintNamingPattern: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Sprint #{number}"
                />
              </div>
            </div>
          </div>

          {/* Story Points */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Story Points</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Story Point Scale</label>
                <select
                  value={config.storyPointScale}
                  onChange={e => setConfig(prev => ({ 
                    ...prev, 
                    storyPointScale: e.target.value as 'fibonacci' | 'linear' | 'custom'
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="fibonacci">Fibonacci (1, 2, 3, 5, 8, 13, 21, 34)</option>
                  <option value="linear">Linear (1-10)</option>
                  <option value="custom">Custom Scale</option>
                </select>
              </div>

              {config.storyPointScale === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Scale (comma-separated numbers)
                  </label>
                  <input
                    type="text"
                    value={customScaleInput}
                    onChange={e => handleCustomScaleChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="1, 2, 3, 5, 8"
                  />
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4">
                <span className="text-sm text-gray-600">
                  Available story point values: {
                    config.storyPointScale === 'fibonacci' ? fibonacci.join(', ') :
                    config.storyPointScale === 'linear' ? linear.join(', ') :
                    config.customScale?.join(', ') || 'No values set'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Advanced Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoCreate"
                  checked={config.autoCreateSprints}
                  onChange={e => setConfig(prev => ({ ...prev, autoCreateSprints: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="autoCreate" className="text-sm text-gray-700">
                  Automatically create next sprint
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rollover"
                  checked={config.rolloverUnfinishedItems}
                  onChange={e => setConfig(prev => ({ ...prev, rolloverUnfinishedItems: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="rollover" className="text-sm text-gray-700">
                  Automatically move unfinished items to next sprint
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Burndown Chart Type</label>
                <select
                  value={config.burndownChartType}
                  onChange={e => setConfig(prev => ({ 
                    ...prev, 
                    burndownChartType: e.target.value as 'remaining' | 'velocity'
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="remaining">Story Points Remaining</option>
                  <option value="velocity">Team Velocity</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {isPreviewVisible && (
          <div className="space-y-6">
            <div className="sticky top-6">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Preview</h3>
              {renderSprintTimeline()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}