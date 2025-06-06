import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Board {
  id: string;
  name: string;
  type: 'kanban' | 'sprint';
}

interface Workflow {
  id?: string;
  name: string;
  type: 'kanban' | 'sprint';
  statuses: string[];
  created_at?: string;
  assigned_boards?: string[]; // Array of board IDs
}

export default function WorkflowManagement() {
  const { projectId } = useParams();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [workflowFormData, setWorkflowFormData] = useState<Workflow>({
    name: '',
    type: 'kanban',
    statuses: ['To Do', 'In Progress', 'Done'],
    assigned_boards: []
  });

  useEffect(() => {
    fetchWorkflows();
    fetchBoards();
  }, [projectId]);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    }
  };

  const fetchBoards = async () => {
    try {
      const [kanbanRes, sprintRes] = await Promise.all([
        supabase
          .from('kanban_boards')
          .select('id, name')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sprint_boards')
          .select('id, name')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
      ]);

      if (kanbanRes.error) throw kanbanRes.error;
      if (sprintRes.error) throw sprintRes.error;

      const kanbanBoards = (kanbanRes.data || []).map(board => ({
        ...board,
        type: 'kanban' as const
      }));

      const sprintBoards = (sprintRes.data || []).map(board => ({
        ...board,
        type: 'sprint' as const
      }));

      setBoards([...kanbanBoards, ...sprintBoards]);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast.error('Failed to load boards');
    }
  };

  const fetchWorkflowBoardAssignments = async (workflowId: string) => {
    try {
      const { data, error } = await supabase
        .from('workflow_board_assignments')
        .select('board_id')
        .eq('workflow_id', workflowId);

      if (error) throw error;
      return data.map(assignment => assignment.board_id);
    } catch (error) {
      console.error('Error fetching workflow board assignments:', error);
      return [];
    }
  };

  const handleEditWorkflow = async (workflow: Workflow) => {
    const assignedBoards = await fetchWorkflowBoardAssignments(workflow.id!);
    setEditingWorkflow(workflow);
    setWorkflowFormData({
      ...workflow,
      assigned_boards: assignedBoards
    });
    setShowWorkflowForm(true);
  };

  const updateWorkflowBoardAssignments = async (workflowId: string, boardIds: string[]) => {
    try {
      // First, delete all existing assignments
      await supabase
        .from('workflow_board_assignments')
        .delete()
        .eq('workflow_id', workflowId);

      // Then create new assignments
      if (boardIds.length > 0) {
        const assignments = boardIds.map(boardId => ({
          workflow_id: workflowId,
          board_id: boardId,
          board_type: boards.find(b => b.id === boardId)?.type || 'kanban'
        }));

        const { error } = await supabase
          .from('workflow_board_assignments')
          .insert(assignments);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating workflow board assignments:', error);
      throw error;
    }
  };

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (!workflow.id) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflow.id);

      if (error) throw error;

      toast.success('Workflow deleted successfully');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const handleWorkflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingWorkflow?.id) {
        // Update existing workflow
        const { error } = await supabase
          .from('workflows')
          .update({
            name: workflowFormData.name,
            type: workflowFormData.type,
            statuses: workflowFormData.statuses,
          })
          .eq('id', editingWorkflow.id);

        if (error) throw error;

        await updateWorkflowBoardAssignments(editingWorkflow.id, workflowFormData.assigned_boards || []);
        toast.success('Workflow updated successfully');
      } else {
        // Create new workflow
        const { data, error } = await supabase
          .from('workflows')
          .insert({
            project_id: projectId,
            name: workflowFormData.name,
            type: workflowFormData.type,
            statuses: workflowFormData.statuses,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          await updateWorkflowBoardAssignments(data.id, workflowFormData.assigned_boards || []);
        }
        toast.success('Workflow created successfully');
      }

      setShowWorkflowForm(false);
      setEditingWorkflow(null);
      setWorkflowFormData({
        name: '',
        type: 'kanban',
        statuses: ['To Do', 'In Progress', 'Done'],
        assigned_boards: []
      });
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflow Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage custom workflows for your delivery process
          </p>
        </div>
        <button
          onClick={() => setShowWorkflowForm(true)}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Workflow
        </button>
      </div>

      {/* Workflow Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Workflow Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status Flow</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {workflows.map((workflow) => (
              <tr key={workflow.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                </td>                <td className="whitespace-nowrap px-6 py-4">
                  <div className="space-y-1">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      workflow.type === 'kanban' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {workflow.type === 'kanban' ? 'Kanban' : 'Sprint'}
                    </span>
                    {workflow.assigned_boards && workflow.assigned_boards.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {boards
                          .filter(board => workflow.assigned_boards?.includes(board.id))
                          .map(board => board.name)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {workflow.statuses.map((status, idx) => (
                      <React.Fragment key={idx}>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {status}
                        </span>
                        {idx < workflow.statuses.length - 1 && (
                          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {new Date(workflow.created_at || Date.now()).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEditWorkflow(workflow)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit workflow"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkflow(workflow)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete workflow"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {workflows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No workflows created yet. Click "Add Workflow" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Workflow Form Modal */}
      {showWorkflowForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                </h3>
                <button
                  onClick={() => {
                    setShowWorkflowForm(false);
                    setEditingWorkflow(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleWorkflowSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Workflow Name
                    </label>
                    <input
                      type="text"
                      value={workflowFormData.name}
                      onChange={(e) => setWorkflowFormData({ ...workflowFormData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={workflowFormData.type}
                      onChange={(e) => setWorkflowFormData({ ...workflowFormData, type: e.target.value as 'kanban' | 'sprint' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="kanban">Kanban</option>
                      <option value="sprint">Sprint</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status Flow
                    </label>
                    <div className="mt-2 space-y-2">
                      {workflowFormData.statuses.map((status, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={status}
                            onChange={(e) => {
                              const newStatuses = [...workflowFormData.statuses];
                              newStatuses[index] = e.target.value;
                              setWorkflowFormData({ ...workflowFormData, statuses: newStatuses });
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder={`Status ${index + 1}`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newStatuses = workflowFormData.statuses.filter((_, i) => i !== index);
                              setWorkflowFormData({ ...workflowFormData, statuses: newStatuses });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setWorkflowFormData({
                            ...workflowFormData,
                            statuses: [...workflowFormData.statuses, '']
                          });
                        }}
                        className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add Status
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign to Boards
                    </label>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Kanban Boards</h4>
                        <div className="space-y-2">
                          {boards
                            .filter(board => board.type === 'kanban')
                            .map(board => (
                              <label key={board.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={workflowFormData.assigned_boards?.includes(board.id)}
                                  onChange={(e) => {
                                    const newAssignedBoards = e.target.checked
                                      ? [...(workflowFormData.assigned_boards || []), board.id]
                                      : (workflowFormData.assigned_boards || []).filter(id => id !== board.id);
                                    setWorkflowFormData({ ...workflowFormData, assigned_boards: newAssignedBoards });
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{board.name}</span>
                              </label>
                            ))}
                          {boards.filter(board => board.type === 'kanban').length === 0 && (
                            <p className="text-sm text-gray-500 italic">No Kanban boards available</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sprint Boards</h4>
                        <div className="space-y-2">
                          {boards
                            .filter(board => board.type === 'sprint')
                            .map(board => (
                              <label key={board.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={workflowFormData.assigned_boards?.includes(board.id)}
                                  onChange={(e) => {
                                    const newAssignedBoards = e.target.checked
                                      ? [...(workflowFormData.assigned_boards || []), board.id]
                                      : (workflowFormData.assigned_boards || []).filter(id => id !== board.id);
                                    setWorkflowFormData({ ...workflowFormData, assigned_boards: newAssignedBoards });
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">{board.name}</span>
                              </label>
                            ))}
                          {boards.filter(board => board.type === 'sprint').length === 0 && (
                            <p className="text-sm text-gray-500 italic">No Sprint boards available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWorkflowForm(false);
                      setEditingWorkflow(null);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {editingWorkflow ? 'Save Changes' : 'Create Workflow'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
