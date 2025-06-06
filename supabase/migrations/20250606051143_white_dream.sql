/*
  # Create kanban_boards table

  1. New Tables
    - `kanban_boards`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `description` (text)
      - `columns` (jsonb) - Board column configuration
      - `card_fields` (jsonb) - Custom card field configuration
      - `allow_attachments` (boolean)
      - `allowed_file_types` (text[])
      - `default_view` (text)
      - `access_level` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for authenticated users
*/

-- Create kanban_boards table if it doesn't exist
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

-- Enable RLS if not already enabled
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage kanban boards for their projects" ON kanban_boards;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policy
CREATE POLICY "Users can manage kanban boards for their projects"
  ON kanban_boards
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));