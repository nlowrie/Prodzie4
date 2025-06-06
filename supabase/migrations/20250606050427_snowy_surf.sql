/*
  # Add Kanban Boards Support

  1. New Tables
    - `kanban_boards`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `description` (text)
      - `columns` (jsonb)
      - `card_fields` (jsonb)
      - `allow_attachments` (boolean)
      - `allowed_file_types` (text[])
      - `default_view` (text)
      - `access_level` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on kanban_boards table
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS kanban_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  columns jsonb NOT NULL DEFAULT '[]',
  card_fields jsonb NOT NULL DEFAULT '[]',
  allow_attachments boolean DEFAULT true,
  allowed_file_types text[] DEFAULT ARRAY['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
  default_view text DEFAULT 'detailed',
  access_level text DEFAULT 'team',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage kanban boards for their projects"
  ON kanban_boards
  USING (EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid()
  ));