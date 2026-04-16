import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleEntry } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { trackScheduleCreated, trackScheduleCleared, trackScheduleEntryMoved } from '@/lib/amplitude';

export function useScheduleEntries(scheduleId?: string | null) {
  return useQuery({
    queryKey: ['schedule_entries', scheduleId ?? 'draft'],
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      let query = supabase
        .from('schedule_entries')
        .select(`
          *,
          room:rooms(*),
          time_slot:time_slots(*),
          subject:subjects(
            *,
            professor:professors(*),
            group:student_groups(*)
          )
        `);
      
      // Filter by schedule_id - if provided, get that schedule's entries
      // If not provided (null/undefined), get draft entries (schedule_id IS NULL)
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      } else {
        query = query.is('schedule_id', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });
}

export function useGenerateSchedule(onReport?: (report: any) => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, scheduleId }: { groupId?: string; scheduleId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: { 
          group_id: groupId,
          schedule_id: scheduleId ?? null
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      trackScheduleCreated({ scheduled: data.scheduled, total: data.total });
      if (data?.report && onReport) {
        onReport(data.report);
      }
      toast({ 
        title: 'تم توليد الجدول بنجاح', 
        description: `تم جدولة ${data.scheduled} من ${data.total} مادة`
      });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في توليد الجدول', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useClearSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, scheduleId }: { groupId?: string; scheduleId?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');
      
      let query = supabase
        .from('schedule_entries')
        .delete()
        .eq('user_id', user.id);
      
      // Restrict delete to specific schedule_id or drafts only
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      } else {
        query = query.is('schedule_id', null);
      }
      
      // Further restrict by group_id if specified
      if (groupId) {
        query = query.eq('group_id', groupId);
      }
      
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      trackScheduleCleared();
      toast({ title: 'تم مسح الجدول بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في مسح الجدول', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMoveScheduleEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      entryId, 
      newTimeSlotId, 
      newRoomId 
    }: { 
      entryId: string; 
      newTimeSlotId: string; 
      newRoomId: string;
    }) => {
      const { data, error } = await supabase
        .from('schedule_entries')
        .update({ 
          time_slot_id: newTimeSlotId,
          room_id: newRoomId 
        })
        .eq('id', entryId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ entryId, newTimeSlotId, newRoomId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['schedule_entries'] });
      
      // Snapshot all schedule_entries queries
      const previousQueries = queryClient.getQueriesData<ScheduleEntry[]>({ queryKey: ['schedule_entries'] });
      
      // Optimistically update all matching queries
      queryClient.setQueriesData<ScheduleEntry[]>(
        { queryKey: ['schedule_entries'] },
        (old) => old?.map(entry => 
          entry.id === entryId 
            ? { ...entry, time_slot_id: newTimeSlotId, room_id: newRoomId }
            : entry
        )
      );
      
      return { previousQueries };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      trackScheduleEntryMoved();
      toast({ title: 'تم نقل المحاضرة بنجاح' });
    },
    onError: (error, _vars, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast({ 
        title: 'خطأ في نقل المحاضرة', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
