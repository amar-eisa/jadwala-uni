import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStudentGroups() {
  return useQuery({
    queryKey: ['student-available-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

export function useStudentScheduleEntries(groupId: string | null) {
  return useQuery({
    queryKey: ['student-schedule', groupId],
    queryFn: async () => {
      // Find active schedule
      const { data: schedules, error: schedError } = await supabase
        .from('saved_schedules')
        .select('id')
        .eq('is_active', true);

      if (schedError) throw schedError;
      if (!schedules || schedules.length === 0) return [];

      const scheduleIds = schedules.map(s => s.id);

      // Get entries for this group from active schedules
      let query = supabase
        .from('schedule_entries')
        .select(`
          *,
          room:rooms(*),
          time_slot:time_slots(*),
          subject:subjects(*, professor:professors(*), group:student_groups(*))
        `)
        .in('schedule_id', scheduleIds);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!groupId,
  });
}

export function useStudentTimeSlots() {
  return useQuery({
    queryKey: ['student-time-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('day')
        .order('start_time');

      if (error) throw error;
      return data;
    },
  });
}
