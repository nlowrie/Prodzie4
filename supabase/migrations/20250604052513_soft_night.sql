/*
  # Add task management fields

  1. Changes
    - Added new columns to project_tasks table:
      - type (text) - Task type (e.g., story, bug, epic)
      - description (text) - Detailed task description
      - acceptance_criteria (text) - Task completion criteria
      - story_points (integer) - Effort estimation
      - priority (text) - Task priority level
      - labels (text[]) - Task categorization tags
      - estimated_hours (integer) - Estimated work hours
      - logged_hours (integer) - Actual work hours logged

  2. Default Values
    - type defaults to 'task'
    - priority defaults to 'medium'
*/

-- Add new columns to project_tasks table
ALTER TABLE project_tasks 
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'task',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS acceptance_criteria text,
  ADD COLUMN IF NOT EXISTS story_points integer,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS labels text[],
  ADD COLUMN IF NOT EXISTS estimated_hours integer,
  ADD COLUMN IF NOT EXISTS logged_hours integer;