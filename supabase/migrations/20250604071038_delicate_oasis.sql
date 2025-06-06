/*
  # Create sprints table and add sprint_id to tasks

  1. New Tables
    - `sprints`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `goal` (text)
      - `capacity` (integer)
      - `created_at` (timestamp)

  2. Changes
    - Add sprint_id column to project_tasks table
    - Add index on sprint_id for better performance

  3. Security
    - Enable RLS on sprints table
    - Add policy for authenticated users to manage sprints
*/

-- Create sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  goal text,
  capacity integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

-- Add sprint_id to project_tasks
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS project_tasks_sprint_id_idx ON project_tasks(sprint_id);

-- Enable RLS
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sprints' 
    AND policyname = 'Users can manage sprints for their projects'
  ) THEN
    CREATE POLICY "Users can manage sprints for their projects"
      ON sprints
      USING (EXISTS (
        SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
      ));
  END IF;
END $$;