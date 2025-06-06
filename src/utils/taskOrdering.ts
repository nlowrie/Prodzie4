import { Tables } from '../types/supabase';
import { supabase } from '../lib/supabase';

type Task = Tables<'project_tasks'>;

const ORDER_INCREMENT = 1000;
const MAX_INTEGER = 2147483647;

export async function reindexTasks(tasks: Task[], parentId: string | null = null, sprintId: string | null = null) {
  if (!tasks.length) return [];

  // Sort tasks by current order and created_at for stable ordering
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.order === b.order) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return (a.order || 0) - (b.order || 0);
  });

  // Calculate new order values with large gaps
  const updates = sortedTasks.map((task, index) => ({
    id: task.id,
    order: Math.min((index + 1) * ORDER_INCREMENT, MAX_INTEGER)
  }));

  try {
    // Update tasks in batches to avoid timeouts
    const batchSize = 50;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const { error } = await supabase.rpc('batch_update_task_orders', {
        task_updates: batch
      });
      if (error) throw error;
    }
    return updates;
  } catch (error) {
    console.error('Error reindexing tasks:', error);
    throw error;
  }
}

export async function getNextOrder(projectId: string, parentId: string | null = null, sprintId: string | null = null): Promise<number> {
  try {
    // Get tasks in the same group
    const query = supabase
      .from('project_tasks')
      .select('order')
      .eq('project_id', projectId);

    if (parentId) {
      query.eq('parent_id', parentId);
    } else {
      query.is('parent_id', null);
    }

    if (sprintId) {
      query.eq('sprint_id', sprintId);
    } else {
      query.is('sprint_id', null);
    }

    const { data, error } = await query.order('order', { ascending: false }).limit(1);

    if (error) throw error;

    // If no tasks exist in this group, start with initial increment
    if (!data?.length || !data[0].order) {
      return ORDER_INCREMENT;
    }

    // Calculate next order value
    const nextOrder = Math.min(data[0].order + ORDER_INCREMENT, MAX_INTEGER);
    return nextOrder;
  } catch (error) {
    console.error('Error getting next order:', error);
    return ORDER_INCREMENT;
  }
}