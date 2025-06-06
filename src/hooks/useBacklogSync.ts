import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UseBacklogSyncProps {
  projectId: string;
  boardId?: string;
  onNewItem?: (item: any) => void;
  enabled?: boolean;
}

export function useBacklogSync({ 
  projectId, 
  boardId, 
  onNewItem, 
  enabled = true 
}: UseBacklogSyncProps) {
  useEffect(() => {
    if (!enabled || !projectId) return;

    // Subscribe to new task insertions for this project
    const subscription = supabase
      .channel(`backlog-sync-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newTask = payload.new;
          
          // Only process tasks not assigned to sprints (backlog items)
          if (!newTask.sprint_id) {
            console.log('New backlog item detected:', newTask);
            
            // Show notification
            toast.success(`New backlog item "${newTask.title}" automatically added to board`);
            
            // Call callback if provided
            if (onNewItem) {
              onNewItem(newTask);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, boardId, onNewItem, enabled]);

  // Function to manually trigger sync for existing items
  const manualSync = async (targetBoardId?: string) => {
    try {
      const { data, error } = await supabase.rpc('manual_sync_backlog_to_board', {
        target_project_id: projectId,
        target_board_id: targetBoardId || null
      });

      if (error) throw error;

      toast.success(`Synced ${data} backlog items to board`);
      return data;
    } catch (error) {
      console.error('Error syncing backlog items:', error);
      toast.error('Failed to sync backlog items');
      return 0;
    }
  };

  return { manualSync };
}