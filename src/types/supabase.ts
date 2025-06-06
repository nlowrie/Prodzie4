export interface Database {
  public: {
    Tables: {
      project_tasks: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          title: string;
          type: string;
          description: string | null;
          acceptance_criteria: string | null;
          story_points: number | null;
          priority: string;
          labels: string[] | null;
          assignee: string;
          due_date: string;
          dependencies: string[] | null;
          status: string;
          estimated_hours: number | null;
          logged_hours: number | null;
          created_at: string;
          linked_canvas_object_id: string | null;
          sprint_id: string | null;
          order: number;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          title: string;
          type: string;
          description?: string | null;
          acceptance_criteria?: string | null;
          story_points?: number | null;
          priority: string;
          labels?: string[] | null;
          assignee: string;
          due_date: string;
          dependencies?: string[] | null;
          status: string;
          estimated_hours?: number | null;
          logged_hours?: number | null;
          created_at?: string;
          linked_canvas_object_id?: string | null;
          sprint_id?: string | null;
          order?: number;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          title?: string;
          type?: string;
          description?: string | null;
          acceptance_criteria?: string | null;
          story_points?: number | null;
          priority?: string;
          labels?: string[] | null;
          assignee?: string;
          due_date?: string;
          dependencies?: string[] | null;
          status?: string;
          estimated_hours?: number | null;
          logged_hours?: number | null;
          created_at?: string;
          linked_canvas_object_id?: string | null;
          sprint_id?: string | null;
          order?: number;
        };
      };
      sprints: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          start_date: string;
          end_date: string;
          goal: string | null;
          capacity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          start_date: string;
          end_date: string;
          goal?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          goal?: string | null;
          capacity?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']