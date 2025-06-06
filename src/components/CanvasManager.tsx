import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Tables } from '../types/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import ConfirmationDialog from './ConfirmationDialog';
import CanvasEditor from './CanvasEditor';

type Canvas = Tables<'project_canvases'>;

interface CanvasManagerProps {
  onCanvasSelected?: (title: string | null) => void;
}

export default function CanvasManager({ onCanvasSelected }: CanvasManagerProps) {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [canvasToDelete, setCanvasToDelete] = useState<string | null>(null);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);

  useEffect(() => {
    fetchCanvases();
  }, [projectId]);

  const fetchCanvases = async () => {
    try {
      const { data, error } = await supabase
        .from('project_canvases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCanvases(data || []);
    } catch (error) {
      console.error('Error fetching canvases:', error);
      toast.error('Failed to load canvases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanvas = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('project_canvases')
        .insert({
          project_id: projectId,
          title: formData.title,
          description: formData.description,
          created_by: user?.id,
          last_modified_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCanvases([data, ...canvases]);
      setShowCreateForm(false);
      setFormData({ title: '', description: '' });
      toast.success('Canvas created successfully');
    } catch (error) {
      console.error('Error creating canvas:', error);
      toast.error('Failed to create canvas');
    }
  };

  const handleDeleteCanvas = (canvasId: string) => {
    setCanvasToDelete(canvasId);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!canvasToDelete) return;

    try {
      const { error } = await supabase
        .from('project_canvases')
        .delete()
        .eq('id', canvasToDelete);

      if (error) throw error;

      setCanvases(canvases.filter(canvas => canvas.id !== canvasToDelete));
      toast.success('Canvas deleted successfully');
    } catch (error) {
      console.error('Error deleting canvas:', error);
      toast.error('Failed to delete canvas');
    } finally {
      setShowConfirmDialog(false);
      setCanvasToDelete(null);
    }
  };

  const handleSelectCanvas = (canvas: Canvas) => {
    setSelectedCanvas(canvas);
    onCanvasSelected?.(canvas.title);
  };

  const handleCloseCanvas = () => {
    setSelectedCanvas(null);
    onCanvasSelected?.(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (selectedCanvas) {
    return (
      <CanvasEditor
        canvasData={selectedCanvas}
        onClose={handleCloseCanvas}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Collaborative Canvases</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Canvas
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <form onSubmit={handleCreateCanvas} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create Canvas
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {canvases.map((canvas) => (
          <div
            key={canvas.id}
            className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="absolute right-4 top-4 flex space-x-2">
              <button
                onClick={() => handleSelectCanvas(canvas)}
                className="text-gray-400 hover:text-indigo-500"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteCanvas(canvas.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-lg font-medium text-gray-900">{canvas.title}</h3>
            {canvas.description && (
              <p className="mt-2 text-sm text-gray-500">{canvas.description}</p>
            )}
            <div className="mt-4 text-sm text-gray-500">
              Created {new Date(canvas.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Canvas"
        message="Are you sure you want to delete this canvas? This action cannot be undone."
      />
    </div>
  );
}