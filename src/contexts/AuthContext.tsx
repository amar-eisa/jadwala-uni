import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { identifyUser, resetUser, trackLogin, trackSignup, trackLogout } from '@/lib/amplitude';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  needsPhone: boolean;
  setNeedsPhone: (v: boolean) => void;
  loginAttempts: number;
  lockoutUntil: number | null;
  lockoutRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setLoginAttempts(0);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  useEffect(() => {
    let mounted = true;

    // CRITICAL: Force loading=false after 3 seconds no matter what
    const forceTimeout = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn('Auth: Force timeout triggered after 3s');
        setInitialized(true);
        setLoading(false);
      }
    }, 3000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!mounted) return;
        console.log('Auth state change:', event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Sentry user identification
        if (currentSession?.user) {
          Sentry.setUser({ id: currentSession.user.id, email: currentSession.user.email });
          identifyUser(currentSession.user.id, {
            email: currentSession.user.email,
            full_name: currentSession.user.user_metadata?.full_name,
          });
        } else {
          Sentry.setUser(null);
          resetUser();
        }
        
        setInitialized(true);
        setLoading(false);

        // Check phone in a deferred way to avoid blocking
        if (currentSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            supabase
              .from('profiles')
              .select('phone')
              .eq('id', currentSession.user.id)
              .single()
              .then(({ data: profile }) => {
                if (mounted && profile && !(profile as any).phone) {
                  setNeedsPhone(true);
                }
              });
          }, 0);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('getSession error:', error);
      }
      // Only set if not already initialized by onAuthStateChange
      if (!initialized) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setInitialized(true);
        setLoading(false);
      }
    }).catch((err) => {
      if (!mounted) return;
      console.error('getSession catch:', err);
      setInitialized(true);
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(forceTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      return { error: new Error(`تم قفل تسجيل الدخول. حاول مرة أخرى بعد ${mins} دقائق`) };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
          return { error: new Error('تم تجاوز عدد المحاولات المسموحة. تم قفل تسجيل الدخول لمدة 5 دقائق') };
        }

        let message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        if (!error.message.includes('Invalid login credentials')) {
          message = 'حدث خطأ أثناء تسجيل الدخول';
        }
        return { error: new Error(`${message} (${MAX_ATTEMPTS - newAttempts} محاولات متبقية)`) };
      }
      // Success - reset attempts
      setLoginAttempts(0);
      setLockoutUntil(null);
      trackLogin();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [loginAttempts, lockoutUntil]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) {
        let message = 'حدث خطأ أثناء إنشاء الحساب';
        if (error.message.includes('User already registered')) {
          message = 'هذا البريد الإلكتروني مسجل مسبقاً';
        }
        return { error: new Error(message) };
      }

      supabase.functions.invoke('notify-new-user', {
        body: { email, fullName, phone }
      }).catch((err) => {
        console.error('Failed to send WhatsApp notification:', err);
      });

      trackSignup();
      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: 'حسابك في انتظار موافقة المدير',
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    trackLogout();
    await supabase.auth.signOut();
    Sentry.setUser(null);
    resetUser();
    setNeedsPhone(false);
    toast({
      title: 'تم تسجيل الخروج',
      description: 'نراك قريباً!',
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, needsPhone, setNeedsPhone, loginAttempts, lockoutUntil, lockoutRemaining }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
