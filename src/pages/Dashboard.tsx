import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useScheduleEntries } from '@/hooks/useSchedule';
import { 
  DoorOpen, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock,
  Calendar,
  ArrowLeft
} from 'lucide-react';

export default function Dashboard() {
  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const { data: timeSlots } = useTimeSlots();
  const { data: scheduleEntries } = useScheduleEntries();

  const stats = [
    { 
      name: 'القاعات', 
      value: rooms?.length || 0, 
      icon: DoorOpen, 
      href: '/rooms',
      color: 'text-blue-500'
    },
    { 
      name: 'الدكاترة', 
      value: professors?.length || 0, 
      icon: GraduationCap, 
      href: '/professors',
      color: 'text-green-500'
    },
    { 
      name: 'المجموعات', 
      value: groups?.length || 0, 
      icon: Users, 
      href: '/groups',
      color: 'text-purple-500'
    },
    { 
      name: 'المواد', 
      value: subjects?.length || 0, 
      icon: BookOpen, 
      href: '/subjects',
      color: 'text-orange-500'
    },
    { 
      name: 'الفترات الزمنية', 
      value: timeSlots?.length || 0, 
      icon: Clock, 
      href: '/time-slots',
      color: 'text-pink-500'
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على نظام جدولة الجامعة</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <Link 
                  to={stat.href}
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                >
                  إدارة
                  <ArrowLeft className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schedule Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              حالة الجدول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{scheduleEntries?.length || 0} محاضرة</p>
                <p className="text-sm text-muted-foreground">
                  {scheduleEntries?.length ? 'تم توليد الجدول' : 'لم يتم توليد الجدول بعد'}
                </p>
              </div>
              <Button asChild>
                <Link to="/timetable">
                  عرض الجدول
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/rooms">
                  <DoorOpen className="h-4 w-4 ml-2" />
                  إضافة قاعة
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/professors">
                  <GraduationCap className="h-4 w-4 ml-2" />
                  إضافة دكتور
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/groups">
                  <Users className="h-4 w-4 ml-2" />
                  إضافة مجموعة
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/subjects">
                  <BookOpen className="h-4 w-4 ml-2" />
                  إضافة مادة
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/time-slots">
                  <Clock className="h-4 w-4 ml-2" />
                  إضافة فترة زمنية
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
