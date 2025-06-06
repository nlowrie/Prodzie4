/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)
      - `project_name` (text)
      - `status` (text)
      - `progress` (integer)
      - `target_completion_date` (date)
      - `description` (text)
      - `team_size` (integer)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for CRUD operations
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL,
  project_name text NOT NULL,
  status text NOT NULL,
  progress integer DEFAULT 0,
  target_completion_date date NOT NULL,
  description text,
  team_size integer DEFAULT 1,
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own projects
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);