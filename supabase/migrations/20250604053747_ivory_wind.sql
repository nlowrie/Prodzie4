/*
  # Add parent_id to project_tasks table

  1. Changes
    - Add parent_id column to project_tasks table
    - Add foreign key constraint to ensure parent_id references valid tasks
    - Add check constraint to prevent self-referencing tasks
    - Add index on parent_id for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add parent_id column with foreign key constraint
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE;

-- Add constraint to prevent self-referencing
ALTER TABLE project_tasks
  ADD CONSTRAINT prevent_self_reference
  CHECK (id != parent_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS project_tasks_parent_id_idx ON project_tasks(parent_id);