/*
  # Create sprint_boards table

  1. New Tables
    - `sprint_boards`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `description` (text)
      - `settings` (jsonb) - Stores sprint board configuration
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sprint_boards` table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS sprint_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sprint_boards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage sprint boards for their projects"
  ON sprint_boards
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));