import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subject, SubjectType } from '@/types/database';
import { toast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLog';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          professor:professors(*),
          group:student_groups(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Subject[];
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subject: { name: string; professor_id: string; group_id: string; type: SubjectType; weekly_hours: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { data, error } = await supabase
        .from('subjects')
        .insert([{ 
          name: subject.name,
          professor_id: subject.professor_id,
          group_id: subject.group_id,
          type: subject.type,
          weekly_hours: subject.weekly_hours,
          user_id: user.id
        }] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'تم إضافة المادة بنجاح' });
      logActivity('created', 'subject', data.id, { name: data.name });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة المادة', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; professor_id?: string; group_id?: string; type?: SubjectType; weekly_hours?: number }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'تم تحديث المادة بنجاح' });
      logActivity('updated', 'subject', data.id, { name: data.name });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث المادة', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast({ title: 'تم حذف المادة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف المادة', description: error.message, variant: 'destructive' });
    },
  });
}
