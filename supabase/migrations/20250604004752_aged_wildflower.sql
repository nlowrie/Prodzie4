/*
  # Create project_canvases table

  1. New Tables
    - `project_canvases`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `title` (text)
      - `description` (text)
      - `content` (jsonb) - Stores canvas elements and their positions
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `last_modified_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `project_canvases` table
    - Add policies for authenticated users to manage canvases for their projects
*/

CREATE TABLE IF NOT EXISTS project_canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  last_modified_by uuid REFERENCES auth.users(id),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE project_canvases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage canvases for their projects"
  ON project_canvases
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));