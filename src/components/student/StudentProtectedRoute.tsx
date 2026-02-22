import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const { data: isStudent, isLoading: roleLoading } = useQuery({
    queryKey: ['is-student', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'student')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/student/auth" replace />;
  }

  if (!isStudent) {
    return <Navigate to="/student/auth" replace />;
  }

  return <>{children}</>;
}
