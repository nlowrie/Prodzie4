import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Users, AlertTriangle, Target, FolderKanban, ChevronRight, Lightbulb, Map, Book, Truck, Kanban as LayoutKanban, KanbanSquare, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useProject } from '../lib/ProjectContext';
import { useSidebar } from '../lib/SidebarContext';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';

type KanbanBoard = Tables<'kanban_boards'>;
type SprintBoard = Tables<'sprint_boards'>;

interface BoardWithType {
  id: string;
  name: string;
  boardType: 'kanban' | 'sprint';
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  subItem?: React.ReactNode;
  isCollapsed: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, isActive, subItem, isCollapsed }) => {
  return (
    <div>
      <Link
        to={to}
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-lg transition-colors ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={isCollapsed ? label : undefined}
      >
        {icon}
        {!isCollapsed && <span className="font-medium">{label}</span>}
      </Link>
      {!isCollapsed && subItem}
    </div>
  );
};

export default function DashboardSidebar() {
  const location = useLocation();
  const params = useParams();
  const currentPath = location.pathname;
  const { currentProject } = useProject();
  const { isSidebarCollapsed } = useSidebar();
  const [boards, setBoards] = useState<BoardWithType[]>([]);
  const [deliveryExpanded, setDeliveryExpanded] = useState(true);

  // Extract projectId from URL params or current project
  const projectId = params.projectId || currentProject?.id;
  
  // Check if we're in a project context (either from URL or current project)
  const isInProjectContext = projectId && (currentPath.includes(`/projects/${projectId}`) || currentProject);

  useEffect(() => {
    if (isInProjectContext && projectId) {
      fetchBoards();
    }
  }, [isInProjectContext, projectId]);

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
    }
  };

  const projectSubLinks = isInProjectContext ? [
    {
      to: `/dashboard/projects/${projectId}/summary`,
      icon: <LayoutDashboard size={16} />,
      label: 'Project Summary',
    },
    {
      to: `/dashboard/projects/${projectId}/brainstorming`,
      icon: <Lightbulb size={16} />,
      label: 'Brainstorming',
    },
    {
      to: `/dashboard/projects/${projectId}/roadmap`,
      icon: <Map size={16} />,
      label: 'Roadmapping',
    },
    {
      to: `/dashboard/projects/${projectId}/knowledge`,
      icon: <Book size={16} />,
      label: 'Knowledge Base',
    },
    {
      to: `/dashboard/projects/${projectId}/delivery`,
      icon: <Truck size={16} />,
      label: 'Delivery',
      hasSubItems: true,
    },
    {
      to: `/dashboard/projects/${projectId}/backlog`,
      icon: <ListTodo size={16} />,
      label: 'Backlog',
    },
    {
      to: `/dashboard/projects/${projectId}/board`,
      icon: <KanbanSquare size={16} />,
      label: 'Task Board',
    }
  ] : [];

  const sidebarLinks = [
    {
      to: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: 'Overview',
    },
    {
      to: '/dashboard/create',
      icon: <FolderKanban size={20} />,
      label: 'Projects',
      subItem: isInProjectContext && !isSidebarCollapsed && (
        <div className="space-y-1">
          <Link
            to={`/dashboard/projects/${projectId}`}
            className={`ml-6 flex items-center space-x-2 px-4 py-2 text-sm ${
              currentPath === `/dashboard/projects/${projectId}`
                ? 'text-indigo-700 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChevronRight size={16} />
            <span className="truncate font-medium">
              {currentProject?.project_name || 'Loading...'}
            </span>
          </Link>
          {projectSubLinks.map((link) => (
            <React.Fragment key={link.to}>
              {link.hasSubItems ? (
                <div>
                  <div className="flex items-center">
                    <Link
                      to={link.to}
                      className={`ml-10 flex flex-1 items-center space-x-2 px-4 py-2 text-sm ${
                        currentPath === link.to
                          ? 'text-indigo-700 font-medium bg-indigo-50 rounded-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                    <button
                      onClick={() => setDeliveryExpanded(!deliveryExpanded)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {deliveryExpanded ? (
                        <ChevronUp size={14} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                  {deliveryExpanded && boards.length > 0 && (
                    <div className="ml-16 space-y-1">
                      {boards.map(board => (
                        <Link
                          key={board.id}
                          to={`/dashboard/projects/${projectId}/delivery/${board.boardType}/${board.id}`}
                          className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                            currentPath.includes(`/delivery/${board.boardType}/${board.id}`)
                              ? 'text-indigo-700 font-medium bg-indigo-50 rounded-md'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                          }`}
                        >
                          {board.boardType === 'kanban' ? (
                            <KanbanSquare size={14} />
                          ) : (
                            <Zap size={14} />
                          )}
                          <span className="truncate">{board.name}</span>
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            board.boardType === 'kanban' 
                              ? 'bg-purple-100 text-purple-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {board.boardType === 'kanban' ? 'K' : 'S'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={link.to}
                  className={`ml-10 flex items-center space-x-2 px-4 py-2 text-sm ${
                    currentPath === link.to
                      ? 'text-indigo-700 font-medium bg-indigo-50 rounded-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      ),
    },
    {
      to: '/dashboard/tasks',
      icon: <ListTodo size={20} />,
      label: 'Tasks',
    },
    {
      to: '/dashboard/milestones',
      icon: <Target size={20} />,
      label: 'Milestones',
    },
    {
      to: '/dashboard/team',
      icon: <Users size={20} />,
      label: 'Team',
    },
    {
      to: '/dashboard/risks',
      icon: <AlertTriangle size={20} />,
      label: 'Risks',
    },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        {/* Project Context Indicator */}
        {isInProjectContext && currentProject && !isSidebarCollapsed && (
          <div className="mb-4 rounded-lg bg-indigo-50 p-3">
            <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
              Current Project
            </div>
            <div className="mt-1 text-sm font-medium text-indigo-900 truncate">
              {currentProject.project_name}
            </div>
            <div className="mt-1 text-xs text-indigo-600">
              {currentProject.status} • {currentProject.progress}% complete
            </div>
            {boards.length > 0 && (
              <div className="mt-2 text-xs text-indigo-600">
                {boards.length} delivery board{boards.length !== 1 ? 's' : ''}
                {boards.filter(b => b.boardType === 'kanban').length > 0 && (
                  <span className="ml-1">
                    ({boards.filter(b => b.boardType === 'kanban').length} Kanban, {boards.filter(b => b.boardType === 'sprint').length} Sprint)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        <nav className="space-y-1">
          {sidebarLinks.map((link) => (
            <SidebarLink
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label}
              isActive={currentPath === link.to}
              subItem={link.subItem}
              isCollapsed={isSidebarCollapsed}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}