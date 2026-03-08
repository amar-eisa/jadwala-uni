import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Professor } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLog';

export function useProfessors() {
  return useQuery({
    queryKey: ['professors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Professor[];
    },
  });
}

export function useCreateProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (professor: { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { data, error } = await supabase
        .from('professors')
        .insert({ ...professor, user_id: user.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      toast({ title: 'تم إضافة الدكتور بنجاح' });
      logActivity('created', 'professor', data.id, { name: data.name });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة الدكتور', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('professors')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      toast({ title: 'تم تحديث الدكتور بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث الدكتور', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProfessor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professors'] });
      toast({ title: 'تم حذف الدكتور بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف الدكتور', description: error.message, variant: 'destructive' });
    },
  });
}
