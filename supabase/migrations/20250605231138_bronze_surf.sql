/*
  # Add order column to project_tasks

  1. Changes
    - Add `order` column to project_tasks table
    - Add index on order column for better performance
    - Update existing rows with sequential order values

  2. Purpose
    - Enable precise ordering of tasks within their parent groups
    - Support drag and drop reordering functionality
    - Maintain consistent ordering when tasks are moved or nested
*/

-- Add order column
ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS project_tasks_order_idx ON project_tasks("order");

-- Update existing rows with sequential order values
WITH numbered_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_id, '00000000-0000-0000-0000-000000000000')
      ORDER BY created_at
    ) * 1000 as new_order
  FROM project_tasks
)
UPDATE project_tasks
SET "order" = numbered_tasks.new_order
FROM numbered_tasks
WHERE project_tasks.id = numbered_tasks.id;