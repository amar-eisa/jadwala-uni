import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Users, Calendar, CheckCircle, Bell, Check } from 'lucide-react';
import { StudentTimetableView } from '@/components/student/StudentTimetableView';
import { useStudentGroups, useStudentScheduleEntries, useStudentTimeSlots } from '@/hooks/useStudentSchedule';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import jadwalaLogo from '@/assets/jadwala-logo.png';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function StudentDashboard() {
  const { data: groups, isLoading: groupsLoading } = useStudentGroups();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data: entries = [], isLoading: entriesLoading } = useStudentScheduleEntries(selectedGroup);
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useStudentTimeSlots();
  const { data: notifications = [] } = useNotifications(selectedGroup);
  const { data: unreadCount = 0 } = useUnreadCount(selectedGroup);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

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
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={jadwalaLogo} alt="جدولة" className="h-9 w-auto" />
              <h1 className="text-lg font-bold text-foreground">جدولة</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                بوابة الطلاب
              </span>
            </div>

            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-[10px] bg-destructive text-destructive-foreground">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 bg-background border shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h4 className="font-semibold text-sm">الإشعارات</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllAsRead.mutate(selectedGroup)}>
                      <Check className="h-3 w-3 ml-1" />
                      قراءة الكل
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">لا توجد إشعارات</p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "px-4 py-3 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors",
                          !n.is_read && "bg-primary/5"
                        )}
                        onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(n.created_at), 'd MMMM yyyy - HH:mm', { locale: ar })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
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