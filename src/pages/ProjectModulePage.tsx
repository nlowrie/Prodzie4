import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Tables } from '../types/supabase';
import { supabase } from '../lib/supabase';
import { useProject } from '../lib/ProjectContext';
import { useSidebar } from '../lib/SidebarContext';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import KanbanBoardConfig from '../components/KanbanBoardConfig';
import SprintBoardConfig from '../components/SprintBoardConfig';
import CanvasManager from '../components/CanvasManager';
import ProjectBacklog from '../components/ProjectBacklog';
import TaskBoardPage from './TaskBoardPage';
import LoadingSpinner from '../components/LoadingSpinner';
import KanbanBoardDisplay from '../components/KanbanBoardDisplay';
import SprintBoardDisplay from '../components/SprintBoardDisplay';
import DeliveryModule from '../components/DeliveryModule';
import toast from 'react-hot-toast';

interface ProjectModulePageProps {
  moduleTitle: string;
}

type Board = Tables<'kanban_boards'> | Tables<'sprint_boards'>;

export default function ProjectModulePage({ moduleTitle }: ProjectModulePageProps) {
  const { projectId, boardId } = useParams();
  const location = useLocation();
  const { setCurrentProject } = useProject();
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [selectedCanvasTitle, setSelectedCanvasTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
    
    return () => {
      setCurrentProject(null);
    };
  }, [projectId]);

  useEffect(() => {
    if (boardId && (moduleTitle === "Kanban Board" || moduleTitle === "Sprint Board")) {
      fetchBoardDetails();
    }
  }, [boardId, moduleTitle]);

  const fetchProjectData = async () => {
    try {
      console.log('Fetching project data for ID:', projectId);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Project fetch error:', projectError);
        throw projectError;
      }
      
      console.log('Project data loaded:', projectData);
      setCurrentProject(projectData);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardDetails = async () => {
    if (!boardId) return;

    try {
      setLoading(true);

      // Try to fetch from kanban_boards first
      const { data: kanbanBoards, error: kanbanError } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('id', boardId)
        .limit(1);

      if (kanbanError) {
        console.error('Kanban board fetch error:', kanbanError);
      }

      const kanbanBoard = kanbanBoards?.[0];
      if (kanbanBoard) {
        setSelectedBoard(kanbanBoard);
        return;
      }

      // If not found in kanban_boards, try sprint_boards
      const { data: sprintBoards, error: sprintError } = await supabase
        .from('sprint_boards')
        .select('*')
        .eq('id', boardId)
        .limit(1);

      if (sprintError) {
        console.error('Sprint board fetch error:', sprintError);
      }

      const sprintBoard = sprintBoards?.[0];
      if (sprintBoard) {
        setSelectedBoard(sprintBoard);
        return;
      }

      if (!kanbanBoard && !sprintBoard) {
        toast.error('Board not found');
      }
    } catch (error) {
      console.error('Error fetching board details:', error);
      toast.error('Failed to load board details');
    } finally {
      setLoading(false);
    }
  };

  const renderModule = () => {
    const path = location.pathname;

    // Handle delivery module routes
    if (path.includes('/delivery')) {
      if (path.includes('/kanban/new') || moduleTitle === "Create Kanban Board") {
        return <KanbanBoardConfig />;
      }
      if (path.includes('/sprint/new') || moduleTitle === "Create Sprint Board") {
        return <SprintBoardConfig />;
      }
      if (path.includes('/kanban/') && path.includes('/edit')) {
        return selectedBoard ? <KanbanBoardConfig existingBoard={selectedBoard as Tables<'kanban_boards'>} /> : <LoadingSpinner />;
      }
      if (path.includes('/kanban/') && boardId) {
        return selectedBoard ? <KanbanBoardDisplay board={selectedBoard as Tables<'kanban_boards'>} /> : <LoadingSpinner />;
      }
      if (path.includes('/sprint/') && boardId) {
        return selectedBoard ? <SprintBoardDisplay board={selectedBoard as Tables<'sprint_boards'>} /> : <LoadingSpinner />;
      }
      if (moduleTitle === "Delivery Module") {
        return <DeliveryModule />;
      }
    }

    // Handle other modules
    switch (moduleTitle) {
      case "Brainstorming Module":
        return <CanvasManager onCanvasSelected={setSelectedCanvasTitle} />;
      case "Backlog Module":
        return <ProjectBacklog />;
      default:
        return <p className="mt-2 text-gray-600">Coming soon...</p>;
    }
  };

  if (loading && !selectedCanvasTitle) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {selectedCanvasTitle || moduleTitle}
        </h1>
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-gray-500" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
      {renderModule()}
    </div>
  );
}