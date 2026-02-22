import { useState } from 'react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { StudentTimetableView } from '@/components/student/StudentTimetableView';
import { useStudentProfile, useUpdateStudentProfile } from '@/hooks/useStudentProfile';
import { useStudentGroups, useStudentScheduleEntries, useStudentTimeSlots } from '@/hooks/useStudentSchedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Calendar, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function StudentDashboard() {
  const { data: profile, isLoading: profileLoading } = useStudentProfile();
  const { data: groups, isLoading: groupsLoading } = useStudentGroups();
  const updateProfile = useUpdateStudentProfile();
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const groupId = profile?.group_id || null;
  const { data: entries = [], isLoading: entriesLoading } = useStudentScheduleEntries(groupId);
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useStudentTimeSlots();

  const groupName = groups?.find(g => g.id === groupId)?.name;

  const handleSelectGroup = async () => {
    if (!selectedGroup) return;
    try {
      await updateProfile.mutateAsync({ group_id: selectedGroup });
      toast({ title: 'تم اختيار المجموعة بنجاح' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  if (profileLoading || groupsLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StudentLayout>
    );
  }

  // No group selected yet
  if (!groupId) {
    return (
      <StudentLayout>
        <div className="max-w-lg mx-auto mt-12">
          <Card className="card-glass border-0">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">اختر مجموعتك الدراسية</CardTitle>
              <CardDescription>اختر المجموعة لعرض الجدول الخاص بها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
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
              <Button
                onClick={handleSelectGroup}
                disabled={!selectedGroup || updateProfile.isPending}
                className="w-full rounded-2xl"
              >
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
                تأكيد الاختيار
              </Button>
            </CardContent>
          </Card>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">جدولي الدراسي</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              مجموعة: {groupName}
            </p>
          </div>
        </div>

        {/* Timetable */}
        {entriesLoading || timeSlotsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <StudentTimetableView
            entries={entries}
            timeSlots={timeSlots}
            groupName={groupName}
          />
        )}
      </div>
    </StudentLayout>
  );
}
