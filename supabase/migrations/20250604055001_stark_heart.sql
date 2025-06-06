/*
  # Add parent_id to project_tasks table

  1. Changes
    - Add parent_id column with foreign key constraint
    - Add index for better performance on parent_id column

  2. Notes
    - Checks if column exists before adding
    - Skips prevent_self_reference constraint as it already exists
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