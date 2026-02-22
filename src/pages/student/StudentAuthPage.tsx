import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, Hash, GraduationCap } from 'lucide-react';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import jadwalaLogo from '@/assets/jadwala-logo.png';
import connectLogo from '@/assets/connect-logo.png';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const signupSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  studentIdNumber: z.string().min(1, 'رقم القيد مطلوب'),
});

export default function StudentAuthPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');

  // Check if logged-in user is a student
  useEffect(() => {
    if (!user) return;
    const checkRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'student')
        .maybeSingle();
      if (data) {
        navigate('/student', { replace: true });
      }
    };
    checkRole();
  }, [user, navigate]);

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
      email: signupEmail,
      password: signupPassword,
      fullName: signupFullName,
      studentIdNumber,
    });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/student`,
          data: {
            full_name: signupFullName,
            student_id_number: studentIdNumber,
          },
        },
      });

      if (signUpError) {
        let message = 'حدث خطأ أثناء إنشاء الحساب';
        if (signUpError.message.includes('User already registered')) {
          message = 'هذا البريد الإلكتروني مسجل مسبقاً';
        }
        setError(message);
        setIsLoading(false);
        return;
      }

      // Assign student role
      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'student' as any })
          .eq('user_id', data.user.id);

        if (roleError) {
          console.error('Failed to update role:', roleError);
        }
      }

      toast({
        title: 'تم إنشاء الحساب بنجاح',
        description: 'يمكنك الآن تسجيل الدخول',
      });
    } catch (err) {
      setError('حدث خطأ غير متوقع');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-background" dir="rtl">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src={jadwalaLogo} alt="جدولة" className="h-20 w-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">بوابة الطلاب</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              سجل واطلع على جدولك الدراسي
            </p>
          </div>

          <Card className="card-glass border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle>مرحباً بك</CardTitle>
              <CardDescription>سجل دخولك أو أنشئ حساب طالب جديد</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full" onValueChange={() => setError(null)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="example@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pr-10" disabled={isLoading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pr-10" disabled={isLoading} />
                      </div>
                    </div>
                    {error && <p className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-lg">{error}</p>}
                    <Button type="submit" className="w-full rounded-2xl" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري تسجيل الدخول...</> : 'تسجيل الدخول'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-name" type="text" placeholder="أحمد محمد" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} className="pr-10" disabled={isLoading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student-id">رقم القيد الجامعي</Label>
                      <div className="relative">
                        <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="student-id" type="text" placeholder="123456" value={studentIdNumber} onChange={(e) => setStudentIdNumber(e.target.value)} className="pr-10" disabled={isLoading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-email" type="email" placeholder="example@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pr-10" disabled={isLoading} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pr-10" disabled={isLoading} />
                      </div>
                    </div>
                    {error && <p className="text-sm text-destructive text-center bg-destructive/10 py-2 px-3 rounded-lg">{error}</p>}
                    <Button type="submit" className="w-full rounded-2xl" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري إنشاء الحساب...</> : 'إنشاء حساب طالب'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="py-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <img src={connectLogo} alt="Connect" className="h-8 w-auto opacity-70" />
          <p className="text-xs text-muted-foreground">جميع الحقوق محفوظة لـ Connect</p>
        </div>
      </footer>
    </div>
  );
}
