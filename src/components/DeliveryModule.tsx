import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Settings, Trash2, Calendar, Users, BarChart3, Kanban, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import LoadingSpinner from './LoadingSpinner';
import ConfirmationDialog from './ConfirmationDialog';
import WorkflowManagement from './WorkflowManagement';
import toast from 'react-hot-toast';

interface BaseBoard {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  project_id: string;
}

interface KanbanBoard extends BaseBoard {
  columns: { id: string; name: string; order: number; }[];
  card_fields: { id: string; name: string; type: string; }[];
}

interface SprintBoard extends BaseBoard {
  settings: {
    sprintDuration: number;
    teamCapacity: number;
  };
}

type Board = KanbanBoard | SprintBoard;

interface BoardWithType extends BaseBoard {
  boardType: 'kanban' | 'sprint';
  columns?: KanbanBoard['columns'];
  card_fields?: KanbanBoard['card_fields'];
  settings?: SprintBoard['settings'];
}

export default function DeliveryModule() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<BoardWithType | null>(null);

  useEffect(() => {
    fetchBoards();
  }, [projectId]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const [kanbanRes, sprintRes] = await Promise.all([
        supabase
          .from('kanban_boards')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('sprint_boards')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
      ]);

      if (kanbanRes.error) throw kanbanRes.error;
      if (sprintRes.error) throw sprintRes.error;

      const kanbanBoards: BoardWithType[] = (kanbanRes.data || []).map(board => ({
        ...board,
        boardType: 'kanban' as const
      }));

      const sprintBoards: BoardWithType[] = (sprintRes.data || []).map(board => ({
        ...board,
        boardType: 'sprint' as const
      }));

      setBoards([...kanbanBoards, ...sprintBoards]);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = (type: 'kanban' | 'sprint') => {
    navigate(`/dashboard/projects/${projectId}/delivery/${type}/new`);
  };

  const handleOpenBoard = (board: BoardWithType) => {
    navigate(`/dashboard/projects/${projectId}/delivery/${board.boardType}/${board.id}`);
  };

  const handleEditBoard = (board: BoardWithType) => {
    if (board.boardType === 'kanban') {
      navigate(`/dashboard/projects/${projectId}/delivery/kanban/${board.id}/edit`);
    } else {
      // Sprint boards don't have edit functionality yet
      toast('Sprint board editing coming soon', { icon: 'ℹ️' });
    }
  };

  const handleDeleteBoard = (board: BoardWithType) => {
    setBoardToDelete(board);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!boardToDelete) return;

    try {
      const table = boardToDelete.boardType === 'kanban' ? 'kanban_boards' : 'sprint_boards';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', boardToDelete.id);

      if (error) throw error;

      toast.success(`${boardToDelete.boardType === 'kanban' ? 'Kanban' : 'Sprint'} board deleted successfully`);
      fetchBoards();
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to delete board');
    } finally {
      setShowDeleteConfirm(false);
      setBoardToDelete(null);
    }
  };

  const getBoardStats = (board: BoardWithType) => {
    if (board.boardType === 'kanban') {
      return {
        columns: board.columns?.length || 0,
        fields: board.card_fields?.length || 0,
        type: 'Kanban'
      };
    } else {
      return {
        duration: board.settings?.sprintDuration ? `${board.settings.sprintDuration} weeks` : 'Not set',
        capacity: board.settings?.teamCapacity || 0,
        type: 'Sprint'
      };
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery Boards</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your project delivery with Kanban and Sprint boards
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleCreateBoard('kanban')}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Kanban className="mr-2 h-4 w-4" />
            Create Kanban Board
          </button>
          <button
            onClick={() => handleCreateBoard('sprint')}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Zap className="mr-2 h-4 w-4" />
            Create Sprint Board
          </button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No boards created</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first delivery board
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => handleCreateBoard('kanban')}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <Kanban className="mr-2 h-4 w-4" />
                Create Kanban Board
              </button>
              <button
                onClick={() => handleCreateBoard('sprint')}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Zap className="mr-2 h-4 w-4" />
                Create Sprint Board
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          {/* Delivery Boards Table */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Board
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Configuration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {boards.map((board) => {
                const stats = getBoardStats(board);
                return (
                  <tr key={board.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {board.boardType === 'kanban' ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                              <Kanban className="h-5 w-5 text-purple-600" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                              <Zap className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{board.name}</div>
                          <div className="text-sm text-gray-500">{board.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        board.boardType === 'kanban' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {stats.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {board.boardType === 'kanban' ? (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <BarChart3 className="mr-1 h-3 w-3" />
                            <span>{stats.columns} columns</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            <span>{stats.fields} fields</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{stats.duration}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="mr-1 h-3 w-3" />
                            <span>{stats.capacity} capacity</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(board.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleOpenBoard(board)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleEditBoard(board)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit board"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBoard(board)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete board"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Workflow Management Section */}
      <div className="mt-10">
        <WorkflowManagement />
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Board"
        message={`Are you sure you want to delete "${boardToDelete?.name}"? This action cannot be undone and will permanently remove the board and all its configuration.`}
      />
    </div>
  );
}