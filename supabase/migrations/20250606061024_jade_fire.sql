/*
  # Create board tables

  1. New Tables
    - `kanban_boards` for managing kanban-style boards
    - `sprint_boards` for managing sprint boards

  2. Changes
    - Add RLS policies if they don't exist
    - Add proper foreign key constraints
    - Add default values for configuration fields

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create kanban_boards table
CREATE TABLE IF NOT EXISTS kanban_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  card_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  allow_attachments boolean DEFAULT true,
  allowed_file_types text[] DEFAULT ARRAY['.pdf'::text, '.doc'::text, '.docx'::text, '.png'::text, '.jpg'::text, '.jpeg'::text],
  default_view text DEFAULT 'detailed'::text,
  access_level text DEFAULT 'team'::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sprint_boards table
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
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_boards ENABLE ROW LEVEL SECURITY;

-- Create policies for kanban_boards if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'kanban_boards' 
    AND policyname = 'Users can manage kanban boards for their projects'
  ) THEN
    CREATE POLICY "Users can manage kanban boards for their projects"
      ON kanban_boards
      USING (EXISTS (
        SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create policies for sprint_boards if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'sprint_boards' 
    AND policyname = 'Users can manage sprint boards for their projects'
  ) THEN
    CREATE POLICY "Users can manage sprint boards for their projects"
      ON sprint_boards
      USING (EXISTS (
        SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
      ));
  END IF;
END $$;