/*
  # Add parent-child relationship to project tasks

  1. Changes
    - Add parent_id column to project_tasks table
    - Add index for parent_id column for better query performance

  2. Notes
    - The prevent_self_reference constraint already exists, so we skip adding it
    - Foreign key ensures referential integrity
    - Index improves performance for parent-child relationship queries
*/

-- Add parent_id column with foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_tasks' 
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE project_tasks
      ADD COLUMN parent_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS project_tasks_parent_id_idx ON project_tasks(parent_id);