import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tables } from '../types/supabase';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useProject } from '../lib/ProjectContext';
import toast from 'react-hot-toast';
import {
  Lightbulb,
  Map,
  Book,
  Truck,
  LayoutDashboard,
} from 'lucide-react';

type Project = Tables<'projects'>;

const workspaceModules = [
  {
    title: 'Project Summary',
    description: 'Overview of project status, team, milestones, and risks',
    icon: LayoutDashboard,
    path: 'summary',
    color: 'indigo',
  },
  {
    title: 'Brainstorming',
    description: 'Capture and organize ideas, conduct collaborative brainstorming sessions',
    icon: Lightbulb,
    path: 'brainstorming',
    color: 'blue',
  },
  {
    title: 'Roadmapping',
    description: 'Plan and visualize project timelines, milestones, and dependencies',
    icon: Map,
    path: 'roadmap',
    color: 'green',
  },
  {
    title: 'Knowledge Base',
    description: 'Document and share project knowledge, guidelines, and best practices',
    icon: Book,
    path: 'knowledge',
    color: 'purple',
  },
  {
    title: 'Delivery',
    description: 'Track and manage project deliverables, releases, and deployment status',
    icon: Truck,
    path: 'delivery',
    color: 'orange',
  },
];

export default function ProjectDashboardPage() {
  const { projectId } = useParams();
  const { setCurrentProject } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectData();
    
    return () => {
      setCurrentProject(null);
    };
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setCurrentProject(projectData);

    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="mt-2 text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Project Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{project.project_name}</h1>
        <p className="mt-1 text-sm text-gray-500">{project.description}</p>
      </div>

      {/* Workspace Modules */}
      <div className="mb-8">
        <h2 className="mb-6 text-lg font-medium text-gray-900">Project Workspace</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaceModules.map((module) => {
            const IconComponent = module.icon;
            const colorClasses = {
              indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
              blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
              green: 'bg-green-50 text-green-600 hover:bg-green-100',
              purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
              orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
            };

            return (
              <Link
                key={module.path}
                to={`/dashboard/projects/${projectId}/${module.path}`}
                className="group block rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4">
                  <div className={`inline-block rounded-lg p-3 ${colorClasses[module.color]}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 group-hover:text-indigo-600">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-500">{module.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}