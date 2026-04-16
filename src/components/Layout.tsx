import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { trackPageView } from '@/lib/amplitude';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  LayoutDashboard, 
  DoorOpen, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock, 
  Calendar,
  LogOut,
  Shield,
  Settings,
  Phone,
  Mail,
  BarChart3,
  Activity,
  MoreHorizontal
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useScheduleEntries } from '@/hooks/useSchedule';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useUserSettings } from '@/hooks/useUserSettings';
import jadwalaLogo from '@/assets/jadwala-logo.png';
import connectLogo from '@/assets/connect-logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Prefetch config: map routes to their query keys and fetch functions
const prefetchMap: Record<string, { queryKey: string[]; queryFn: () => Promise<any> }[]> = {
  '/rooms': [{
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('*');
      return data;
    },
  }],
  '/professors': [{
    queryKey: ['professors'],
    queryFn: async () => {
      const { data } = await supabase.from('professors').select('*');
      return data;
    },
  }],
  '/groups': [{
    queryKey: ['student_groups'],
    queryFn: async () => {
      const { data } = await supabase.from('student_groups').select('*');
      return data;
    },
  }],
  '/subjects': [{
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await supabase.from('subjects').select('*, professor:professors(*), group:student_groups(*)');
      return data;
    },
  }],
  '/time-slots': [{
    queryKey: ['time_slots'],
    queryFn: async () => {
      const { data } = await supabase.from('time_slots').select('*');
      return data;
    },
  }],
  '/timetable': [{
    queryKey: ['schedule_entries', 'draft'],
    queryFn: async () => {
      const { data } = await supabase.from('schedule_entries').select('*, room:rooms(*), time_slot:time_slots(*), subject:subjects(*, professor:professors(*), group:student_groups(*))').is('schedule_id', null);
      return data;
    },
  }],
};

const primaryNav = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard, countKey: null },
  { name: 'القاعات', href: '/rooms', icon: DoorOpen, countKey: 'rooms' },
  { name: 'الدكاترة', href: '/professors', icon: GraduationCap, countKey: 'professors' },
  { name: 'المجموعات', href: '/groups', icon: Users, countKey: 'groups' },
  { name: 'المواد', href: '/subjects', icon: BookOpen, countKey: 'subjects' },
  { name: 'الفترات الزمنية', href: '/time-slots', icon: Clock, countKey: 'timeSlots' },
  { name: 'الجدول', href: '/timetable', icon: Calendar, countKey: 'schedule' },
];

const secondaryNav = [
  { name: 'التقارير', href: '/reports', icon: BarChart3, countKey: null },
  { name: 'سجل النشاطات', href: '/activity-log', icon: Activity, countKey: null },
  { name: 'الإعدادات', href: '/settings', icon: Settings, countKey: null },
];

const adminNav = [
  { name: 'الإدارة', href: '/admin', icon: Shield, countKey: null },
  { name: 'المراقبة', href: '/admin/monitoring', icon: Activity, countKey: null },
];

