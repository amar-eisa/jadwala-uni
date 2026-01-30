import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SavedSchedule {
  id: string;
  user_id: string;
  name: string;
  group_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function useSavedSchedules(groupId?: string) {
  return useQuery({
    queryKey: ['saved_schedules', groupId],
    queryFn: async () => {
      let query = supabase
        .from('saved_schedules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (groupId && groupId !== 'all') {
        query = query.eq('group_id', groupId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SavedSchedule[];
    },
  });
}

export function useSaveSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, groupId }: { name: string; groupId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // Deactivate existing active schedules for this group
      await supabase
        .from('saved_schedules')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Create new saved schedule
      const { data, error } = await supabase
        .from('saved_schedules')
        .insert({
          user_id: user.id,
          name,
          group_id: groupId || null,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update current schedule entries to link to this saved schedule
      const updateQuery = supabase
        .from('schedule_entries')
        .update({ schedule_id: data.id })
        .eq('user_id', user.id);
      
      if (groupId) {
        await updateQuery.eq('group_id', groupId);
      } else {
        await updateQuery;
      }
      
      return data as SavedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      toast({ title: 'تم حفظ الجدول بنجاح' });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في حفظ الجدول', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useActivateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // Get the schedule to activate
      const { data: schedule, error: fetchError } = await supabase
        .from('saved_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
      
      if (fetchError) throw fetchError;

      // Deactivate all schedules
      await supabase
        .from('saved_schedules')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate the selected schedule
      const { error } = await supabase
        .from('saved_schedules')
        .update({ is_active: true })
        .eq('id', scheduleId);
      
      if (error) throw error;
      
      return schedule as SavedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      toast({ title: 'تم تفعيل الجدول' });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في تفعيل الجدول', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteSavedSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('saved_schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      toast({ title: 'تم حذف الجدول' });
    },
    onError: (error) => {
      toast({ 
        title: 'خطأ في حذف الجدول', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
