/*
  # Fix batch update function for task ordering

  1. Changes
    - Update batch_update_task_orders function to handle array input correctly
    - Add proper error handling and type checking
    - Add security definer for proper permissions

  2. Purpose
    - Enable efficient batch updates of task orders
    - Maintain data integrity during reordering operations
    - Improve performance of drag and drop operations
*/

CREATE OR REPLACE FUNCTION batch_update_task_orders(task_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF jsonb_typeof(task_updates) != 'array' THEN
    RAISE EXCEPTION 'task_updates must be a JSON array';
  END IF;

  UPDATE project_tasks t
  SET "order" = (u->>'order')::integer
  FROM jsonb_array_elements(task_updates) AS u
  WHERE t.id = (u->>'id')::uuid;
END;
$$;