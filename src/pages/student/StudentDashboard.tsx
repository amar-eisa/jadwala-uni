import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Calendar, CheckCircle } from 'lucide-react';
import { StudentTimetableView } from '@/components/student/StudentTimetableView';
import { useStudentGroups, useStudentScheduleEntries, useStudentTimeSlots } from '@/hooks/useStudentSchedule';
import jadwalaLogo from '@/assets/jadwala-logo.png';

export default function StudentDashboard() {
  const { data: groups, isLoading: groupsLoading } = useStudentGroups();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: entries = [], isLoading: entriesLoading } = useStudentScheduleEntries(selectedGroup);
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useStudentTimeSlots();

  const groupName = groups?.find(g => g.id === selectedGroup)?.name;

  if (groupsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            <img src={jadwalaLogo} alt="جدولة" className="h-9 w-auto" />
            <h1 className="text-lg font-bold text-foreground">جدولة</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              بوابة الطلاب
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedGroup ? (
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
                <Select onValueChange={(v) => setSelectedGroup(v)}>
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
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold gradient-text">الجدول الدراسي</h2>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  مجموعة: {groupName}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                تغيير المجموعة
              </Button>
            </div>

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
        )}
      </main>
    </div>
  );
}
