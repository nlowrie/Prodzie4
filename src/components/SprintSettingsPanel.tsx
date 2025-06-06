import React, { useState, useEffect } from 'react';
import { X, Calendar, Target, Users, Settings, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import toast from 'react-hot-toast';

type SprintBoard = Tables<'sprint_boards'>;
type Sprint = Tables<'sprints'>;

interface SprintSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  board: SprintBoard;
  activeSprint: Sprint | null;
  sprints: Sprint[];
  onSprintChange: (sprint: Sprint | null) => void;
  onSettingsUpdate: () => void;
}

interface SprintFormData {
  name: string;
  start_date: string;
  end_date: string;
  goal: string;
  capacity: number;
}

export default function SprintSettingsPanel({
  isOpen,
  onClose,
  board,
  activeSprint,
  sprints,
  onSprintChange,
  onSettingsUpdate,
}: SprintSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'sprint' | 'board'>('sprint');
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [sprintFormData, setSprintFormData] = useState<SprintFormData>({
    name: '',
    start_date: '',
    end_date: '',
    goal: '',
    capacity: 0,
  });

  const [boardSettings, setBoardSettings] = useState({
    sprintDuration: 2,
    workingDaysPerWeek: 5,
    teamCapacity: 0,
    autoCreateSprints: false,
    rolloverUnfinishedItems: true,
  });

  useEffect(() => {
    if (isOpen) {
      loadBoardSettings();
    }
  }, [isOpen, board]);

  const loadBoardSettings = () => {
    const settings = board.settings as any;
    setBoardSettings({
      sprintDuration: settings?.sprintDuration || 2,
      workingDaysPerWeek: settings?.workingDaysPerWeek || 5,
      teamCapacity: settings?.teamCapacity || 0,
      autoCreateSprints: settings?.autoCreateSprints || false,
      rolloverUnfinishedItems: settings?.rolloverUnfinishedItems || true,
    });
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('sprints')
        .insert({
          project_id: board.project_id,
          ...sprintFormData,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Sprint created successfully');
      setShowCreateSprint(false);
      setSprintFormData({
        name: '',
        start_date: '',
        end_date: '',
        goal: '',
        capacity: 0,
      });
      
      // Refresh sprints list
      window.location.reload();
    } catch (error) {
      console.error('Error creating sprint:', error);
      toast.error('Failed to create sprint');
    }
  };

  const handleUpdateBoardSettings = async () => {
    try {
      const currentSettings = board.settings as any;
      const updatedSettings = {
        ...currentSettings,
        ...boardSettings,
      };

      const { error } = await supabase
        .from('sprint_boards')
        .update({ settings: updatedSettings })
        .eq('id', board.id);

      if (error) throw error;

      toast.success('Board settings updated');
      onSettingsUpdate();
    } catch (error) {
      console.error('Error updating board settings:', error);
      toast.error('Failed to update board settings');
    }
  };

  const assignItemsToSprint = async (sprintId: string) => {
    try {
      // This would typically open a dialog to select items from the backlog
      // For now, we'll just show a success message
      toast.success('Sprint assignment feature coming soon');
    } catch (error) {
      console.error('Error assigning items to sprint:', error);
      toast.error('Failed to assign items to sprint');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 overflow-y-auto bg-white shadow-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-6">
          <h3 className="text-lg font-medium text-gray-900">Sprint Board Settings</h3>
          <button
            onClick={onClose}
            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            <button
              onClick={() => setActiveTab('sprint')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'sprint'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Sprint Management
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'board'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Board Settings
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'sprint' && (
            <div className="space-y-6">
              {/* Active Sprint */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Active Sprint</h4>
                {activeSprint ? (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{activeSprint.name}</h5>
                        <p className="text-sm text-gray-500">
                          {new Date(activeSprint.start_date).toLocaleDateString()} - {new Date(activeSprint.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{activeSprint.capacity} points</p>
                        <p className="text-xs text-gray-500">Capacity</p>
                      </div>
                    </div>
                    {activeSprint.goal && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{activeSprint.goal}</p>
                      </div>
                    )}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => assignItemsToSprint(activeSprint.id)}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Assign Items
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                    <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No active sprint selected</p>
                  </div>
                )}
              </div>

              {/* Sprint List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">All Sprints</h4>
                  <button
                    onClick={() => setShowCreateSprint(true)}
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    New Sprint
                  </button>
                </div>
                <div className="space-y-2">
                  {sprints.map(sprint => (
                    <div
                      key={sprint.id}
                      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                        activeSprint?.id === sprint.id
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => onSprintChange(sprint)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{sprint.name}</h5>
                          <p className="text-xs text-gray-500">
                            {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-900">{sprint.capacity}</p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Sprint Form */}
              {showCreateSprint && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Sprint</h4>
                  <form onSubmit={handleCreateSprint} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Sprint Name</label>
                      <input
                        type="text"
                        value={sprintFormData.name}
                        onChange={e => setSprintFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Start Date</label>
                        <input
                          type="date"
                          value={sprintFormData.start_date}
                          onChange={e => setSprintFormData(prev => ({ ...prev, start_date: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">End Date</label>
                        <input
                          type="date"
                          value={sprintFormData.end_date}
                          onChange={e => setSprintFormData(prev => ({ ...prev, end_date: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Sprint Goal</label>
                      <textarea
                        value={sprintFormData.goal}
                        onChange={e => setSprintFormData(prev => ({ ...prev, goal: e.target.value }))}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Capacity (Story Points)</label>
                      <input
                        type="number"
                        value={sprintFormData.capacity}
                        onChange={e => setSprintFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                      >
                        Create Sprint
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateSprint(false)}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'board' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Sprint Configuration</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sprint Duration (weeks)</label>
                    <select
                      value={boardSettings.sprintDuration}
                      onChange={e => setBoardSettings(prev => ({ ...prev, sprintDuration: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                      value={boardSettings.workingDaysPerWeek}
                      onChange={e => setBoardSettings(prev => ({ ...prev, workingDaysPerWeek: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
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
                      value={boardSettings.teamCapacity}
                      onChange={e => setBoardSettings(prev => ({ ...prev, teamCapacity: parseInt(e.target.value) || 0 }))}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Automation Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoCreateSprints"
                      checked={boardSettings.autoCreateSprints}
                      onChange={e => setBoardSettings(prev => ({ ...prev, autoCreateSprints: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="autoCreateSprints" className="text-sm text-gray-700">
                      Automatically create next sprint
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rolloverUnfinishedItems"
                      checked={boardSettings.rolloverUnfinishedItems}
                      onChange={e => setBoardSettings(prev => ({ ...prev, rolloverUnfinishedItems: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="rolloverUnfinishedItems" className="text-sm text-gray-700">
                      Move unfinished items to next sprint
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleUpdateBoardSettings}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}