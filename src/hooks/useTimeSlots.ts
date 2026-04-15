import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TimeSlot, DayOfWeek } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useTimeSlots() {
  return useQuery({
    queryKey: ['time_slots'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('day')
        .order('start_time');
      
      if (error) throw error;
      return data as TimeSlot[];
    },
  });
}

export function useCreateTimeSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slot: { day: DayOfWeek; start_time: string; end_time: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      const { data, error } = await supabase
        .from('time_slots')
        .insert({ ...slot, user_id: user.id } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_slots'] });
      toast({ title: 'تم إضافة الفترة الزمنية بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة الفترة الزمنية', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTimeSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; day?: DayOfWeek; start_time?: string; end_time?: string }) => {
      const { data, error } = await supabase
        .from('time_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_slots'] });
      toast({ title: 'تم تحديث الفترة الزمنية بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث الفترة الزمنية', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { start_time: string; end_time: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // حذف جميع الفترات الزمنية بنفس الأوقات للمستخدم الحالي
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('user_id', user.id)
        .eq('start_time', params.start_time)
        .eq('end_time', params.end_time);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_slots'] });
      toast({ title: 'تم حذف الفترة الزمنية بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف الفترة الزمنية', description: error.message, variant: 'destructive' });
    },
  });
}
