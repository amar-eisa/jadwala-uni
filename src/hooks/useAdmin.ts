import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserWithDetails {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  role: 'admin' | 'user' | 'editor' | 'viewer';
  subscription: {
    id: string;
    plan_name: string;
    status: string;
    price: number;
    currency: string;
    start_date: string | null;
    end_date: string | null;
  } | null;
}

export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      if (rolesError) throw rolesError;

      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');
      if (subsError) throw subsError;

      const users: UserWithDetails[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const subscription = subscriptions?.find(s => s.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone ?? null,
          created_at: profile.created_at,
          role: (userRole?.role as 'admin' | 'user' | 'editor' | 'viewer') || 'user',
          subscription: subscription ? {
            id: subscription.id,
            plan_name: subscription.plan_name,
            status: subscription.status,
            price: Number(subscription.price),
            currency: subscription.currency,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
          } : null,
        };
      });
      return users;
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, updates }: { 
      subscriptionId: string; 
      updates: { plan_name?: string; status?: string; price?: number; start_date?: string | null; end_date?: string | null; };
    }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' | 'editor' | 'viewer'; }) => {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('user_roles').insert({ user_id: userId, role }).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ subscriptionId, startDate, endDate }: { subscriptionId: string; startDate?: string; endDate?: string; }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ status: 'active', start_date: startDate || new Date().toISOString(), end_date: endDate || null })
        .eq('id', subscriptionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });
}

async function invokeDeleteUser(userId: string) {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { user_id: userId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      return invokeDeleteUser(userId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });
}

export function useDeleteUser() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (userId === currentUser?.id) {
        throw new Error('لا يمكنك حذف حسابك');
      }
      return invokeDeleteUser(userId);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); },
  });
}
