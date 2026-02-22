import { useState, useEffect } from 'react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { useStudentProfile, useUpdateStudentProfile } from '@/hooks/useStudentProfile';
import { useStudentGroups } from '@/hooks/useStudentSchedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, User, Hash, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function StudentProfilePage() {
  const { data: profile, isLoading } = useStudentProfile();
  const { data: groups } = useStudentGroups();
  const updateProfile = useUpdateStudentProfile();

  const [fullName, setFullName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [groupId, setGroupId] = useState<string>('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setStudentIdNumber(profile.student_id_number);
      setGroupId(profile.group_id || '');
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        student_id_number: studentIdNumber,
        group_id: groupId || null,
      });
      toast({ title: 'تم حفظ التغييرات بنجاح' });
    } catch {
      toast({ title: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold gradient-text mb-6">الملف الشخصي</h1>

        <Card className="card-glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              بياناتي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={profile?.email || ''} disabled className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pr-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-id">رقم القيد الجامعي</Label>
              <div className="relative">
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="student-id" value={studentIdNumber} onChange={(e) => setStudentIdNumber(e.target.value)} className="pr-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>المجموعة الدراسية</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full rounded-2xl">
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
