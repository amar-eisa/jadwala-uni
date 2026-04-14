import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLog';
import { sendScheduleNotification } from '@/hooks/useNotifications';
import { trackScheduleSaved } from '@/lib/amplitude';

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

      await supabase
        .from('saved_schedules')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

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
      
      let updateQuery = supabase
        .from('schedule_entries')
        .update({ schedule_id: data.id })
        .eq('user_id', user.id)
        .is('schedule_id', null);
      
      if (groupId) {
        updateQuery = updateQuery.eq('group_id', groupId);
      }
      
      await updateQuery;

      await logActivity('created', 'schedule', data.id, { name, groupId });
      
      return data as SavedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      trackScheduleSaved();
      toast({ title: 'تم حفظ الجدول بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حفظ الجدول', description: error.message, variant: 'destructive' });
    },
  });
}

export function useActivateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { data: schedule, error: fetchError } = await supabase
        .from('saved_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
      
      if (fetchError) throw fetchError;

      await supabase
        .from('saved_schedules')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('saved_schedules')
        .update({ is_active: true })
        .eq('id', scheduleId);
      
      if (error) throw error;

      await logActivity('activated', 'schedule', scheduleId, { name: schedule.name });

      // Send notification to students if schedule has a group
      if (schedule.group_id) {
        await sendScheduleNotification(schedule.group_id, schedule.name);
      }
      
      return schedule as SavedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      toast({ title: 'تم تفعيل الجدول' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تفعيل الجدول', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSavedSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // Get schedule name for logging
      const { data: schedule } = await supabase
        .from('saved_schedules')
        .select('name')
        .eq('id', scheduleId)
        .single();

      await supabase
        .from('schedule_entries')
        .update({ schedule_id: null })
        .eq('schedule_id', scheduleId);
      
      const { error } = await supabase
        .from('saved_schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) throw error;

      await logActivity('deleted', 'schedule', scheduleId, { name: schedule?.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      toast({ title: 'تم حذف الجدول' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف الجدول', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDuplicateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ scheduleId, newName }: { scheduleId: string; newName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // Get original schedule
      const { data: original, error: fetchErr } = await supabase
        .from('saved_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
      
      if (fetchErr) throw fetchErr;

      // Create new schedule (not active)
      const { data: newSchedule, error: createErr } = await supabase
        .from('saved_schedules')
        .insert({
          user_id: user.id,
          name: newName,
          group_id: original.group_id,
          is_active: false,
          version: 1,
        })
        .select()
        .single();
      
      if (createErr) throw createErr;

      // Copy all entries from original schedule
      const { data: entries, error: entriesErr } = await supabase
        .from('schedule_entries')
        .select('*')
        .eq('schedule_id', scheduleId);
      
      if (entriesErr) throw entriesErr;

      if (entries && entries.length > 0) {
        const newEntries = entries.map(e => ({
          user_id: user.id,
          subject_id: e.subject_id,
          room_id: e.room_id,
          time_slot_id: e.time_slot_id,
          group_id: e.group_id,
          schedule_id: newSchedule.id,
        }));

        const { error: insertErr } = await supabase
          .from('schedule_entries')
          .insert(newEntries);
        
        if (insertErr) throw insertErr;
      }

      await logActivity('duplicated', 'schedule', newSchedule.id, { 
        name: newName, 
        originalName: original.name,
        originalId: scheduleId 
      });

      return newSchedule as SavedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_entries'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      toast({ title: 'تم نسخ الجدول بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في نسخ الجدول', description: error.message, variant: 'destructive' });
    },
  });
}
