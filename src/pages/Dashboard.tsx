import React from 'react';
import {
  Folder,
  ListTodo,
  Users,
  CheckCircle,
  Clock,
  BarChart2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function Dashboard() {
  const stats = [
    { name: 'Active Projects', value: '24', icon: Folder, change: '+3', changeType: 'positive' },
    { name: 'Pending Tasks', value: '156', icon: ListTodo, change: '-12', changeType: 'positive' },
    { name: 'Team Members', value: '38', icon: Users, change: '+5', changeType: 'positive' },
    { name: 'Completed Milestones', value: '92', icon: CheckCircle, change: '+8', changeType: 'positive' },
  ];

  const recentProjects = [
    {
      id: 1,
      name: 'E-commerce Platform Redesign',
      status: 'In Progress',
      progress: 65,
      dueDate: '2025-04-15',
      team: 8
    },
    {
      id: 2,
      name: 'Mobile App Development',
      status: 'Planning',
      progress: 25,
      dueDate: '2025-05-01',
      team: 12
    },
    {
      id: 3,
      name: 'Customer Portal Update',
      status: 'Review',
      progress: 90,
      dueDate: '2025-03-30',
      team: 5
    },
    {
      id: 4,
      name: 'API Integration Project',
      status: 'In Progress',
      progress: 45,
      dueDate: '2025-04-20',
      team: 6
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Project & Product Collaboration Hub</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage projects, track progress, and collaborate with your team
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className="rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center">
                    <div className="rounded-md bg-indigo-50 p-3">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                        <p className={`ml-2 text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>{stat.change}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Projects */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View all projects
                </button>
              </div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">{project.team} team members</div>
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
                            {new Date(project.dueDate).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project Performance */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Project Performance Overview</h2>
                <button className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  <BarChart2 className="mr-1 h-4 w-4" />
                  Detailed Analytics
                </button>
              </div>
              <div className="flex h-64 items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart2 className="mx-auto h-12 w-12" />
                  <p className="mt-2">Project performance metrics visualization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}