import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  Target,
  AlertTriangle,
  Plus,
  Trash2,
  CheckSquare,
  GitBranch,
  Shield,
  MessageSquare,
  FileText,
  Workflow,
  Milestone
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import InputField from '../components/InputField';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

type Project = Tables<'projects'>;
type TeamMember = Tables<'project_team_members'>;
type Milestone = Tables<'project_milestones'>;
type Task = Tables<'project_tasks'>;
type Risk = Tables<'project_risks'>;

interface FormData {
  // Project Overview
  projectName: string;
  projectOwner: string;
  startDate: string;
  targetCompletionDate: string;
  priorityLevel: string;
  status: string;
  description: string;
  
  // Objectives & Goals
  objectives: string;
  
  // Team Members
  teamMembers: {
    name: string;
    role: string;
    responsibilities: string;
    contact_info: string;
  }[];
  
  // Project Scope
  inScope: string[];
  outScope: string[];
  
  // Milestones
  milestones: {
    title: string;
    description: string;
    due_date: string;
    owner: string;
    status: string;
  }[];
  
  // Tasks
  tasks: {
    title: string;
    type: string;
    description: string;
    acceptance_criteria: string;
    story_points: number | null;
    priority: string;
    labels: string[];
    assignee: string;
    due_date: string;
    dependencies: string[];
    status: string;
    estimated_hours: number | null;
    logged_hours: number | null;
  }[];
  
  // Workflow
  methodology: string;
  sprintLength: string;
  meetingCadence: string;
  toolsUsed: string[];
  
  // Risks
  risks: {
    description: string;
    impact: string;
    likelihood: string;
    mitigation_strategy: string;
  }[];
  
  // Communication
  stakeholderUpdates: string;
  communicationChannels: string[];
  
  // Supporting Docs
  supportingDocs: string[];
}

const today = new Date().toISOString().split('T')[0];

const defaultTeamMember = {
  name: '',
  role: '',
  responsibilities: '',
  contact_info: ''
};

const defaultMilestone = {
  title: '',
  description: '',
  due_date: today,
  owner: '',
  status: 'Not Started'
};

const defaultTask = {
  title: '',
  type: 'task',
  description: '',
  acceptance_criteria: '',
  story_points: null,
  priority: 'medium',
  labels: [],
  assignee: '',
  due_date: today,
  dependencies: [],
  status: 'Not Started',
  estimated_hours: null,
  logged_hours: null
};

const defaultRisk = {
  description: '',
  impact: 'Medium',
  likelihood: 'Medium',
  mitigation_strategy: ''
};

const initialFormData: FormData = {
  projectName: '',
  projectOwner: '',
  startDate: today,
  targetCompletionDate: today,
  priorityLevel: 'Medium',
  status: 'Not Started',
  description: '',
  objectives: '',
  teamMembers: [],
  inScope: [''],
  outScope: [''],
  milestones: [],
  tasks: [],
  methodology: '',
  sprintLength: '',
  meetingCadence: '',
  toolsUsed: [''],
  risks: [],
  stakeholderUpdates: '',
  communicationChannels: [''],
  supportingDocs: ['']
};

const navItems = [
  { id: 'overview', name: 'Project Overview', icon: Target },
  { id: 'objectives', name: 'Objectives & Goals', icon: Target },
  { id: 'team', name: 'Team & Roles', icon: Users },
  { id: 'scope', name: 'Project Scope', icon: GitBranch },
  { id: 'milestones', name: 'Key Milestones', icon: Milestone },
  { id: 'tasks', name: 'Tasks & Deliverables', icon: CheckSquare },
  { id: 'workflow', name: 'Workflow & Process', icon: Workflow },
  { id: 'risks', name: 'Risks & Mitigation', icon: Shield },
  { id: 'communication', name: 'Communication Plan', icon: MessageSquare },
  { id: 'docs', name: 'Supporting Docs', icon: FileText }
];

