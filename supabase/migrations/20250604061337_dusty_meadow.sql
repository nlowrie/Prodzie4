/*
  # Add Canvas Link Column to Project Tasks

  1. Changes
    - Add `linked_canvas_object_id` column to project_tasks table
    - This column will store the unique ID of the linked canvas object

  2. Purpose
    - Enable bi-directional linking between canvas objects and backlog items
    - Support traceability between visual designs and project tasks
*/

ALTER TABLE project_tasks
  ADD COLUMN IF NOT EXISTS linked_canvas_object_id text;