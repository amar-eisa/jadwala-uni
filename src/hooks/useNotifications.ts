import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  group_id: string | null;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(groupId?: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    staleTime: 1 * 60 * 1000,
    queryKey: ['notifications', groupId],
    queryFn: async () => {
      let q = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (groupId) {
        q = q.eq('group_id', groupId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('student-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const newNotif = payload.new as Notification;
        // Only show toast if relevant to this group
        if (!groupId || newNotif.group_id === groupId) {
          toast.info(newNotif.title, { description: newNotif.message });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  return query;
}

export function useUnreadCount(groupId?: string | null) {
  return useQuery({
    queryKey: ['notifications_unread', groupId],
    queryFn: async () => {
      let q = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);

      if (groupId) {
        q = q.eq('group_id', groupId);
      }

      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId?: string | null) => {
      let q = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (groupId) {
        q = q.eq('group_id', groupId);
      }

      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread'] });
    },
  });
}

export async function sendScheduleNotification(groupId: string, scheduleName: string) {
  await supabase.from('notifications').insert({
    group_id: groupId,
    title: 'تم تحديث الجدول الدراسي',
    message: `تم تفعيل جدول جديد: ${scheduleName}`,
    type: 'schedule_update',
  });
}
