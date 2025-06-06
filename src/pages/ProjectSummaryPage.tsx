import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tables } from '../types/supabase';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useProject } from '../lib/ProjectContext';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  BarChart2,
  AlertTriangle,
  CheckSquare,
  Target,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';

type Project = Tables<'projects'>;
type TeamMember = Tables<'project_team_members'>;
type Milestone = Tables<'project_milestones'>;
type Task = Tables<'project_tasks'>;
type Risk = Tables<'project_risks'>;

export default function ProjectSummaryPage() {
  const { projectId } = useParams();
  const { setCurrentProject } = useProject();
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
    
    return () => {
      setCurrentProject(null);
    };
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for project ID:', projectId);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Project fetch error:', projectError);
        throw projectError;
      }
      
      console.log('Project data:', projectData);
      setProject(projectData);
      setCurrentProject(projectData);

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId);

      if (teamError) {
        console.error('Team fetch error:', teamError);
        throw teamError;
      }
      console.log('Team data:', teamData);
      setTeamMembers(teamData || []);

      // Fetch milestones
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('due_date', { ascending: true });

      if (milestoneError) {
        console.error('Milestone fetch error:', milestoneError);
        throw milestoneError;
      }
      console.log('Milestone data:', milestoneData);
      setMilestones(milestoneData || []);

      // Fetch tasks
      const { data: taskData, error: taskError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (taskError) {
        console.error('Task fetch error:', taskError);
        throw taskError;
      }
      console.log('Task data:', taskData);
      setTasks(taskData || []);

      // Fetch risks
      const { data: riskData, error: riskError } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (riskError) {
        console.error('Risk fetch error:', riskError);
        throw riskError;
      }
      console.log('Risk data:', riskData);
      setRisks(riskData || []);

    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate project statistics
  const getProjectStats = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const overdueTasks = tasks.filter(task => 
      new Date(task.due_date) < new Date() && task.status !== 'done'
    ).length;

    const completedMilestones = milestones.filter(milestone => 
      milestone.status === 'Completed'
    ).length;

    const highRisks = risks.filter(risk => 
      risk.impact === 'High' || risk.likelihood === 'High'
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completedMilestones,
      highRisks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
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
          <p className="mt-2 text-gray-600">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <p className="mt-1 text-sm text-gray-500">Project ID: {projectId}</p>
        </div>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.project_name}</h1>
            <p className="mt-2 text-lg text-gray-600">{project.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Project ID</div>
            <div className="font-mono text-xs text-gray-400">{project.id}</div>
          </div>
        </div>
        
        {/* Project Status Bar */}
        <div className="mt-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                project.status === 'Review' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}>
                {project.status}
              </span>
              <span className="text-sm text-gray-500">
                Started: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
              </span>
              <span className="text-sm text-gray-500">
                Due: {new Date(project.target_completion_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{project.progress}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
              <div className="w-32">
                <div className="h-2 rounded-full bg-gray-200">
                  <div 
                    className="h-2 rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-indigo-50 p-3">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Team Size</p>
              <p className="text-2xl font-semibold text-gray-900">{project.team_size}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-green-50 p-3">
              <CheckSquare className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Task Completion</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.taskCompletionRate}%</p>
              <p className="text-xs text-gray-500">{stats.completedTasks}/{stats.totalTasks} tasks</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-yellow-50 p-3">
              <Activity className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgressTasks}</p>
              <p className="text-xs text-gray-500">Active tasks</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-md bg-red-50 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Risks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.highRisks}</p>
              <p className="text-xs text-gray-500">Require attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Tasks */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
            <span className="text-sm text-gray-500">{tasks.length} total</span>
          </div>
          <div className="space-y-4">
            {tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center">
                    <CheckSquare className="mr-3 h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Assigned to: {task.assignee}</span>
                        <span>•</span>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          task.type === 'epic' ? 'bg-purple-100 text-purple-800' :
                          task.type === 'user_story' ? 'bg-blue-100 text-blue-800' :
                          task.type === 'bug' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        task.status === 'done'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.story_points && (
                      <span className="text-xs text-gray-500">{task.story_points} pts</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No tasks found</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
            <span className="text-sm text-gray-500">{teamMembers.length} members</span>
          </div>
          <div className="space-y-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                    {member.responsibilities && (
                      <p className="text-xs text-gray-400 mt-1">{member.responsibilities}</p>
                    )}
                  </div>
                  {member.contact_info && (
                    <div className="text-xs text-gray-500">{member.contact_info}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No team members added</p>
              </div>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Milestones</h2>
            <span className="text-sm text-gray-500">{stats.completedMilestones}/{milestones.length} completed</span>
          </div>
          <div className="space-y-4">
            {milestones.length > 0 ? (
              milestones.slice(0, 5).map((milestone) => (
                <div key={milestone.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        milestone.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : milestone.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {milestone.status}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="mt-1 text-sm text-gray-500">{milestone.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="mr-1.5 h-4 w-4" />
                      {new Date(milestone.due_date).toLocaleDateString()}
                    </div>
                    <span>Owner: {milestone.owner}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No milestones defined</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Risk Assessment</h2>
            <span className="text-sm text-gray-500">{risks.length} identified</span>
          </div>
          <div className="space-y-4">
            {risks.length > 0 ? (
              risks.slice(0, 5).map((risk) => (
                <div key={risk.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start">
                    <AlertTriangle className={`mr-3 h-5 w-5 mt-0.5 ${
                      risk.impact === 'High' || risk.likelihood === 'High' 
                        ? 'text-red-500' 
                        : 'text-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{risk.description}</p>
                      <div className="mt-1 flex space-x-4 text-sm">
                        <span className={`text-gray-500 ${
                          risk.impact === 'High' ? 'font-medium text-red-600' : ''
                        }`}>
                          Impact: {risk.impact}
                        </span>
                        <span className={`text-gray-500 ${
                          risk.likelihood === 'High' ? 'font-medium text-red-600' : ''
                        }`}>
                          Likelihood: {risk.likelihood}
                        </span>
                      </div>
                      {risk.mitigation_strategy && (
                        <p className="mt-2 text-sm text-gray-600">
                          <strong>Mitigation:</strong> {risk.mitigation_strategy}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No risks identified</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}