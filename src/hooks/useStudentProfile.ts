import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_id_number: string;
  group_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useStudentProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data as StudentProfile;
    },
    enabled: !!user,
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: { full_name?: string; student_id_number?: string; group_id?: string | null }) => {
      const { data, error } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
  });
}
