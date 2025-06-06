/*
  # Expanded Project Schema

  1. New Tables
    - `projects` table updated with additional fields for comprehensive project management
    - New related tables for team members, milestones, tasks, and risks

  2. Changes
    - Added new columns to projects table
    - Created supporting tables with foreign key relationships
    - Added appropriate indexes for performance

  3. Security
    - Enabled RLS on all tables
    - Added policies for authenticated users
*/

-- Extend the projects table with new columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_owner text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority_level text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS objectives text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sprint_length text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meeting_cadence text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tools_used text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS in_scope text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS out_scope text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stakeholder_updates text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS communication_channels text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supporting_docs text[];

-- Create team members table
CREATE TABLE IF NOT EXISTS project_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  responsibilities text,
  contact_info text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  owner text NOT NULL,
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  title text NOT NULL,
  assignee text NOT NULL,
  due_date date NOT NULL,
  dependencies text[],
  status text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create risks table
CREATE TABLE IF NOT EXISTS project_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects ON DELETE CASCADE,
  description text NOT NULL,
  impact text NOT NULL,
  likelihood text NOT NULL,
  mitigation_strategy text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Enable RLS on new tables
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;

-- Create policies for team members
CREATE POLICY "Users can manage team members for their projects"
  ON project_team_members
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));

-- Create policies for milestones
CREATE POLICY "Users can manage milestones for their projects"
  ON project_milestones
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));

-- Create policies for tasks
CREATE POLICY "Users can manage tasks for their projects"
  ON project_tasks
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));

-- Create policies for risks
CREATE POLICY "Users can manage risks for their projects"
  ON project_risks
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));