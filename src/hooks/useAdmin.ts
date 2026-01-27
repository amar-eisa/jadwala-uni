import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserWithDetails {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  role: 'admin' | 'user';
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
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');
      
      if (subsError) throw subsError;
      
      // Combine data
      const users: UserWithDetails[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const subscription = subscriptions?.find(s => s.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: (userRole?.role as 'admin' | 'user') || 'user',
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
    mutationFn: async ({ 
      subscriptionId, 
      updates 
    }: { 
      subscriptionId: string; 
      updates: {
        plan_name?: string;
        status?: string;
        price?: number;
        start_date?: string | null;
        end_date?: string | null;
      };
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: 'admin' | 'user';
    }) => {
      // First check if role exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existing) {
        // Update existing role
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      subscriptionId,
      startDate,
      endDate
    }: { 
      subscriptionId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'active',
          start_date: startDate || new Date().toISOString(),
          end_date: endDate || null,
        })
        .eq('id', subscriptionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete user data in order (to respect foreign keys)
      // 1. Delete schedule entries
      await supabase.from('schedule_entries').delete().eq('user_id', userId);
      // 2. Delete professor unavailability
      await supabase.from('professor_unavailability').delete().eq('user_id', userId);
      // 3. Delete subjects
      await supabase.from('subjects').delete().eq('user_id', userId);
      // 4. Delete professors
      await supabase.from('professors').delete().eq('user_id', userId);
      // 5. Delete student groups
      await supabase.from('student_groups').delete().eq('user_id', userId);
      // 6. Delete rooms
      await supabase.from('rooms').delete().eq('user_id', userId);
      // 7. Delete time slots
      await supabase.from('time_slots').delete().eq('user_id', userId);
      // 8. Delete subscription
      await supabase.from('subscriptions').delete().eq('user_id', userId);
      // 9. Delete user role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      // 10. Delete profile
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useDeleteUser() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Prevent self-deletion
      if (userId === currentUser?.id) {
        throw new Error('لا يمكنك حذف حسابك');
      }
      
      // Delete user data in order (to respect foreign keys)
      await supabase.from('schedule_entries').delete().eq('user_id', userId);
      await supabase.from('professor_unavailability').delete().eq('user_id', userId);
      await supabase.from('subjects').delete().eq('user_id', userId);
      await supabase.from('professors').delete().eq('user_id', userId);
      await supabase.from('student_groups').delete().eq('user_id', userId);
      await supabase.from('rooms').delete().eq('user_id', userId);
      await supabase.from('time_slots').delete().eq('user_id', userId);
      await supabase.from('subscriptions').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}
