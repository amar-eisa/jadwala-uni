import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
  LogOut
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

const navigation = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard, countKey: null },
  { name: 'القاعات', href: '/rooms', icon: DoorOpen, countKey: 'rooms' },
  { name: 'الدكاترة', href: '/professors', icon: GraduationCap, countKey: 'professors' },
  { name: 'المجموعات', href: '/groups', icon: Users, countKey: 'groups' },
  { name: 'المواد', href: '/subjects', icon: BookOpen, countKey: 'subjects' },
  { name: 'الفترات الزمنية', href: '/time-slots', icon: Clock, countKey: 'timeSlots' },
  { name: 'الجدول', href: '/timetable', icon: Calendar, countKey: 'schedule' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
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
          "fixed inset-y-0 right-0 z-50 w-72 bg-sidebar text-sidebar-foreground border-l border-sidebar-border shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-sidebar-border bg-gradient-to-l from-sidebar-accent/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">نظام الجدولة</h1>
              <p className="text-xs text-sidebar-foreground/60">جامعة المستقبل</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const count = item.countKey ? counts[item.countKey] : null;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary-foreground/20" 
                      : "bg-sidebar-accent group-hover:bg-sidebar-accent"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span>{item.name}</span>
                </div>
                {count !== null && count > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs rounded-full font-medium",
                    isActive 
                      ? "bg-primary-foreground/20 text-primary-foreground" 
                      : "bg-sidebar-accent text-sidebar-foreground/70"
                  )}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          {user && (
            <div className="bg-sidebar-accent rounded-xl p-4 space-y-3">
              <div className="text-center">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.user_metadata?.full_name || user.email}
                </p>
                {user.user_metadata?.full_name && (
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user.email}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-border"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pr-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:hidden shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">نظام الجدولة</h1>
          </div>
        </header>

        <main className="p-6 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
