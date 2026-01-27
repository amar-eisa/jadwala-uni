import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut, Mail } from 'lucide-react';

export default function PendingApprovalPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4" dir="rtl">
      <Card className="max-w-md w-full border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">في انتظار الموافقة</CardTitle>
          <CardDescription className="text-base mt-2">
            حسابك قيد المراجعة من قبل المدير
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              تم إنشاء حسابك بنجاح ولكنه يحتاج إلى موافقة المدير قبل أن تتمكن من استخدام النظام.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              سيتم إخطارك عند اعتماد حسابك.
            </p>
          </div>

          {user?.email && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            للاستفسار، يرجى التواصل مع إدارة النظام
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
