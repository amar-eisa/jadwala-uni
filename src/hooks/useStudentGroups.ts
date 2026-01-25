import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentGroup } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useStudentGroups() {
  return useQuery({
    queryKey: ['student_groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as StudentGroup[];
    },
  });
}

export function useCreateStudentGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: { name: string }) => {
      const { data, error } = await supabase
        .from('student_groups')
        .insert(group)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_groups'] });
      toast({ title: 'تم إضافة المجموعة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة المجموعة', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateStudentGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('student_groups')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_groups'] });
      toast({ title: 'تم تحديث المجموعة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث المجموعة', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteStudentGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_groups'] });
      toast({ title: 'تم حذف المجموعة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف المجموعة', description: error.message, variant: 'destructive' });
    },
  });
}
