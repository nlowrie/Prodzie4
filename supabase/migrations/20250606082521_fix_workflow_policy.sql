-- Create workflow board relationship assignments table
CREATE TABLE IF NOT EXISTS workflow_board_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  board_id uuid NOT NULL,
  board_type text NOT NULL CHECK (board_type IN ('kanban', 'sprint')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (workflow_id, board_id)
);

-- Add RLS policies for workflow_board_assignments
ALTER TABLE workflow_board_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow board assignments
CREATE POLICY "Users can view workflow assignments for their projects" ON workflow_board_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN projects p ON w.project_id = p.id
      WHERE workflow_board_assignments.workflow_id = w.id
      AND p.id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage workflow assignments for their projects" ON workflow_board_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN projects p ON w.project_id = p.id
      WHERE workflow_board_assignments.workflow_id = w.id
      AND p.id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );
CREATE TABLE IF NOT EXISTS workflow_board_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  board_id uuid NOT NULL,
  board_type text NOT NULL CHECK (board_type IN ('kanban', 'sprint')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (workflow_id, board_id)
);

-- Add RLS policies for workflow_board_assignments
ALTER TABLE workflow_board_assignments ENABLE ROW LEVEL SECURITY;

-- Create the workflow policy that uses user_id instead of owner_id
CREATE POLICY "Users can manage workflows for their projects" ON workflows
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
      UNION
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Create policies for workflow assignments
CREATE POLICY "Users can view workflow assignments for their projects" ON workflow_board_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN projects p ON w.project_id = p.id
      WHERE workflow_board_assignments.workflow_id = w.id
      AND p.id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage workflow assignments for their projects" ON workflow_board_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflows w
      JOIN projects p ON w.project_id = p.id
      WHERE workflow_board_assignments.workflow_id = w.id
      AND p.id IN (
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
      )
    )
  );
