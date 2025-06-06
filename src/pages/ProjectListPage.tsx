import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import ProjectTable from '../components/ProjectTable';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Tables } from '../types/supabase';
import toast from 'react-hot-toast';

type Project = Tables<'projects'>;

export default function ProjectListPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error) {
      toast.error('Error fetching projects');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDeleteId(projectId);
    setShowConfirmDialog(true);
  };

  const confirmDeletion = async () => {
    if (!projectToDeleteId) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDeleteId);

      if (error) {
        throw error;
      }

      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      toast.error('Error deleting project');
      console.error('Error:', error);
    } finally {
      setShowConfirmDialog(false);
      setProjectToDeleteId(null);
    }
  };

  const cancelDeletion = () => {
    setShowConfirmDialog(false);
    setProjectToDeleteId(null);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create and manage your projects
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/dashboard/create/new"
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Link>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : projects.length > 0 ? (
            <ProjectTable projects={projects} onDelete={handleDeleteProject} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
              <div className="mt-6">
                <Link
                  to="/dashboard/create/new"
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Project
                </Link>
              </div>
            </div>
          )}
        </div>

        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={cancelDeletion}
          onConfirm={confirmDeletion}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
        />
      </div>
    </DashboardLayout>
  );
}