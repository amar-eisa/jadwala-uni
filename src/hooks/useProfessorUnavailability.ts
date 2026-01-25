import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DayOfWeek } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export interface ProfessorUnavailability {
  id: string;
  professor_id: string;
  day: DayOfWeek;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  created_at: string;
}

export function useProfessorUnavailability(professorId: string | null) {
  return useQuery({
    queryKey: ['professor_unavailability', professorId],
    queryFn: async () => {
      if (!professorId) return [];
      
      const { data, error } = await supabase
        .from('professor_unavailability')
        .select('*')
        .eq('professor_id', professorId)
        .order('day');
      
      if (error) throw error;
      return data as ProfessorUnavailability[];
    },
    enabled: !!professorId,
  });
}

export function useAddProfessorUnavailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unavailability: {
      professor_id: string;
      day: DayOfWeek;
      start_time?: string | null;
      end_time?: string | null;
      all_day?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('professor_unavailability')
        .insert({
          professor_id: unavailability.professor_id,
          day: unavailability.day,
          start_time: unavailability.all_day ? null : unavailability.start_time,
          end_time: unavailability.all_day ? null : unavailability.end_time,
          all_day: unavailability.all_day ?? false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['professor_unavailability', variables.professor_id] });
      toast({ title: 'تم إضافة وقت عدم التوفر بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة وقت عدم التوفر', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProfessorUnavailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, professorId }: { id: string; professorId: string }) => {
      const { error } = await supabase
        .from('professor_unavailability')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return professorId;
    },
    onSuccess: (professorId) => {
      queryClient.invalidateQueries({ queryKey: ['professor_unavailability', professorId] });
      toast({ title: 'تم حذف وقت عدم التوفر بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف وقت عدم التوفر', description: error.message, variant: 'destructive' });
    },
  });
}
