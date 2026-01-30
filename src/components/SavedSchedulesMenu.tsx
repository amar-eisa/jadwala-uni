import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Check, 
  Trash2, 
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { SavedSchedule } from '@/hooks/useSavedSchedules';
import { cn } from '@/lib/utils';

interface SavedSchedulesMenuProps {
  schedules: SavedSchedule[];
  isLoading: boolean;
  onActivate: (scheduleId: string) => void;
  onDelete: (scheduleId: string) => void;
  disabled?: boolean;
}

export function SavedSchedulesMenu({
  schedules,
  isLoading,
  onActivate,
  onDelete,
  disabled,
}: SavedSchedulesMenuProps) {
  const activeSchedule = schedules.find(s => s.is_active);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled || isLoading}>
          <FolderOpen className="h-4 w-4" />
          <span className="hidden sm:inline">
            {activeSchedule ? activeSchedule.name : 'الجداول المحفوظة'}
          </span>
          <span className="sm:hidden">المحفوظة</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          الجداول المحفوظة ({schedules.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {schedules.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            لا توجد جداول محفوظة
          </div>
        ) : (
          schedules.map((schedule) => (
            <DropdownMenuItem
              key={schedule.id}
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => onActivate(schedule.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium truncate",
                    schedule.is_active && "text-primary"
                  )}>
                    {schedule.name}
                  </span>
                  {schedule.is_active && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      نشط
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(schedule.created_at), 'EEEE d MMMM yyyy', { locale: ar })}
                </p>
              </div>
              
              <div className="flex items-center gap-1 mr-2">
                {schedule.is_active && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`هل تريد حذف "${schedule.name}"؟`)) {
                      onDelete(schedule.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
