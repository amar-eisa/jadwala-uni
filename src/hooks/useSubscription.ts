import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  price: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useUserSubscription() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user_subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
      return data as Subscription | null;
    },
    enabled: !!user,
  });
}

export function useIsActiveSubscription() {
  const { data: subscription, isLoading } = useUserSubscription();
  
  return {
    isActive: subscription?.status === 'active',
    isLoading,
    subscription
  };
}

export function useIsPendingApproval() {
  const { data: subscription, isLoading } = useUserSubscription();
  
  return {
    isPending: subscription?.status === 'pending',
    isLoading,
    subscription
  };
}
