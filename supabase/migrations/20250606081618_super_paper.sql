/*
  # Auto-sync backlog items to Kanban boards

  1. New Functions
    - `sync_backlog_to_kanban_boards`: Automatically updates Kanban boards when new backlog items are created
    - `get_project_kanban_boards`: Helper function to get all Kanban boards for a project

  2. Triggers
    - `trigger_sync_backlog_to_kanban`: Triggers the sync function when new tasks are created

  3. Purpose
    - Automatically import new backlog items into existing Kanban boards
    - Maintain real-time sync between backlog and delivery boards
    - Map task statuses to appropriate board columns
*/

-- Function to get all Kanban boards for a project
CREATE OR REPLACE FUNCTION get_project_kanban_boards(project_uuid uuid)
RETURNS TABLE(board_id uuid, board_columns jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, columns
  FROM kanban_boards
  WHERE project_id = project_uuid;
END;
$$;

-- Function to map task status to board column
CREATE OR REPLACE FUNCTION map_status_to_column(task_status text, board_columns jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_obj jsonb;
  column_name text;
  column_id text;
BEGIN
  -- Iterate through board columns to find the best match
  FOR column_obj IN SELECT jsonb_array_elements(board_columns)
  LOOP
    column_name := lower(column_obj->>'name');
    column_id := column_obj->>'id';
    
    -- Map common status values to column names
    CASE task_status
      WHEN 'backlog' THEN
        IF column_name LIKE '%backlog%' OR column_name LIKE '%todo%' OR column_name LIKE '%to do%' THEN
          RETURN column_id;
        END IF;
      WHEN 'ready' THEN
        IF column_name LIKE '%ready%' OR column_name LIKE '%planned%' OR column_name LIKE '%plan%' THEN
          RETURN column_id;
        END IF;
      WHEN 'in_progress' THEN
        IF column_name LIKE '%progress%' OR column_name LIKE '%doing%' OR column_name LIKE '%active%' OR column_name LIKE '%work%' THEN
          RETURN column_id;
        END IF;
      WHEN 'review' THEN
        IF column_name LIKE '%review%' OR column_name LIKE '%testing%' OR column_name LIKE '%test%' OR column_name LIKE '%qa%' THEN
          RETURN column_id;
        END IF;
      WHEN 'done' THEN
        IF column_name LIKE '%done%' OR column_name LIKE '%complete%' OR column_name LIKE '%finish%' THEN
          RETURN column_id;
        END IF;
    END CASE;
  END LOOP;
  
  -- If no specific match found, return the first column ID as default
  RETURN (board_columns->0->>'id');
END;
$$;

-- Main function to sync backlog items to Kanban boards
CREATE OR REPLACE FUNCTION sync_backlog_to_kanban_boards()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  board_record RECORD;
  mapped_status text;
BEGIN
  -- Only process if this is a new task (INSERT) and not assigned to a sprint
  IF TG_OP = 'INSERT' AND NEW.sprint_id IS NULL THEN
    
    -- Get all Kanban boards for this project
    FOR board_record IN 
      SELECT board_id, board_columns 
      FROM get_project_kanban_boards(NEW.project_id)
    LOOP
      -- Map the task status to the appropriate board column
      mapped_status := map_status_to_column(NEW.status, board_record.board_columns);
      
      -- Update the task status to match the board column
      -- This ensures the task appears in the correct column when the board is viewed
      UPDATE project_tasks 
      SET status = mapped_status
      WHERE id = NEW.id;
      
      -- Log the sync operation (optional, for debugging)
      RAISE NOTICE 'Synced task % to board % with status %', NEW.id, board_record.board_id, mapped_status;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync new backlog items
DROP TRIGGER IF EXISTS trigger_sync_backlog_to_kanban ON project_tasks;

CREATE TRIGGER trigger_sync_backlog_to_kanban
  AFTER INSERT ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_backlog_to_kanban_boards();

-- Function to manually sync existing backlog items to a specific board
CREATE OR REPLACE FUNCTION manual_sync_backlog_to_board(
  target_project_id uuid,
  target_board_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  board_record RECORD;
  task_record RECORD;
  mapped_status text;
  sync_count integer := 0;
BEGIN
  -- If specific board ID provided, sync only to that board
  IF target_board_id IS NOT NULL THEN
    SELECT id, columns INTO board_record
    FROM kanban_boards
    WHERE id = target_board_id AND project_id = target_project_id;
    
    IF FOUND THEN
      -- Sync all backlog items (not in sprints) to this board
      FOR task_record IN 
        SELECT * FROM project_tasks 
        WHERE project_id = target_project_id AND sprint_id IS NULL
      LOOP
        mapped_status := map_status_to_column(task_record.status, board_record.columns);
        
        UPDATE project_tasks 
        SET status = mapped_status
        WHERE id = task_record.id;
        
        sync_count := sync_count + 1;
      END LOOP;
    END IF;
  ELSE
    -- Sync to all Kanban boards for the project
    FOR board_record IN 
      SELECT board_id, board_columns 
      FROM get_project_kanban_boards(target_project_id)
    LOOP
      FOR task_record IN 
        SELECT * FROM project_tasks 
        WHERE project_id = target_project_id AND sprint_id IS NULL
      LOOP
        mapped_status := map_status_to_column(task_record.status, board_record.board_columns);
        
        UPDATE project_tasks 
        SET status = mapped_status
        WHERE id = task_record.id;
        
        sync_count := sync_count + 1;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN sync_count;
END;
$$;