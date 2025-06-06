/*
  # Add batch update function for task orders

  1. New Functions
    - `batch_update_task_orders`: Updates multiple task orders in a single transaction
      - Takes a JSON array of task_id and new order values
      - Updates all tasks in a single transaction for consistency

  2. Purpose
    - Enable efficient batch updates of task orders
    - Maintain data consistency during reordering operations
    - Reduce number of database calls for bulk updates
*/

CREATE OR REPLACE FUNCTION batch_update_task_orders(task_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE project_tasks
  SET "order" = (task_updates ->> 'order')::integer
  FROM jsonb_array_elements(task_updates) AS u
  WHERE project_tasks.id = (u ->> 'id')::uuid;
END;
$$;