import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import { Tables } from '../types/supabase';

type Project = Tables<'projects'>;

interface ProjectTableProps {
  projects: Project[];
  onDelete: (projectId: string) => void;
}

export default function ProjectTable({ projects, onDelete }: ProjectTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Progress
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <Link to={`/dashboard/projects/${project.id}`} className="block hover:text-indigo-600">
                  <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                  <div className="text-sm text-gray-500">{project.team_size} team members</div>
                </Link>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    project.status === 'In Progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : project.status === 'Planning'
                      ? 'bg-blue-100 text-blue-800'
                      : project.status === 'Review'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {project.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{project.progress}%</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(project.target_completion_date).toLocaleDateString()}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex space-x-2">
                  <Link
                    to={`/dashboard/create/edit/${project.id}`}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(project.id)}
                    className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 border border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}