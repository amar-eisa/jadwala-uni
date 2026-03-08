import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || {},
  });
}

export function useActivityLogs(filters?: { entityType?: string; limit?: number }) {
  return useQuery({
    queryKey: ['activity_logs', filters],
    queryFn: async () => {
      let q = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.entityType) {
        q = q.eq('entity_type', filters.entityType);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}
