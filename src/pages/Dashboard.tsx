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
import { CountUp } from '@/components/ui/count-up';
import { MiniSparkline } from '@/components/ui/mini-sparkline';
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
  Sparkles,
  Zap
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
      iconBg: 'bg-[hsl(197,80%,55%)/0.12]',
      iconColor: 'text-[hsl(197,80%,48%)]',
      glowColor: 'hsl(197 80% 55% / 0.08)',
      description: 'قاعات ومعامل'
    },
    { 
      name: 'الدكاترة', 
      value: professors?.length || 0, 
      icon: GraduationCap, 
      href: '/professors',
      iconBg: 'bg-[hsl(160,72%,38%)/0.12]',
      iconColor: 'text-[hsl(160,72%,34%)]',
      glowColor: 'hsl(160 72% 38% / 0.08)',
      description: 'أعضاء هيئة التدريس'
    },
    { 
      name: 'المجموعات', 
      value: groups?.length || 0, 
      icon: Users, 
      href: '/groups',
      iconBg: 'bg-[hsl(262,60%,55%)/0.12]',
      iconColor: 'text-[hsl(262,60%,50%)]',
      glowColor: 'hsl(262 60% 55% / 0.08)',
      description: 'مجموعات الطلاب'
    },
    { 
      name: 'المواد', 
      value: subjects?.length || 0, 
      icon: BookOpen, 
      href: '/subjects',
      iconBg: 'bg-[hsl(36,90%,50%)/0.12]',
      iconColor: 'text-[hsl(36,90%,45%)]',
      glowColor: 'hsl(36 90% 50% / 0.08)',
      description: 'مواد دراسية'
    },
    { 
      name: 'الفترات الزمنية', 
      value: timeSlots?.length || 0, 
      icon: Clock, 
      href: '/time-slots',
      iconBg: 'bg-[hsl(340,70%,50%)/0.12]',
      iconColor: 'text-[hsl(340,70%,45%)]',
      glowColor: 'hsl(340 70% 50% / 0.08)',
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  };

  return (
    <Layout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">نظرة عامة على نظام جدولة المحاضرات</p>
          </div>
          <div className="hidden sm:block">
            <Button asChild size="lg" className="gap-2 rounded-2xl shadow-lg shadow-primary/20">
              <Link to="/timetable">
                <Calendar className="h-4 w-4" />
                عرض الجدول
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid — Glass Widgets */}
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <Link to={stat.href} key={stat.name}>
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="card-glass group cursor-pointer overflow-hidden border-0"
              >
                <CardContent className="p-5 relative">
                  {/* Hover ambient glow */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${stat.glowColor}, transparent 70%)` }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      {/* Circular icon container with inner glow */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center",
                          stat.iconBg
                        )}
                        style={{
                          boxShadow: `inset 0 0 12px ${stat.glowColor}`
                        }}
                      >
                        <stat.icon className={cn("h-5 w-5", stat.iconColor)} />
                      </motion.div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{stat.name}</p>
                          <p className="text-2xl font-bold mt-0.5 stat-number">
                            <CountUp value={stat.value} />
                          </p>
                        </div>
                        <MiniSparkline value={stat.value} color={stat.glowColor.replace(' / 0.08', '')} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </MotionCard>
            </Link>
          ))}
        </motion.div>

        {/* Setup Progress / System Statistics & Schedule Status */}
        <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
          {isSetupComplete ? (
            /* System Statistics */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="card-glass border-0 overflow-hidden">
                <div className="h-1 bg-gradient-to-l from-success to-[hsl(160,72%,50%)]" />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-success" />
                    إحصائيات النظام
                  </CardTitle>
                  <CardDescription className="text-xs">نظرة سريعة على بيانات الجدولة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: totalLectures, label: 'محاضرة', bg: 'bg-primary/8' },
                      { value: totalDays, label: 'أيام عمل', bg: 'bg-info/8' },
                      { value: avgLecturesPerDay, label: 'محاضرة/يوم', bg: 'bg-[hsl(262,60%,55%)/0.08]' },
                      { value: `${utilizationRate}%`, label: 'نسبة الاستخدام', bg: 'bg-warning/8' },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className={cn("rounded-2xl p-4 text-center", s.bg)}
                      >
                        <p className="text-2xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-success/8">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-success">النظام جاهز ومكتمل</p>
                      <p className="text-xs text-muted-foreground">جميع البيانات الأساسية متوفرة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Premium Vertical Stepper */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="card-glass border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    تقدم إعداد النظام
                  </CardTitle>
                  <CardDescription className="text-xs">
                    <span style={{ fontFamily: 'Inter, sans-serif' }}>{completedSteps}/{totalSteps}</span> — أكمل الخطوات لتوليد الجدول
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Progress bar */}
                  <div className="mb-6 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-primary to-[hsl(197,80%,42%)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  {/* Vertical timeline */}
                  <div className="relative pr-8">
                    {/* Sleek vertical line */}
                    <div className="absolute right-[13px] top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-border via-border/50 to-border" />

                    <div className="space-y-0.5">
                      {setupSteps.map((step, i) => (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                        >
                          <Link
                            to={step.href}
                            className="flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 hover:bg-muted/40 group"
                          >
                            {/* Circle indicator */}
                            <div className="absolute right-0 z-10">
                              {step.done ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 + i * 0.1 }}
                                  className="w-7 h-7 rounded-full bg-success flex items-center justify-center"
                                  style={{ boxShadow: '0 0 10px hsl(160 72% 38% / 0.3)' }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                </motion.div>
                              ) : (
                                <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 bg-background flex items-center justify-center">
                                  <span className="text-[11px] font-bold text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>{i + 1}</span>
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

          {/* Schedule Status — High-tech focal point */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <Card className={cn(
              "card-glass border-0 overflow-hidden relative h-full",
              hasSchedule && "ring-1 ring-success/15"
            )}>
              {/* Soft brand gradient background */}
              <div className={cn(
                "absolute inset-0 opacity-40 pointer-events-none",
                hasSchedule
                  ? "bg-[radial-gradient(ellipse_at_top_right,hsl(160_72%_38%/0.15),transparent_60%)]"
                  : "bg-[radial-gradient(ellipse_at_top_right,hsl(197_80%_55%/0.12),transparent_60%)]"
              )} />

              <div className={cn(
                "h-1",
                hasSchedule ? "bg-gradient-to-l from-success to-[hsl(160,72%,50%)]" : "bg-gradient-to-l from-primary to-[hsl(197,80%,42%)]"
              )} />
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  حالة الجدول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 relative z-10">
                <div className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl",
                  hasSchedule ? "bg-success/6" : "bg-primary/6"
                )}>
                  {hasSchedule ? (
                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                      <CheckCircle2 className="h-10 w-10 text-success" />
                    </motion.div>
                  ) : (
                    <motion.div animate={{ rotate: [0, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                      <AlertCircle className="h-10 w-10 text-primary" />
                    </motion.div>
                  )}
                  <div>
                    {/* Large bold neon-style count */}
                    <p 
                      className="text-4xl font-extrabold"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        textShadow: hasSchedule 
                          ? '0 0 20px hsl(160 72% 38% / 0.3)' 
                          : '0 0 20px hsl(197 80% 55% / 0.25)'
                      }}
                    >
                      {scheduleEntries?.length || 0} <span className="text-lg font-bold text-muted-foreground">محاضرة</span>
                    </p>
                    <p className={cn(
                      "text-sm mt-0.5",
                      hasSchedule ? "text-success" : "text-muted-foreground"
                    )}>
                      {hasSchedule ? 'تم توليد الجدول بنجاح' : 'لم يتم توليد الجدول بعد'}
                    </p>
                  </div>
                </div>

                {/* CTA with pulse when ready */}
                <motion.div
                  animate={canGenerate && !hasSchedule ? { 
                    boxShadow: [
                      '0 0 0 0 hsl(197 80% 55% / 0)',
                      '0 0 0 8px hsl(197 80% 55% / 0.15)',
                      '0 0 0 0 hsl(197 80% 55% / 0)'
                    ]
                  } : {}}
                  transition={canGenerate && !hasSchedule ? { repeat: Infinity, duration: 2.5 } : {}}
                  className="rounded-2xl"
                >
                  <Button 
                    asChild 
                    className="w-full gap-2 rounded-2xl h-12" 
                    size="lg"
                    variant={hasSchedule ? "default" : "default"}
                  >
                    <Link to="/timetable">
                      {canGenerate && !hasSchedule ? (
                        <Zap className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                      {hasSchedule ? 'عرض الجدول الكامل' : 'توليد الجدول'}
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>

                {!canGenerate && (
                  <p className="text-[11px] text-center text-muted-foreground">
                    يجب إضافة قاعات ومواد وفترات زمنية قبل توليد الجدول
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
              <CardDescription className="text-xs">وصول سريع للمهام الشائعة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { icon: DoorOpen, label: 'إضافة قاعة', href: '/rooms', iconBg: 'bg-[hsl(197,80%,55%)/0.1]', iconColor: 'text-[hsl(197,80%,48%)]' },
                  { icon: GraduationCap, label: 'إضافة دكتور', href: '/professors', iconBg: 'bg-[hsl(160,72%,38%)/0.1]', iconColor: 'text-[hsl(160,72%,34%)]' },
                  { icon: Users, label: 'إضافة مجموعة', href: '/groups', iconBg: 'bg-[hsl(262,60%,55%)/0.1]', iconColor: 'text-[hsl(262,60%,50%)]' },
                  { icon: BookOpen, label: 'إضافة مادة', href: '/subjects', iconBg: 'bg-[hsl(36,90%,50%)/0.1]', iconColor: 'text-[hsl(36,90%,45%)]' },
                  { icon: Clock, label: 'إضافة فترة', href: '/time-slots', iconBg: 'bg-[hsl(340,70%,50%)/0.1]', iconColor: 'text-[hsl(340,70%,45%)]' },
                ].map((action) => (
                  <motion.div key={action.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                    <Button 
                      asChild 
                      variant="outline"
                      className="h-auto w-full py-4 flex-col gap-2.5 rounded-2xl border-border/30 hover:border-border/50 bg-background/50 backdrop-blur-sm transition-all"
                    >
                      <Link to={action.href}>
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", action.iconBg)}>
                          <action.icon className={cn("h-4.5 w-4.5", action.iconColor)} />
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
      </motion.div>
    </Layout>
  );
}
