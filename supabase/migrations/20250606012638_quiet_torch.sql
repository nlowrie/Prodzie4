/*
  # Fix task ordering function

  1. Changes
    - Add better error handling
    - Add input validation
    - Add order value clamping
    - Add transaction support
    - Add proper security context
*/

CREATE OR REPLACE FUNCTION batch_update_task_orders(task_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_count integer;
BEGIN
  -- Validate input
  IF task_updates IS NULL THEN
    RAISE EXCEPTION 'task_updates cannot be null';
  END IF;

  IF jsonb_typeof(task_updates) != 'array' THEN
    RAISE EXCEPTION 'task_updates must be a JSON array';
  END IF;

  -- Get count of tasks to update
  SELECT count(*) INTO task_count
  FROM jsonb_array_elements(task_updates) AS u;

  IF task_count = 0 THEN
    RETURN;
  END IF;

  -- Perform the update within a transaction
  BEGIN
    UPDATE project_tasks t
    SET "order" = CASE 
      WHEN (u->>'order')::integer > 2147483647 THEN 2147483647
      WHEN (u->>'order')::integer < 0 THEN 0
      ELSE (u->>'order')::integer 
    END
    FROM jsonb_array_elements(task_updates) AS u
    WHERE t.id = (u->>'id')::uuid;

    -- Verify update count
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No tasks were updated';
    END IF;

    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating task orders: %', SQLERRM;
  END;
END;
$$;