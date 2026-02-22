import { useMemo } from 'react';
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
import { useSavedSchedules } from '@/hooks/useSavedSchedules';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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

const MotionCard = motion.create(Card);

export default function Dashboard() {
  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const { data: timeSlots } = useTimeSlots();
  const { data: savedSchedules } = useSavedSchedules();

  const activeScheduleId = useMemo(() => {
    if (!savedSchedules) return null;
    const activeSchedule = savedSchedules.find(s => s.is_active);
    return activeSchedule?.id || null;
  }, [savedSchedules]);

  const { data: scheduleEntries } = useScheduleEntries(activeScheduleId);

  const stats = [
    { 
      name: 'القاعات', 
      value: rooms?.length || 0, 
      icon: DoorOpen, 
      href: '/rooms',
      gradient: 'from-[hsl(197,80%,55%)] to-[hsl(197,80%,42%)]',
      bgGlow: 'hsl(197 80% 55% / 0.12)',
      description: 'قاعات ومعامل'
    },
    { 
      name: 'الدكاترة', 
      value: professors?.length || 0, 
      icon: GraduationCap, 
      href: '/professors',
      gradient: 'from-[hsl(160,72%,38%)] to-[hsl(160,72%,28%)]',
      bgGlow: 'hsl(160 72% 38% / 0.12)',
      description: 'أعضاء هيئة التدريس'
    },
    { 
      name: 'المجموعات', 
      value: groups?.length || 0, 
      icon: Users, 
      href: '/groups',
      gradient: 'from-[hsl(262,60%,55%)] to-[hsl(262,60%,42%)]',
      bgGlow: 'hsl(262 60% 55% / 0.12)',
      description: 'مجموعات الطلاب'
    },
    { 
      name: 'المواد', 
      value: subjects?.length || 0, 
      icon: BookOpen, 
      href: '/subjects',
      gradient: 'from-[hsl(36,90%,50%)] to-[hsl(36,90%,40%)]',
      bgGlow: 'hsl(36 90% 50% / 0.12)',
      description: 'مواد دراسية'
    },
    { 
      name: 'الفترات الزمنية', 
      value: timeSlots?.length || 0, 
      icon: Clock, 
      href: '/time-slots',
      gradient: 'from-[hsl(340,70%,50%)] to-[hsl(340,70%,40%)]',
      bgGlow: 'hsl(340 70% 50% / 0.12)',
      description: 'فترات متاحة'
    },
  ];

  const hasSchedule = scheduleEntries && scheduleEntries.length > 0;
  const canGenerate = (rooms?.length || 0) > 0 && (subjects?.length || 0) > 0 && (timeSlots?.length || 0) > 0;
  
  const setupSteps = [
    { label: 'إضافة قاعات', done: (rooms?.length || 0) > 0, href: '/rooms' },
    { label: 'إضافة دكاترة', done: (professors?.length || 0) > 0, href: '/professors' },
    { label: 'إضافة مجموعات', done: (groups?.length || 0) > 0, href: '/groups' },
    { label: 'إضافة مواد', done: (subjects?.length || 0) > 0, href: '/subjects' },
    { label: 'تحديد الفترات الزمنية', done: (timeSlots?.length || 0) > 0, href: '/time-slots' },
  ];

  const completedSteps = setupSteps.filter(s => s.done).length;
  const totalSteps = setupSteps.length;
  const isSetupComplete = completedSteps === totalSteps;

  const uniqueDays = [...new Set(timeSlots?.map(ts => ts.day) || [])];
  const totalDays = uniqueDays.length;
  const totalLectures = scheduleEntries?.length || 0;
  const avgLecturesPerDay = totalDays > 0 ? (totalLectures / totalDays).toFixed(1) : '0';
  const totalSlots = (rooms?.length || 1) * (timeSlots?.length || 1);
  const utilizationRate = totalSlots > 0 ? Math.round((totalLectures / totalSlots) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground mt-2">نظرة عامة على نظام جدولة المحاضرات</p>
          </div>
          <div className="hidden sm:block">
            <Button asChild size="lg" className="gap-2 rounded-2xl shadow-lg shadow-primary/25">
              <Link to="/timetable">
                <Calendar className="h-4 w-4" />
                عرض الجدول
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <Link to={stat.href} key={stat.name}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="card-soft group cursor-pointer border-0 overflow-hidden"
              >
                <CardContent className="p-6 relative">
                  {/* Ambient glow on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${stat.bgGlow}, transparent 70%)` }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={cn("p-3 rounded-2xl bg-gradient-to-br text-white shadow-lg", stat.gradient)}
                      >
                        <stat.icon className="h-5 w-5" />
                      </motion.div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                      <motion.p
                        key={stat.value}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-bold mt-1"
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-xs text-muted-foreground mt-1.5">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
            </Link>
          ))}
        </div>

        {/* Setup Progress / System Statistics & Schedule Status */}
        <div className="grid gap-8 lg:grid-cols-2">
          {isSetupComplete ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="card-soft border-0 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-l from-success to-[hsl(160,72%,50%)]" />
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-success" />
                    إحصائيات النظام
                  </CardTitle>
                  <CardDescription>نظرة سريعة على بيانات الجدولة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: totalLectures, label: 'محاضرة', color: 'from-primary/15 to-primary/5' },
                      { value: totalDays, label: 'أيام عمل', color: 'from-info/15 to-info/5' },
                      { value: avgLecturesPerDay, label: 'محاضرة/يوم', color: 'from-[hsl(262,60%,55%)/0.15] to-[hsl(262,60%,55%)/0.05]' },
                      { value: `${utilizationRate}%`, label: 'نسبة الاستخدام', color: 'from-warning/15 to-warning/5' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn("bg-gradient-to-br rounded-2xl p-5 text-center", item.color)}
                      >
                        <p className="text-3xl font-bold">{item.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-success/10">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-medium text-success">النظام جاهز ومكتمل</p>
                      <p className="text-sm text-muted-foreground">جميع البيانات الأساسية متوفرة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Vertical Timeline Stepper */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="card-soft border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    تقدم إعداد النظام
                  </CardTitle>
                  <CardDescription>
                    {completedSteps}/{totalSteps} — أكمل الخطوات لتوليد الجدول
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Progress bar */}
                  <div className="mb-8 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-primary to-[hsl(197,80%,42%)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Vertical timeline */}
                  <div className="relative pr-8">
                    {/* Vertical line */}
                    <div className="absolute right-3 top-0 bottom-0 w-0.5 bg-border" />

                    <div className="space-y-1">
                      {setupSteps.map((step, i) => (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <Link
                            to={step.href}
                            className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 hover:bg-muted/50 group"
                          >
                            {/* Circle indicator */}
                            <div className="absolute right-0 z-10">
                              {step.done ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                                </motion.div>
                              ) : (
                                <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/30 bg-background flex items-center justify-center">
                                  <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>
                                </div>
                              )}
                            </div>

                            <span className={cn(
                              "text-sm font-semibold flex-1",
                              step.done ? "text-success" : "text-foreground"
                            )}>
                              {step.label}
                            </span>

                            {!step.done && (
                              <motion.div
                                whileHover={{ x: -4 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                              </motion.div>
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Schedule Status — Ambient Glow */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className={cn(
              "card-soft border-0 overflow-hidden relative",
              hasSchedule && "ring-1 ring-success/20"
            )}>
              {/* Ambient glow */}
              <div className={cn(
                "absolute inset-0 opacity-30 blur-3xl pointer-events-none",
                hasSchedule
                  ? "bg-[radial-gradient(ellipse_at_top,hsl(160_72%_38%/0.3),transparent_60%)]"
                  : "bg-[radial-gradient(ellipse_at_top,hsl(36_90%_50%/0.25),transparent_60%)]"
              )} />

              <div className={cn(
                "h-1.5",
                hasSchedule ? "bg-gradient-to-l from-success to-[hsl(160,72%,50%)]" : "bg-gradient-to-l from-warning to-[hsl(25,90%,50%)]"
              )} />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  حالة الجدول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl backdrop-blur-sm",
                  hasSchedule ? "bg-success/8" : "bg-warning/8"
                )}>
                  {hasSchedule ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                      <CheckCircle2 className="h-12 w-12 text-success" />
                    </motion.div>
                  ) : (
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                      <AlertCircle className="h-12 w-12 text-warning" />
                    </motion.div>
                  )}
                  <div>
                    <p className="text-2xl font-bold">{scheduleEntries?.length || 0} محاضرة</p>
                    <p className={cn(
                      "text-sm mt-1",
                      hasSchedule ? "text-success" : "text-warning"
                    )}>
                      {hasSchedule ? 'تم توليد الجدول بنجاح' : 'لم يتم توليد الجدول بعد'}
                    </p>
                  </div>
                </div>

                <Button 
                  asChild 
                  className="w-full gap-2 rounded-2xl h-12" 
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
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-soft border-0">
            <CardHeader>
              <CardTitle>إجراءات سريعة</CardTitle>
              <CardDescription>وصول سريع للمهام الشائعة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { icon: DoorOpen, label: 'إضافة قاعة', href: '/rooms', gradient: 'from-[hsl(197,80%,55%)] to-[hsl(197,80%,42%)]' },
                  { icon: GraduationCap, label: 'إضافة دكتور', href: '/professors', gradient: 'from-[hsl(160,72%,38%)] to-[hsl(160,72%,28%)]' },
                  { icon: Users, label: 'إضافة مجموعة', href: '/groups', gradient: 'from-[hsl(262,60%,55%)] to-[hsl(262,60%,42%)]' },
                  { icon: BookOpen, label: 'إضافة مادة', href: '/subjects', gradient: 'from-[hsl(36,90%,50%)] to-[hsl(36,90%,40%)]' },
                  { icon: Clock, label: 'إضافة فترة', href: '/time-slots', gradient: 'from-[hsl(340,70%,50%)] to-[hsl(340,70%,40%)]' },
                ].map((action) => (
                  <motion.div key={action.label} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}>
                    <Button 
                      asChild 
                      variant="outline"
                      className="h-auto w-full py-5 flex-col gap-3 rounded-2xl border-border/40 hover:shadow-soft transition-shadow"
                    >
                      <Link to={action.href}>
                        <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white", action.gradient)}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium">{action.label}</span>
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
