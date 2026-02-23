import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import jadwalaLogo from '@/assets/jadwala-logo.png';
import connectLogo from '@/assets/connect-logo.png';
import { FloatingInput } from '@/components/ui/floating-input';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
});

const welcomeMessages = [
  'مرحباً بك في جدولة ✨',
  'نظام جدولة المحاضرات الذكي',
  'ابدأ بتنظيم جداولك بسهولة',
];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // Rotate welcome messages
  useEffect(() => {
    const interval = setInterval(() => {
      setWelcomeIndex((prev) => (prev + 1) % welcomeMessages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) {
      setError(error.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = signupSchema.safeParse({ 
      email: signupEmail, password: signupPassword, fullName: signupFullName 
    });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir="rtl">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-bg" />
      {/* Animated geometric pattern */}
      <div className="absolute inset-0 geo-pattern opacity-30 animate-geo-drift" />
      {/* Brand strip */}
      <div className="brand-strip w-full absolute top-0 z-10" />
      
      <div className="relative flex-1 flex items-center justify-center p-4 z-10">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo with glow */}
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl scale-150 animate-pulse" />
              <img src={jadwalaLogo} alt="جدولة" className="h-20 w-auto mb-4 relative z-10" />
            </motion.div>
            <h1 className="text-2xl font-bold gradient-text">جدولة</h1>
            
            {/* Animated welcome message */}
            <div className="h-7 mt-2 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={welcomeIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="text-muted-foreground text-sm text-center"
                >
                  {welcomeMessages[welcomeIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-3 mb-6 px-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <Card className="border-0 shadow-2xl card-glass">
            <CardHeader className="text-center pb-2">
              <CardTitle>مرحباً بك</CardTitle>
              <CardDescription>سجل دخولك أو أنشئ حساباً جديداً</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full" onValueChange={() => setError(null)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <FloatingInput
                      id="login-email"
                      type="email"
                      label="البريد الإلكتروني"
                      icon={<Mail className="h-4 w-4" />}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    <FloatingInput
                      id="login-password"
                      type="password"
                      label="كلمة المرور"
                      icon={<Lock className="h-4 w-4" />}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    
                    <AnimatePresence>
                      {error && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-lg"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    
                    <Button type="submit" className="w-full rounded-2xl h-12 text-base shimmer-button" disabled={isLoading}>
                      {isLoading ? (
                        <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري تسجيل الدخول...</>
                      ) : (
                        'تسجيل الدخول'
                      )}
                    </Button>

                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">أو</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl h-12 text-base gap-2"
                      disabled={isLoading}
                      onClick={async () => {
                        const { error } = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) setError(error.message);
                      }}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      تسجيل الدخول بـ Google
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <FloatingInput
                      id="signup-name"
                      type="text"
                      label="الاسم الكامل"
                      icon={<User className="h-4 w-4" />}
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      disabled={isLoading}
                    />
                    <FloatingInput
                      id="signup-email"
                      type="email"
                      label="البريد الإلكتروني"
                      icon={<Mail className="h-4 w-4" />}
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    <FloatingInput
                      id="signup-password"
                      type="password"
                      label="كلمة المرور"
                      icon={<Lock className="h-4 w-4" />}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    
                    <AnimatePresence>
                      {error && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-lg"
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    
                    <Button type="submit" className="w-full rounded-2xl h-12 text-base shimmer-button" disabled={isLoading}>
                      {isLoading ? (
                        <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري إنشاء الحساب...</>
                      ) : (
                        'إنشاء حساب'
                      )}
                    </Button>

                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">أو</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl h-12 text-base gap-2"
                      disabled={isLoading}
                      onClick={async () => {
                        const { error } = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) setError(error.message);
                      }}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      التسجيل بـ Google
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 py-6 text-center footer-pattern">
        <div className="flex flex-col items-center gap-2">
          <img src={connectLogo} alt="Connect" className="h-8 w-auto opacity-70" />
          <p className="text-xs text-muted-foreground">
            جميع الحقوق محفوظة لـ Connect © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>jadwala@connectsys.cloud</span>
            <span dir="ltr">+249128150105</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