export default function ProjectForm() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentSection, setCurrentSection] = useState('overview');

  useEffect(() => {
    if (projectId) {
      console.log('ProjectForm: Initializing with projectId:', projectId);
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    console.log('ProjectForm: Fetching data for project:', projectId);
    
    try {
      // Fetch main project data
      console.log('ProjectForm: Fetching main project data...');
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('ProjectForm: Error fetching project data:', projectError);
        throw projectError;
      }
      console.log('ProjectForm: Received project data:', projectData);

      // Fetch team members
      console.log('ProjectForm: Fetching team members...');
      const { data: teamMembers, error: teamError } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId);

      if (teamError) {
        console.error('ProjectForm: Error fetching team members:', teamError);
        throw teamError;
      }
      console.log('ProjectForm: Received team members:', teamMembers);

      // Fetch milestones
      console.log('ProjectForm: Fetching milestones...');
      const { data: milestones, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId);

      if (milestonesError) {
        console.error('ProjectForm: Error fetching milestones:', milestonesError);
        throw milestonesError;
      }
      console.log('ProjectForm: Received milestones:', milestones);

      // Fetch tasks
      console.log('ProjectForm: Fetching tasks...');
      const { data: tasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId);

      if (tasksError) {
        console.error('ProjectForm: Error fetching tasks:', tasksError);
        throw tasksError;
      }
      console.log('ProjectForm: Received tasks:', tasks);

      // Fetch risks
      console.log('ProjectForm: Fetching risks...');
      const { data: risks, error: risksError } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId);

      if (risksError) {
        console.error('ProjectForm: Error fetching risks:', risksError);
        throw risksError;
      }
      console.log('ProjectForm: Received risks:', risks);

      // Update form data with fetched data
      const updatedFormData = {
        projectName: projectData.project_name,
        projectOwner: projectData.project_owner || '',
        startDate: projectData.start_date || today,
        targetCompletionDate: projectData.target_completion_date,
        priorityLevel: projectData.priority_level || 'Medium',
        status: projectData.status,
        description: projectData.description || '',
        objectives: projectData.objectives || '',
        teamMembers: teamMembers?.map(member => ({
          name: member.name,
          role: member.role,
          responsibilities: member.responsibilities || '',
          contact_info: member.contact_info || ''
        })) || [],
        inScope: projectData.in_scope || [''],
        outScope: projectData.out_scope || [''],
        milestones: milestones?.map(milestone => ({
          title: milestone.title,
          description: milestone.description || '',
          due_date: milestone.due_date,
          owner: milestone.owner,
          status: milestone.status
        })) || [],
        tasks: tasks?.map(task => ({
          title: task.title,
          type: task.type || 'task',
          description: task.description || '',
          acceptance_criteria: task.acceptance_criteria || '',
          story_points: task.story_points,
          priority: task.priority || 'medium',
          labels: task.labels || [],
          assignee: task.assignee,
          due_date: task.due_date,
          dependencies: task.dependencies || [],
          status: task.status,
          estimated_hours: task.estimated_hours,
          logged_hours: task.logged_hours
        })) || [],
        methodology: projectData.methodology || '',
        sprintLength: projectData.sprint_length || '',
        meetingCadence: projectData.meeting_cadence || '',
        toolsUsed: projectData.tools_used || [''],
        risks: risks?.map(risk => ({
          description: risk.description,
          impact: risk.impact,
          likelihood: risk.likelihood,
          mitigation_strategy: risk.mitigation_strategy
        })) || [],
        stakeholderUpdates: projectData.stakeholder_updates || '',
        communicationChannels: projectData.communication_channels || [''],
        supportingDocs: projectData.supporting_docs || ['']
      };

      console.log('ProjectForm: Setting form data:', updatedFormData);
      setFormData(updatedFormData);
    } catch (error) {
      console.error('ProjectForm: Error in fetchProjectData:', error);
      toast.error('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    console.log('ProjectForm: Submitting form. Is update?', !!projectId);
    console.log('ProjectForm: Form data being submitted:', formData);

    try {
      if (projectId) {
        // Update existing project
        console.log('ProjectForm: Updating existing project:', projectId);
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            project_name: formData.projectName,
            project_owner: formData.projectOwner,
            start_date: formData.startDate,
            target_completion_date: formData.targetCompletionDate,
            priority_level: formData.priorityLevel,
            status: formData.status,
            description: formData.description,
            objectives: formData.objectives,
            methodology: formData.methodology,
            sprint_length: formData.sprintLength,
            meeting_cadence: formData.meetingCadence,
            tools_used: formData.toolsUsed.filter(Boolean),
            in_scope: formData.inScope.filter(Boolean),
            out_scope: formData.outScope.filter(Boolean),
            stakeholder_updates: formData.stakeholderUpdates,
            communication_channels: formData.communicationChannels.filter(Boolean),
            supporting_docs: formData.supportingDocs.filter(Boolean),
            team_size: formData.teamMembers.length
          })
          .eq('id', projectId);

        if (projectError) {
          console.error('ProjectForm: Error updating project:', projectError);
          throw projectError;
        }

        // Update team members
        await supabase
          .from('project_team_members')
          .delete()
          .eq('project_id', projectId);

        if (formData.teamMembers.length > 0) {
          const { error: teamError } = await supabase
            .from('project_team_members')
            .insert(
              formData.teamMembers.map(member => ({
                project_id: projectId,
                ...member
              }))
            );
          if (teamError) throw teamError;
        }

        // Update milestones
        await supabase
          .from('project_milestones')
          .delete()
          .eq('project_id', projectId);

        if (formData.milestones.length > 0) {
          const { error: milestonesError } = await supabase
            .from('project_milestones')
            .insert(
              formData.milestones.map(milestone => ({
                project_id: projectId,
                ...milestone
              }))
            );
          if (milestonesError) throw milestonesError;
        }

        // Update tasks
        await supabase
          .from('project_tasks')
          .delete()
          .eq('project_id', projectId);

        if (formData.tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('project_tasks')
            .insert(
              formData.tasks.map(task => ({
                project_id: projectId,
                ...task
              }))
            );
          if (tasksError) throw tasksError;
        }

        // Update risks
        await supabase
          .from('project_risks')
          .delete()
          .eq('project_id', projectId);

        if (formData.risks.length > 0) {
          const { error: risksError } = await supabase
            .from('project_risks')
            .insert(
              formData.risks.map(risk => ({
                project_id: projectId,
                ...risk
              }))
            );
          if (risksError) throw risksError;
        }

        toast.success('Project updated successfully!');
      } else {
        // Create new project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            project_name: formData.projectName,
            project_owner: formData.projectOwner,
            start_date: formData.startDate,
            target_completion_date: formData.targetCompletionDate,
            priority_level: formData.priorityLevel,
            status: formData.status,
            description: formData.description,
            objectives: formData.objectives,
            methodology: formData.methodology,
            sprint_length: formData.sprintLength,
            meeting_cadence: formData.meetingCadence,
            tools_used: formData.toolsUsed.filter(Boolean),
            in_scope: formData.inScope.filter(Boolean),
            out_scope: formData.outScope.filter(Boolean),
            stakeholder_updates: formData.stakeholderUpdates,
            communication_channels: formData.communicationChannels.filter(Boolean),
            supporting_docs: formData.supportingDocs.filter(Boolean),
            team_size: formData.teamMembers.length,
            progress: 0
          })
          .select()
          .single();

        if (projectError) throw projectError;

        const newProjectId = projectData.id;

        // Insert team members
        if (formData.teamMembers.length > 0) {
          const { error: teamError } = await supabase
            .from('project_team_members')
            .insert(
              formData.teamMembers.map(member => ({
                project_id: newProjectId,
                ...member
              }))
            );
          if (teamError) throw teamError;
        }

        // Insert milestones
        if (formData.milestones.length > 0) {
          const { error: milestonesError } = await supabase
            .from('project_milestones')
            .insert(
              formData.milestones.map(milestone => ({
                project_id: newProjectId,
                ...milestone
              }))
            );
          if (milestonesError) throw milestonesError;
        }

        // Insert tasks
        if (formData.tasks.length > 0) {
          const { error: tasksError } = await supabase
            .from('project_tasks')
            .insert(
              formData.tasks.map(task => ({
                project_id: newProjectId,
                ...task
              }))
            );
          if (tasksError) throw tasksError;
        }

        // Insert risks
        if (formData.risks.length > 0) {
          const { error: risksError } = await supabase
            .from('project_risks')
            .insert(
              formData.risks.map(risk => ({
                project_id: newProjectId,
                ...risk
              }))
            );
          if (risksError) throw risksError;
        }

        toast.success('Project created successfully!');
      }

      console.log('ProjectForm: Operation completed successfully');
      navigate('/dashboard/create');
    } catch (error) {
      console.error('ProjectForm: Error in handleSubmit:', error);
      toast.error(projectId ? 'Failed to update project' : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (
    index: number,
    field: keyof FormData,
    subField: string,
    value: string | number | string[] | null
  ) => {
    setFormData((prev) => {
      const newArray = [...(prev[field] as any[])];
      newArray[index] = { ...newArray[index], [subField]: value };
      return { ...prev, [field]: newArray };
    });
  };

  const handleStringArrayChange = (
    index: number,
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => {
      const newArray = [...(prev[field] as string[])];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: keyof FormData) => {
    setFormData((prev) => {
      let newItem;
      switch (field) {
        case 'teamMembers':
          newItem = { ...defaultTeamMember };
          break;
        case 'milestones':
          newItem = { ...defaultMilestone };
          break;
        case 'tasks':
          newItem = { ...defaultTask };
          break;
        case 'risks':
          newItem = { ...defaultRisk };
          break;
        default:
          newItem = '';
      }
      return { ...prev, [field]: [...(prev[field] as any[]), newItem] };
    });
  };

  const addStringArrayItem = (field: keyof FormData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof FormData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Project Overview</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Project Name"
                id="projectName"
                name="projectName"
                type="text"
                required
                value={formData.projectName}
                onChange={handleChange}
              />

              <InputField
                label="Project Owner"
                id="projectOwner"
                name="projectOwner"
                type="text"
                required
                value={formData.projectOwner}
                onChange={handleChange}
              />

              <InputField
                label="Start Date"
                id="startDate"
                name="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={handleChange}
              />

              <InputField
                label="Target Completion Date"
                id="targetCompletionDate"
                name="targetCompletionDate"
                type="date"
                required
                value={formData.targetCompletionDate}
                onChange={handleChange}
              />

              <div>
                <label htmlFor="priorityLevel" className="block text-sm font-medium text-gray-700">
                  Priority Level
                </label>
                <select
                  id="priorityLevel"
                  name="priorityLevel"
                  value={formData.priorityLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case 'objectives':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Objectives & Goals</h3>
            <div>
              <label htmlFor="objectives" className="block text-sm font-medium text-gray-700">
                Key Objectives and Success Metrics
              </label>
              <textarea
                id="objectives"
                name="objectives"
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.objectives}
                onChange={handleChange}
                placeholder="List your key objectives and success metrics..."
              />
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Team & Roles</h3>
              <button
                type="button"
                onClick={() => addArrayItem('teamMembers')}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Team Member
              </button>
            </div>
            
            {formData.teamMembers.map((member, index) => (
              <div key={index} className="relative rounded-lg border border-gray-200 p-4">
                <button
                  type="button"
                  onClick={() => removeArrayItem('teamMembers', index)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="Name"
                    id={`teamMember-${index}-name`}
                    value={member.name}
                    onChange={(e) => handleArrayChange(index, 'teamMembers', 'name', e.target.value)}
                  />
                  
                  <InputField
                    label="Role"
                    id={`teamMember-${index}-role`}
                    value={member.role}
                    onChange={(e) => handleArrayChange(index, 'teamMembers', 'role', e.target.value)}
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Responsibilities
                    </label>
                    <textarea
                      value={member.responsibilities}
                      onChange={(e) => handleArrayChange(index, 'teamMembers', 'responsibilities', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <InputField
                    label="Contact Info"
                    id={`teamMember-${index}-contact`}
                    value={member.contact_info}
                    onChange={(e) => handleArrayChange(index, 'teamMembers', 'contact_info', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'scope':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Project Scope</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">In Scope Items</label>
                  <button
                    type="button"
                    onClick={() => addStringArrayItem('inScope')}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Item
                  </button>
                </div>
                {formData.inScope.map((item, index) => (
                  <div key={index} className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleStringArrayChange(index, 'inScope', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter scope item..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('inScope', index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Out of Scope Items</label>
                  <button
                    type="button"
                    onClick={() => addStringArrayItem('outScope')}
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Item
                  </button>
                </div>
                {formData.outScope.map((item, index) => (
                  <div key={index} className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleStringArrayChange(index, 'outScope', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Enter out of scope item..."
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('outScope', index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'milestones':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Key Milestones</h3>
              <button
                type="button"
                onClick={() => addArrayItem('milestones')}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Milestone
              </button>
            </div>
            
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="relative rounded-lg border border-gray-200 p-4">
                <button
                  type="button"
                  onClick={() => removeArrayItem('milestones', index)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="Title"
                    id={`milestone-${index}-title`}
                    value={milestone.title}
                    onChange={(e) => handleArrayChange(index, 'milestones', 'title', e.target.value)}
                  />
                  
                  <InputField
                    label="Owner"
                    id={`milestone-${index}-owner`}
                    value={milestone.owner}
                    onChange={(e) => handleArrayChange(index, 'milestones', 'owner', e.target.value)}
                  />
                
                  
                  <InputField
                    label="Due Date"
                    id={`milestone-${index}-due-date`}
                    type="date"
                    value={milestone.due_date}
                    onChange={(e) => handleArrayChange(index, 'milestones', 'due_date', e.target.value)}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={milestone.status}
                      onChange={(e) => handleArrayChange(index, 'milestones', 'status', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleArrayChange(index, 'milestones', 'description', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Tasks & Deliverables</h3>
              <button
                type="button"
                onClick={() => addArrayItem('tasks')}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </button>
            </div>
            
            {formData.tasks.map((task, index) => (
              <div key={index} className="relative rounded-lg border border-gray-200 p-4">
                <button
                  type="button"
                  onClick={() => removeArrayItem('tasks', index)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InputField
                    label="Title"
                    id={`task-${index}-title`}
                    value={task.title}
                    onChange={(e) => handleArrayChange(index, 'tasks', 'title', e.target.value)}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={task.type}
                      onChange={(e) => handleArrayChange(index, 'tasks', 'type', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="task">Task</option>
                      <option value="story">User Story</option>
                      <option value="bug">Bug</option>
                      <option value="epic">Epic</option>
                      <option value="feature">Feature</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={task.description}
                      onChange={(e) => handleArrayChange(index, 'tasks', 'description', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Detailed description of the task..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Acceptance Criteria</label>
                    <textarea
                      value={task.acceptance_criteria}
                      onChange={(e) => handleArrayChange(index, 'tasks', 'acceptance_criteria', e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Criteria for task completion..."
                    />
                  </div>

                  <InputField
                    label="Story Points"
                    id={`task-${index}-story-points`}
                    type="number"
                    min="0"
                    value={task.story_points || ''}
                    onChange={(e) => handleArrayChange(index, 'tasks', 'story_points', e.target.value ? parseInt(e.target.value) : null)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={task.priority}
                      onChange={(e) => handleArrayChange(index, 'tasks', 'priority', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <InputField
                    label="Assignee"
                    id={`task-${index}-assignee`}
                    value={task.assignee}
                    onChange={(e) => handleArrayChange(index, 'tasks', 'assignee', e.target.value)}
                  />
                  
                  <InputField
                    label="Due Date"
                    id={`task-${index}-due-date`}
                    type="date"
                    value={task.due_date}
                    onChange={(e) => handleArrayChange(index, 'tasks', 'due_date', e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={task.status}
                      onChange={(e) => handleArrayChange(index, 'tasks', 'status', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <InputField
                    label="Estimated Hours"
                    id={`task-${index}-estimated-hours`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={task.estimated_hours || ''}
                    onChange={(e) => handleArrayChange(index, 'tasks', 'estimated_hours', e.target.value ? parseFloat(e.target.value) : null)}
                  />

                  <InputField
                    label="Logged Hours"
                    id={`task-${index}-logged-hours`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={task.logged_hours || ''}
                    onChange={(e) => handleArrayChange(index, 'tasks', 'logged_hours', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Labels (comma-separated)</label>
                    <input
                      type="text"
                      value={task.labels?.join(', ') || ''}
                      onChange={(e) => handleArrayChange(
                        index,
                        'tasks',
                        'labels',
                        e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
                      )}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="frontend, bug, documentation"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Dependencies (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={task.dependencies?.join(', ') || ''}
                      onChange={(e) => handleArrayChange(
                        index,
                        'tasks',
                        'dependencies',
                        e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
                      )}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Task 1, Task 2, ..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'workflow':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Workflow & Process</h3>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Development Methodology"
                id="methodology"
                name="methodology"
                type="text"
                value={formData.methodology}
                onChange={handleChange}
                placeholder="e.g., Agile, Waterfall, Hybrid"
              />
              
              <InputField
                label="Sprint Length"
                id="sprintLength"
                name="sprintLength"
                type="text"
                value={formData.sprintLength}
                onChange={handleChange}
                placeholder="e.g., 2 weeks"
              />
              
              <InputField
                label="Meeting Cadence"
                id="meetingCadence"
                name="meetingCadence"
                type="text"
                value={formData.meetingCadence}
                onChange={handleChange}
                placeholder="e.g., Daily standups at 10 AM"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Tools Used</label>
                <button
                  type="button"
                  onClick={() => addStringArrayItem('toolsUsed')}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Tool
                </button>
              </div>
              {formData.toolsUsed.map((tool, index) => (
                <div key={index} className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={tool}
                    onChange={(e) => handleStringArrayChange(index, 'toolsUsed', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter tool name..."
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('toolsUsed', index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Risks & Mitigation</h3>
              <button
                type="button"
                onClick={() => addArrayItem('risks')}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Risk
              </button>
            </div>
            
            {formData.risks.map((risk, index) => (
              <div key={index} className="relative rounded-lg border border-gray-200 p-4">
                <button
                  type="button"
                  onClick={() => removeArrayItem('risks', index)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={risk.description}
                      onChange={(e) => handleArrayChange(index, 'risks', 'description', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Impact</label>
                    <select
                      value={risk.impact}
                      onChange={(e) => handleArrayChange(index, 'risks', 'impact', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Likelihood</label>
                    <select
                      value={risk.likelihood}
                      onChange={(e) => handleArrayChange(index, 'risks', 'likelihood', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Mitigation Strategy</label>
                    <textarea
                      value={risk.mitigation_strategy}
                      onChange={(e) => handleArrayChange(index, 'risks', 'mitigation_strategy', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'communication':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Communication Plan</h3>
            
            <div>
              <label htmlFor="stakeholderUpdates" className="block text-sm font-medium text-gray-700">
                Stakeholder Updates Strategy
              </label>
              <textarea
                id="stakeholderUpdates"
                name="stakeholderUpdates"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.stakeholderUpdates}
                onChange={handleChange}
                placeholder="Describe how and when stakeholders will be updated..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Communication Channels</label>
                <button
                  type="button"
                  onClick={() => addStringArrayItem('communicationChannels')}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Channel
                </button>
              </div>
              {formData.communicationChannels.map((channel, index) => (
                <div key={index} className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={channel}
                    onChange={(e) => handleStringArrayChange(index, 'communicationChannels', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter communication channel..."
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('communicationChannels', index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'docs':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Supporting Documentation</h3>
              <button
                type="button"
                onClick={() => addStringArrayItem('supportingDocs')}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Document Link
              </button>
            </div>
            
            {formData.supportingDocs.map((doc, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={doc}
                  onChange={(e) => handleStringArrayChange(index, 'supportingDocs', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter document URL or reference..."
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('supportingDocs', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {projectId ? 'Edit Project' : 'Create New Project'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {projectId ? 'Update your project details' : 'Fill out the project details to get started'}
          </p>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="grid grid-cols-12 divide-x divide-gray-200">
            <div className="col-span-3 p-6">
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSection(item.id)}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm font-medium ${
                      currentSection === item.id
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        currentSection === item.id
                          ? 'text-indigo-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="col-span-9 p-6">
              <form onSubmit={handleSubmit}>
                {renderSection()}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/create')}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {isSubmitting ? (projectId ? 'Updating...' : 'Creating...') : (projectId ? 'Update Project' : 'Create Project')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}