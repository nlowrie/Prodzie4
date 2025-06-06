-- Create a junction table for workflow-board relationships
CREATE TABLE workflow_board_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  board_id uuid NOT NULL,
  board_type text NOT NULL CHECK (board_type IN ('kanban', 'sprint')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (workflow_id, board_id)
);

-- Add RLS policies
ALTER TABLE workflow_board_assignments ENABLE ROW LEVEL SECURITY;

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
