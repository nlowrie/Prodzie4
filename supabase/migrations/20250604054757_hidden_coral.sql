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