function UserAvatar({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="user-avatar w-8 h-8 text-xs">
      {initial}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: userSettings } = useUserSettings();

  const queryClient = useQueryClient();

  const handlePrefetch = useCallback((href: string) => {
    const queries = prefetchMap[href];
    if (!queries) return;
    queries.forEach(({ queryKey, queryFn }) => {
      queryClient.prefetchQuery({ queryKey, queryFn, staleTime: 5 * 60 * 1000 });
    });
  }, [queryClient]);

  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const { data: timeSlots } = useTimeSlots();
  const { data: scheduleEntries } = useScheduleEntries();

  const counts: Record<string, number> = {
    rooms: rooms?.length || 0,
    professors: professors?.length || 0,
    groups: groups?.length || 0,
    subjects: subjects?.length || 0,
    timeSlots: timeSlots?.length || 0,
    schedule: scheduleEntries?.length || 0,
  };

  const moreItems = [
    ...secondaryNav,
    ...(isAdmin ? adminNav : []),
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';

  // Track page views
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreOpen]);

  // Check if any secondary/admin item is active
  const isMoreActive = moreItems.some(item => location.pathname === item.href);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen mesh-bg flex flex-col" dir="rtl">
        {/* Brand strip */}
        <div className="brand-strip w-full fixed top-0 z-[60]" />

        {/* Header — always visible */}
        <header className="sticky top-[3px] z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse-soft" />
              <img src={jadwalaLogo} alt="جدولة" className="h-8 w-auto relative z-10" />
            </div>
            <div>
              <h1 className="text-base font-bold">جدولة</h1>
              <p className="text-[9px] text-muted-foreground/60 leading-none">Jadwala System</p>
            </div>
            {/* University branding */}
            {(userSettings?.university_name || userSettings?.university_logo_url) && (
              <div className="flex items-center gap-2 mr-3 pr-3 border-r border-border/50">
                {userSettings?.university_logo_url && (
                  <img 
                    src={`${userSettings.university_logo_url}?t=${Date.now()}`}
                    alt="شعار الجامعة" 
                    className="h-7 w-7 object-contain rounded"
                  />
                )}
                {userSettings?.university_name && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {userSettings.university_name}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 pt-6 pb-24 animate-fade-in">{children}</main>

        {/* Footer */}
        <footer className="relative border-t border-border/50 footer-pattern mb-[72px]">
          <div className="px-4 sm:px-6 lg:px-10 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={connectLogo} alt="Connect" className="h-5 w-auto opacity-60" />
                <span className="text-xs text-muted-foreground">
                  جميع الحقوق محفوظة لـ Connect © {new Date().getFullYear()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <a href="mailto:jadwala@connectsys.cloud" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Mail className="h-3 w-3" />
                  <span className="hidden sm:inline">jadwala@connectsys.cloud</span>
                </a>
                <a href="tel:+249128150105" className="flex items-center gap-1 hover:text-foreground transition-colors" dir="ltr">
                  <Phone className="h-3 w-3" />
                  <span className="hidden sm:inline">+249128150105</span>
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Bottom Taskbar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto max-w-5xl px-2 sm:px-4">
            <div className="mx-1 sm:mx-2 mb-2 sm:mb-3 h-[60px] sm:h-[64px] bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex items-center justify-between px-2 sm:px-4 gap-1">
              
              {/* User section */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {user && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-default">
                          <UserAvatar name={displayName} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{user.user_metadata?.full_name || user.email}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">تسجيل الخروج</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>

              {/* Primary nav icons */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <LayoutGroup>
                  {primaryNav.map((item) => {
                    const isActive = location.pathname === item.href;
                    const count = item.countKey ? counts[item.countKey] : null;
                    
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              "relative flex items-center justify-center rounded-xl p-2 sm:p-2.5 transition-colors duration-200",
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="taskbar-pill"
                                className="absolute inset-0 bg-gradient-to-t from-primary to-[hsl(205,78%,40%)] rounded-xl shadow-lg"
                                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                              />
                            )}
                            <div className="relative z-10">
                              <item.icon className="h-5 w-5" />
                              {/* Count dot */}
                              {count !== null && count > 0 && (
                                <span className={cn(
                                  "absolute -top-1 -left-1 w-2 h-2 rounded-full",
                                  isActive ? "bg-primary-foreground/80" : "bg-primary"
                                )} />
                              )}
                            </div>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{item.name}</p>
                          {count !== null && count > 0 && (
                            <p className="text-[10px] text-muted-foreground">{count} عنصر</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </LayoutGroup>
              </div>

              {/* More menu */}
              <div className="relative shrink-0" ref={moreRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setMoreOpen(!moreOpen)}
                      className={cn(
                        "relative flex items-center justify-center rounded-xl p-2 sm:p-2.5 transition-colors duration-200",
                        moreOpen || isMoreActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  {!moreOpen && <TooltipContent side="top">المزيد</TooltipContent>}
                </Tooltip>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl p-1.5 overflow-hidden"
                    >
                      {moreItems.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground/80 hover:bg-muted"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
