import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScheduleEntry } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useScheduleEntries() {
  return useQuery({
    queryKey: ['schedule_entries'],
    queryFn: async () => {
      const { data, error } = await supabase
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
      
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-schedule');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
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
    mutationFn: async () => {
      const { error } = await supabase
        .from('schedule_entries')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      toast({ title: 'تم نقل المحاضرة بنجاح' });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في نقل المحاضرة', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
