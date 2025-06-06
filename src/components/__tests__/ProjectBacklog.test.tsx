import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import { ProjectProvider } from '../../lib/ProjectContext';
import ProjectBacklog from '../ProjectBacklog';
import { supabase } from '../../lib/supabase';
import * as taskOrdering from '../../utils/taskOrdering';

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      then: jest.fn()
    }))
  }
}));

// Mock task ordering utilities
jest.mock('../../utils/taskOrdering', () => ({
  reindexTasks: jest.fn(),
  getNextOrder: jest.fn()
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

// Mock useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ projectId: 'test-project-id' })
}));

describe('ProjectBacklog', () => {
  const mockTasks = [
    {
      id: 'epic-1',
      title: 'Epic One',
      type: 'epic',
      order: 1000,
      parent_id: null,
      sprint_id: null,
      priority: 'high',
      status: 'in_progress',
      assignee: 'John',
      due_date: '2025-12-31',
      created_at: '2025-01-01',
      project_id: 'test-project-id',
      description: 'Epic description',
      story_points: 8,
      children: []
    },
    {
      id: 'story-1',
      title: 'Story One',
      type: 'user_story',
      order: 4000,
      parent_id: 'epic-1',
      sprint_id: null,
      priority: 'medium',
      status: 'backlog',
      assignee: 'Alice',
      due_date: '2025-12-31',
      created_at: '2025-01-02',
      project_id: 'test-project-id',
      description: 'Story one description',
      story_points: 3,
      children: []
    },
    {
      id: 'story-2',
      title: 'Story Two',
      type: 'user_story',
      order: 2000,
      parent_id: 'epic-1',
      sprint_id: null,
      priority: 'low',
      status: 'backlog',
      assignee: 'Bob',
      due_date: '2025-12-31',
      created_at: '2025-01-03',
      project_id: 'test-project-id',
      description: 'Story two description',
      story_points: 5,
      children: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock initial data fetch
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({ data: mockTasks, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    }));

    (taskOrdering.getNextOrder as jest.Mock).mockResolvedValue(1500);
    (taskOrdering.reindexTasks as jest.Mock).mockResolvedValue([]);
  });

  const renderBacklog = () => {
    const scrollRef = React.createRef<HTMLElement>();
    return render(
      <BrowserRouter>
        <ProjectProvider>
          <ProjectBacklog scrollRef={scrollRef} />
        </ProjectProvider>
      </BrowserRouter>
    );
  };

  it('should load and display tasks in correct order', async () => {
    renderBacklog();

    await waitFor(() => {
      expect(screen.getByText('Epic One')).toBeInTheDocument();
    });

    const taskElements = screen.getAllByRole('button', { name: /drag to reorder/i });
    expect(taskElements).toHaveLength(3);

    // Verify initial order
    const taskTitles = screen.getAllByText(/Story (One|Two)/);
    expect(taskTitles[0]).toHaveTextContent('Story Two'); // order: 2000
    expect(taskTitles[1]).toHaveTextContent('Story One'); // order: 4000
  });

  it('should display task details correctly', async () => {
    renderBacklog();

    await waitFor(() => {
      expect(screen.getByText('Epic One')).toBeInTheDocument();
      expect(screen.getByText('Story One')).toBeInTheDocument();
      expect(screen.getByText('Story Two')).toBeInTheDocument();
      
      // Check priorities
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();

      // Check assignees
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();

      // Check story points
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should handle task reordering', async () => {
    renderBacklog();

    await waitFor(() => {
      expect(screen.getByText('Story One')).toBeInTheDocument();
      expect(screen.getByText('Story Two')).toBeInTheDocument();
    });

    // Verify that tasks are initially ordered by their order value
    const taskTitles = screen.getAllByText(/Story (One|Two)/);
    expect(taskTitles[0]).toHaveTextContent('Story Two'); // order: 2000
    expect(taskTitles[1]).toHaveTextContent('Story One'); // order: 4000

    // Mock the database update for reordering
    (supabase.from as jest.Mock).mockImplementation(() => ({
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      eq: jest.fn().mockReturnThis()
    }));

    // Mock the next order value
    (taskOrdering.getNextOrder as jest.Mock).mockResolvedValue(3000);

    // Verify that the reordering utilities were called with correct parameters
    await waitFor(() => {
      expect(taskOrdering.getNextOrder).toHaveBeenCalledWith(
        'test-project-id',
        'epic-1',
        null
      );
    });
  });
});