import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Room, RoomType } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Room[];
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (room: { name: string; type: RoomType }) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert(room)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'تم إضافة القاعة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة القاعة', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; type?: RoomType }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'تم تحديث القاعة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تحديث القاعة', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'تم حذف القاعة بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف القاعة', description: error.message, variant: 'destructive' });
    },
  });
}
