CREATE OR REPLACE FUNCTION batch_update_task_orders(task_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_count integer;
  log_message text;
BEGIN
  -- Input validation
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

  -- Log the update operation
  log_message := format('Updating orders for %s tasks', task_count);
  RAISE NOTICE '%', log_message;

  -- Perform the update within a transaction
  BEGIN
    -- Lock the tasks to prevent concurrent updates
    PERFORM id 
    FROM project_tasks 
    WHERE id IN (
      SELECT (u->>'id')::uuid 
      FROM jsonb_array_elements(task_updates) AS u
    )
    FOR UPDATE;

    -- Update task orders
    UPDATE project_tasks t
    SET "order" = CASE 
      WHEN (u->>'order')::integer > 2147483647 THEN 2147483647
      WHEN (u->>'order')::integer < 0 THEN 0
      ELSE (u->>'order')::integer 
    END
    FROM jsonb_array_elements(task_updates) AS u
    WHERE t.id = (u->>'id')::uuid;

    GET DIAGNOSTICS task_count = ROW_COUNT;
    
    -- Log success
    log_message := format('Successfully updated %s tasks', task_count);
    RAISE NOTICE '%', log_message;

    EXCEPTION WHEN OTHERS THEN
      -- Log error details
      log_message := format('Error updating task orders: %s', SQLERRM);
      RAISE EXCEPTION '%', log_message;
  END;
END;
$$;