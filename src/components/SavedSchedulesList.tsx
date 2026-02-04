import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FolderOpen, 
  Check, 
  Trash2, 
  Calendar,
  FileDown,
  Hash,
  Users,
} from 'lucide-react';
import { SavedSchedule } from '@/hooks/useSavedSchedules';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';

interface StudentGroup {
  id: string;
  name: string;
}

interface SavedSchedulesListProps {
  schedules: SavedSchedule[];
  groups: StudentGroup[];
  isLoading: boolean;
  onActivate: (scheduleId: string) => void;
  onDelete: (scheduleId: string) => void;
  onExportPdf?: (scheduleId: string) => void;
  disabled?: boolean;
}

export function SavedSchedulesList({
  schedules,
  groups,
  isLoading,
  onActivate,
  onDelete,
  onExportPdf,
  disabled,
}: SavedSchedulesListProps) {
  const [filterGroupId, setFilterGroupId] = useState<string>('all');

  // Create group lookup map
  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach(g => map.set(g.id, g.name));
    return map;
  }, [groups]);

  // Filter schedules based on selected group
  const filteredSchedules = useMemo(() => {
    if (filterGroupId === 'all') return schedules;
    if (filterGroupId === 'global') return schedules.filter(s => !s.group_id);
    return schedules.filter(s => s.group_id === filterGroupId);
  }, [schedules, filterGroupId]);

  // Sort by created_at descending
  const sortedSchedules = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [filteredSchedules]);

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return 'جدول عام';
    return groupMap.get(groupId) || 'غير معروف';
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            الجداول المحفوظة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-xl border bg-muted/30">
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            الجداول المحفوظة ({schedules.length})
          </CardTitle>
          
          {/* Filter by group */}
          <Select value={filterGroupId} onValueChange={setFilterGroupId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="فلترة حسب الدفعة" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">جميع الجداول</SelectItem>
              <SelectItem value="global">الجداول العامة</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {sortedSchedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد جداول محفوظة</p>
            {filterGroupId !== 'all' && (
              <p className="text-sm mt-1">جرّب تغيير الفلتر لعرض المزيد</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={cn(
                  "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                  schedule.is_active 
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20" 
                    : "bg-muted/30 border-border/50 hover:border-primary/30"
                )}
              >
                {/* Header with name and active badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className={cn(
                    "font-semibold line-clamp-2",
                    schedule.is_active && "text-primary"
                  )}>
                    {schedule.name}
                  </h4>
                  {schedule.is_active && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 shrink-0">
                      <Check className="h-3 w-3 ml-1" />
                      نشط
                    </Badge>
                  )}
                </div>
                
                {/* Group info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>{getGroupName(schedule.group_id)}</span>
                </div>
                
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(schedule.created_at), 'EEEE d MMMM yyyy', { locale: ar })}</span>
                </div>
                
                {/* Version */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Hash className="h-3.5 w-3.5" />
                  <span>الإصدار: {schedule.version || 1}</span>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  {!schedule.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onActivate(schedule.id)}
                      disabled={disabled}
                      className="flex-1 gap-1 text-xs"
                    >
                      <Check className="h-3 w-3" />
                      تفعيل
                    </Button>
                  )}
                  
                  {onExportPdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExportPdf(schedule.id)}
                      disabled={disabled}
                      className={cn("gap-1 text-xs", !schedule.is_active && "flex-1")}
                    >
                      <FileDown className="h-3 w-3" />
                      PDF
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`هل تريد حذف "${schedule.name}"؟`)) {
                        onDelete(schedule.id);
                      }
                    }}
                    disabled={disabled}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
