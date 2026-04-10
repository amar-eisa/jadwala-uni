import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  LayoutDashboard, 
  DoorOpen, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Clock, 
  Calendar,
  Menu,
  X,
  LogOut,
  Shield,
  Settings,
  Phone,
  Mail,
  BarChart3,
  Activity,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useScheduleEntries } from '@/hooks/useSchedule';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useUserSettings } from '@/hooks/useUserSettings';
import jadwalaLogo from '@/assets/jadwala-logo.png';
import connectLogo from '@/assets/connect-logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard, countKey: null },
  { name: 'القاعات', href: '/rooms', icon: DoorOpen, countKey: 'rooms' },
  { name: 'الدكاترة', href: '/professors', icon: GraduationCap, countKey: 'professors' },
  { name: 'المجموعات', href: '/groups', icon: Users, countKey: 'groups' },
  { name: 'المواد', href: '/subjects', icon: BookOpen, countKey: 'subjects' },
  { name: 'الفترات الزمنية', href: '/time-slots', icon: Clock, countKey: 'timeSlots' },
  { name: 'الجدول', href: '/timetable', icon: Calendar, countKey: 'schedule' },
];

function UserAvatar({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="user-avatar">
      {initial}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: userSettings } = useUserSettings();

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

  const navItems = [
    ...navigation,
    { name: 'التقارير', href: '/reports', icon: BarChart3, countKey: null },
    { name: 'سجل النشاطات', href: '/activity-log', icon: Activity, countKey: null },
    { name: 'الإعدادات', href: '/settings', icon: Settings, countKey: null },
    ...(isAdmin ? [
      { name: 'الإدارة', href: '/admin', icon: Shield, countKey: null },
      { name: 'المراقبة', href: '/admin/monitoring', icon: Activity, countKey: null },
    ] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen mesh-bg flex flex-col" dir="rtl">
        {/* Brand strip */}
        <div className="brand-strip w-full fixed top-0 z-[60]" />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-4 right-4 z-50 sidebar-glass text-sidebar-foreground rounded-3xl transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col overflow-hidden",
            "mt-2",
            sidebarCollapsed ? "lg:w-[72px]" : "lg:w-72",
            "w-72",
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          )}
        >
          {/* Geometric pattern overlay */}
          <div className="absolute inset-0 geo-pattern pointer-events-none" />

          {/* Logo Header */}
          <div className="relative flex flex-col px-4 py-4 border-b border-sidebar-border/30 bg-gradient-to-l from-sidebar-accent/50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg animate-pulse-soft" />
                  <img 
                    src={jadwalaLogo} 
                    alt="جدولة" 
                    className="h-10 w-auto relative z-10"
                  />
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold text-sidebar-foreground">جدولة</h1>
                    <p className="text-[10px] text-sidebar-foreground/40">Jadwala System</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Collapse toggle - desktop only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
                  onClick={toggleCollapse}
                >
                  {sidebarCollapsed ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* شعار الجامعة المخصص */}
            {!sidebarCollapsed && (userSettings?.university_name || userSettings?.university_logo_url) && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sidebar-border/50">
                {userSettings?.university_logo_url && (
                  <img 
                    src={`${userSettings.university_logo_url}?t=${Date.now()}`}
                    alt="شعار الجامعة" 
                    className="h-8 w-8 object-contain rounded"
                  />
                )}
                {userSettings?.university_name && (
                  <span className="text-xs text-sidebar-foreground/70">
                    {userSettings.university_name}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Glass separator with gold accent */}
          <div className="mx-4 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />

          {/* Navigation */}
          <nav className={cn(
            "relative flex-1 flex flex-col gap-1 overflow-y-auto",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            <LayoutGroup>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const count = item.countKey ? counts[item.countKey] : null;
                
                const linkContent = (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "relative flex items-center rounded-2xl text-sm font-medium transition-colors duration-200 group",
                      sidebarCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3",
                      isActive
                        ? "text-primary-foreground"
                        : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-gradient-to-l from-primary to-[hsl(205,78%,40%)] rounded-2xl nav-glow"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-sidebar-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        layoutId={undefined}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors shrink-0",
                        isActive 
                          ? "bg-primary-foreground/20" 
                          : "bg-sidebar-accent group-hover:bg-sidebar-accent"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!sidebarCollapsed && count !== null && count > 0 && (
                      <span className={cn(
                        "relative z-10 px-2 py-0.5 text-xs rounded-full font-medium",
                        isActive 
                          ? "bg-primary-foreground/20 text-primary-foreground" 
                          : "bg-sidebar-accent text-sidebar-foreground/70"
                      )}>
                        {count}
                      </span>
                    )}
                  </Link>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="left" className="font-medium">
                        <span>{item.name}</span>
                        {count !== null && count > 0 && (
                          <span className="mr-2 text-muted-foreground">({count})</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </LayoutGroup>
          </nav>

          {/* User Info & Sign Out */}
          <div className={cn(
            "relative mt-auto border-t border-sidebar-border shrink-0",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            {user && (
              <div className={cn(
                "bg-sidebar-accent/80 rounded-2xl backdrop-blur-sm",
                sidebarCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-4 space-y-3"
              )}>
                {sidebarCollapsed ? (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div><UserAvatar name={displayName} /></div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
                      </TooltipContent>
                    </Tooltip>
                    <ThemeToggle />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-border rounded-xl h-8 w-8"
                          onClick={handleSignOut}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">تسجيل الخروج</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={displayName} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sidebar-foreground truncate">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        {user.user_metadata?.full_name && (
                          <p className="text-[11px] text-sidebar-foreground/50 truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <ThemeToggle />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-border rounded-xl"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:pr-24" : "lg:pr-80"
        )}>
          {/* Mobile header */}
          <header className="sticky top-[3px] z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm">
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <img 
                  src={jadwalaLogo} 
                  alt="جدولة" 
                  className="h-8 w-auto"
                />
                <h1 className="text-lg font-bold">جدولة</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-auto lg:mr-0">
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 p-8 lg:p-10 pt-6 animate-fade-in">{children}</main>

          {/* Footer */}
          <footer className="relative border-t border-border/50 footer-pattern">
            <div className="lg:px-10 px-6 py-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={connectLogo} alt="Connect" className="h-6 w-auto opacity-60" />
                  <span className="text-xs text-muted-foreground">
                    جميع الحقوق محفوظة لـ Connect © {new Date().getFullYear()}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <a href="mailto:jadwala@connectsys.cloud" className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Mail className="h-3 w-3" />
                    jadwala@connectsys.cloud
                  </a>
                  <a href="tel:+249128150105" className="flex items-center gap-1 hover:text-foreground transition-colors" dir="ltr">
                    <Phone className="h-3 w-3" />
                    +249128150105
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </TooltipProvider>
  );
}
