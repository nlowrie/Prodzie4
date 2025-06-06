/*
  # Fix batch_update_task_orders function

  1. Changes
    - Fix JSONB array element access in UPDATE statement
    - Ensure proper type casting for order values
    - Add error handling for invalid JSON data

  2. Purpose
    - Enable batch updating of task orders
    - Support drag-and-drop reordering functionality
    - Maintain consistent task ordering
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