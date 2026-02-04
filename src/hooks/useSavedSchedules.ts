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
  version: number;
}

export function useSavedSchedules() {
  return useQuery({
    queryKey: ['saved_schedules'],
    queryFn: async () => {
      // Fetch ALL saved schedules (don't filter by group)
      // So we can properly select active schedule based on context
      const { data, error } = await supabase
        .from('saved_schedules')
        .select('*')
        .order('created_at', { ascending: false });
      
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

      // Calculate the next version number for this group
      let versionQuery = supabase
        .from('saved_schedules')
        .select('version')
        .eq('user_id', user.id);
      
      if (groupId) {
        versionQuery = versionQuery.eq('group_id', groupId);
      } else {
        versionQuery = versionQuery.is('group_id', null);
      }
      
      const { data: existingVersions } = await versionQuery
        .order('version', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingVersions?.[0]?.version || 0) + 1;

      // Deactivate existing active schedules (all of them)
      await supabase
        .from('saved_schedules')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Create new saved schedule with version
      const { data, error } = await supabase
        .from('saved_schedules')
        .insert({
          user_id: user.id,
          name,
          group_id: groupId || null,
          is_active: true,
          version: nextVersion,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update current DRAFT schedule entries (schedule_id IS NULL) to link to this saved schedule
      // Only update entries for the specific group if groupId is provided
      let updateQuery = supabase
        .from('schedule_entries')
        .update({ schedule_id: data.id })
        .eq('user_id', user.id)
        .is('schedule_id', null);  // Only update draft entries
      
      if (groupId) {
        updateQuery = updateQuery.eq('group_id', groupId);
      }
      
      await updateQuery;
      
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

      // Deactivate all schedules for this user
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
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      toast({ title: 'تم تفعيل الجدول' });
      
      // Return the activated schedule so callers can use it
      return schedule;
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
      // First, unlink all entries from this schedule (set schedule_id to null - they become drafts)
      await supabase
        .from('schedule_entries')
        .update({ schedule_id: null })
        .eq('schedule_id', scheduleId);
      
      // Then delete the saved schedule record
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
