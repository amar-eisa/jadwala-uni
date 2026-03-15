import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, Calendar, ShieldCheck, BarChart3, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import jadwalaLogo from '@/assets/jadwala-logo.png';
import connectLogo from '@/assets/connect-logo.png';
import { FloatingInput } from '@/components/ui/floating-input';
import { PhoneInput } from '@/components/ui/phone-input';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().min(8, 'رقم الهاتف غير صالح'),
});

const welcomeMessages = [
  'مرحباً بك في جدولة ✨',
  'نظام جدولة المحاضرات الذكي',
  'ابدأ بتنظيم جداولك بسهولة',
];

const features = [
  { icon: Calendar, title: 'جدولة تلقائية', desc: 'إنشاء جداول محاضرات بضغطة واحدة' },
  { icon: ShieldCheck, title: 'تجنب التعارضات', desc: 'كشف التعارضات تلقائياً ومنعها' },
  { icon: BarChart3, title: 'تقارير شاملة', desc: 'إحصائيات وتقارير مفصلة' },
  { icon: Sparkles, title: 'سهولة الاستخدام', desc: 'واجهة بسيطة وسلسة' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, signUp, lockoutRemaining } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLockedOut = lockoutRemaining > 0;
  const lockoutMinutes = Math.ceil(lockoutRemaining / 60000);
  const lockoutSeconds = Math.ceil((lockoutRemaining % 60000) / 1000);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('+249');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

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
    if (!validation.success) { setError(validation.error.errors[0].message); return; }
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) setError(error.message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validation = signupSchema.safeParse({ email: signupEmail, password: signupPassword, fullName: signupFullName, phone: signupPhone });
    if (!validation.success) { setError(validation.error.errors[0].message); return; }
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName, signupPhone);
    setIsLoading(false);
    if (error) setError(error.message);
  };

  const GoogleButton = ({ label }: { label: string }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-2xl h-12 text-base gap-2"
      disabled={isLoading}
      onClick={async () => {
        const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (error) setError(error.message);
      }}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
      {label}
    </Button>
  );

  const ErrorMessage = () => (
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-lg"
        >{error}</motion.p>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" dir="rtl">
      {/* Mobile: Blue header strip */}
      <div className="lg:hidden bg-gradient-to-l from-primary to-[hsl(222,47%,18%)] p-6 flex items-center gap-4">
        <img src={jadwalaLogo} alt="جدولة" className="h-12 w-auto" />
        <div>
          <h1 className="text-lg font-bold text-primary-foreground">جدولة</h1>
          <p className="text-xs text-primary-foreground/70">نظام جدولة المحاضرات الذكي</p>
        </div>
      </div>

      {/* Left side: Form */}
      <div className="flex-1 lg:w-[55%] flex flex-col justify-between min-h-0">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">أهلاً بعودتك 👋</h2>
              <p className="text-muted-foreground mt-1">سجّل دخولك للمتابعة</p>
            </div>

            <Tabs defaultValue="login" className="w-full" onValueChange={() => setError(null)}>
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-2xl bg-muted/60 p-1">
                <TabsTrigger value="login" className="rounded-xl h-full text-sm font-medium data-[state=active]:bg-gradient-to-l data-[state=active]:from-primary data-[state=active]:to-[hsl(210,70%,40%)] data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl h-full text-sm font-medium data-[state=active]:bg-gradient-to-l data-[state=active]:from-primary data-[state=active]:to-[hsl(210,70%,40%)] data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">إنشاء حساب</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <FloatingInput id="login-email" type="email" label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isLoading} />
                  <FloatingInput id="login-password" type="password" label="كلمة المرور" icon={<Lock className="h-4 w-4" />} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isLoading} />
                  <ErrorMessage />
                  {isLockedOut && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-sm text-destructive text-center bg-destructive/10 py-3 px-3 rounded-lg">
                      🔒 تم قفل تسجيل الدخول لمدة {lockoutMinutes > 0 ? `${lockoutMinutes}:${String(lockoutSeconds).padStart(2, '0')}` : `${lockoutSeconds} ثانية`}
                    </motion.div>
                  )}
                  <Button type="submit" className="w-full rounded-2xl h-12 text-base shimmer-button" disabled={isLoading || isLockedOut}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري تسجيل الدخول...</> : isLockedOut ? '🔒 تسجيل الدخول مقفل' : 'تسجيل الدخول'}
                  </Button>
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">أو</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <GoogleButton label="تسجيل الدخول بـ Google" />
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-5">
                  <FloatingInput id="signup-name" type="text" label="الاسم الكامل" icon={<User className="h-4 w-4" />} value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} disabled={isLoading} />
                  <FloatingInput id="signup-email" type="email" label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} disabled={isLoading} />
                  <FloatingInput id="signup-password" type="password" label="كلمة المرور" icon={<Lock className="h-4 w-4" />} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} disabled={isLoading} />
                  <PhoneInput id="signup-phone" value={signupPhone} onChange={setSignupPhone} disabled={isLoading} />
                  <ErrorMessage />
                  <Button type="submit" className="w-full rounded-2xl h-12 text-base shimmer-button" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري إنشاء الحساب...</> : 'إنشاء حساب'}
                  </Button>
                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">أو</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <GoogleButton label="التسجيل بـ Google" />
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Footer inside form panel */}
        <footer className="p-4 text-center border-t border-border">
          <div className="flex flex-col items-center gap-1.5">
            <img src={connectLogo} alt="Connect" className="h-7 w-auto opacity-60" />
            <p className="text-xs text-muted-foreground">جميع الحقوق محفوظة لـ Connect © {new Date().getFullYear()}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>jadwala@connectsys.cloud</span>
              <span dir="ltr">+249128150105</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Right side: Branded panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-bl from-primary via-[hsl(210,70%,40%)] to-[hsl(222,47%,15%)] text-primary-foreground flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-5rem] left-[-5rem] w-60 h-60 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/[0.03] blur-xl" />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-sm"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Logo */}
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl scale-150 animate-pulse" />
            <img src={jadwalaLogo} alt="جدولة" className="h-24 w-auto relative z-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">جدولة</h1>
          <p className="text-primary-foreground/70 text-sm mb-4">نظام جدولة المحاضرات الذكي</p>

          {/* Animated welcome text */}
          <div className="h-8 mb-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={welcomeIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="text-lg font-medium text-primary-foreground/90"
              >
                {welcomeMessages[welcomeIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <h2 className="text-xl font-semibold leading-relaxed mb-6">
            إدارة جداولك<br />بذكاء واحترافية
          </h2>

          {/* Feature badges */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-right"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{f.title}</p>
                  <p className="text-[10px] text-primary-foreground/60 leading-tight mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
