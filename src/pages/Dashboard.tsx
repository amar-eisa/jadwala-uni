import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useScheduleEntries } from '@/hooks/useSchedule';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { 
  DoorOpen, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles
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
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      description: 'قاعات ومعامل'
    },
    { 
      name: 'الدكاترة', 
      value: professors?.length || 0, 
      icon: GraduationCap, 
      href: '/professors',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      description: 'أعضاء هيئة التدريس'
    },
    { 
      name: 'المجموعات', 
      value: groups?.length || 0, 
      icon: Users, 
      href: '/groups',
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-500',
      description: 'مجموعات الطلاب'
    },
    { 
      name: 'المواد', 
      value: subjects?.length || 0, 
      icon: BookOpen, 
      href: '/subjects',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500',
      description: 'مواد دراسية'
    },
    { 
      name: 'الفترات الزمنية', 
      value: timeSlots?.length || 0, 
      icon: Clock, 
      href: '/time-slots',
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-500',
      description: 'فترات متاحة'
    },
  ];

  const hasSchedule = scheduleEntries && scheduleEntries.length > 0;
  const canGenerate = (rooms?.length || 0) > 0 && (subjects?.length || 0) > 0 && (timeSlots?.length || 0) > 0;
  
  // Calculate progress
  const totalSteps = 5;
  const completedSteps = [
    (rooms?.length || 0) > 0,
    (professors?.length || 0) > 0,
    (groups?.length || 0) > 0,
    (subjects?.length || 0) > 0,
    (timeSlots?.length || 0) > 0,
  ].filter(Boolean).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-info bg-clip-text text-transparent">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground mt-1">نظرة عامة على نظام جدولة المحاضرات</p>
          </div>
          <div className="hidden sm:block">
            <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/25">
              <Link to="/timetable">
                <Calendar className="h-4 w-4" />
                عرض الجدول
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <Link to={stat.href} key={stat.name}>
              <Card 
                className="stat-card group border-0 shadow-card hover:shadow-card-hover cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "p-3 rounded-xl",
                      stat.bgColor
                    )}>
                      <stat.icon className={cn("h-6 w-6", stat.iconColor)} />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg">
                      <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-3xl font-bold mt-1 animate-count-up">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Setup Progress & Schedule Status */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Setup Progress */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                تقدم إعداد النظام
              </CardTitle>
              <CardDescription>
                أكمل الخطوات التالية لتوليد الجدول
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>اكتمال الإعداد</span>
                  <span className="font-medium">{completedSteps}/{totalSteps}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              <div className="space-y-3">
                {[
                  { label: 'إضافة قاعات', done: (rooms?.length || 0) > 0, href: '/rooms' },
                  { label: 'إضافة دكاترة', done: (professors?.length || 0) > 0, href: '/professors' },
                  { label: 'إضافة مجموعات', done: (groups?.length || 0) > 0, href: '/groups' },
                  { label: 'إضافة مواد', done: (subjects?.length || 0) > 0, href: '/subjects' },
                  { label: 'تحديد الفترات الزمنية', done: (timeSlots?.length || 0) > 0, href: '/time-slots' },
                ].map((step) => (
                  <Link
                    key={step.label}
                    to={step.href}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      step.done 
                        ? "bg-success/10 text-success" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      step.done ? "text-success" : "text-foreground"
                    )}>
                      {step.label}
                    </span>
                    {!step.done && (
                      <ArrowLeft className="h-4 w-4 mr-auto text-muted-foreground" />
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Status */}
          <Card className={cn(
            "border-0 shadow-card overflow-hidden",
            hasSchedule && "ring-2 ring-success/20"
          )}>
            <div className={cn(
              "h-2",
              hasSchedule ? "bg-gradient-to-l from-success to-emerald-400" : "bg-gradient-to-l from-amber-400 to-orange-500"
            )} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                حالة الجدول
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={cn(
                "flex items-center gap-4 p-4 rounded-xl",
                hasSchedule ? "bg-success/10" : "bg-amber-50"
              )}>
                {hasSchedule ? (
                  <CheckCircle2 className="h-10 w-10 text-success" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-amber-500" />
                )}
                <div>
                  <p className="text-2xl font-bold">{scheduleEntries?.length || 0} محاضرة</p>
                  <p className={cn(
                    "text-sm",
                    hasSchedule ? "text-success" : "text-amber-600"
                  )}>
                    {hasSchedule ? 'تم توليد الجدول بنجاح' : 'لم يتم توليد الجدول بعد'}
                  </p>
                </div>
              </div>

              <Button 
                asChild 
                className="w-full gap-2" 
                size="lg"
                variant={hasSchedule ? "default" : "outline"}
              >
                <Link to="/timetable">
                  <Calendar className="h-4 w-4" />
                  {hasSchedule ? 'عرض الجدول الكامل' : 'توليد الجدول'}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              {!canGenerate && (
                <p className="text-xs text-center text-muted-foreground">
                  يجب إضافة قاعات ومواد وفترات زمنية قبل توليد الجدول
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>وصول سريع للمهام الشائعة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { icon: DoorOpen, label: 'إضافة قاعة', href: '/rooms', color: 'text-blue-500' },
                { icon: GraduationCap, label: 'إضافة دكتور', href: '/professors', color: 'text-emerald-500' },
                { icon: Users, label: 'إضافة مجموعة', href: '/groups', color: 'text-violet-500' },
                { icon: BookOpen, label: 'إضافة مادة', href: '/subjects', color: 'text-amber-500' },
                { icon: Clock, label: 'إضافة فترة', href: '/time-slots', color: 'text-rose-500' },
              ].map((action) => (
                <Button 
                  key={action.label}
                  asChild 
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 hover:shadow-md transition-shadow"
                >
                  <Link to={action.href}>
                    <action.icon className={cn("h-6 w-6", action.color)} />
                    <span className="text-xs">{action.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
