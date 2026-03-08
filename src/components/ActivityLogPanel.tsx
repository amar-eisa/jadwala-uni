import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  Sparkles, 
  Trash2, 
  Users, 
  GraduationCap, 
  MapPin,
  BookOpen,
  FileText,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { ActivityLog } from '@/hooks/useActivityLog';

const ACTION_LABELS: Record<string, string> = {
  created: 'إنشاء',
  updated: 'تعديل',
  deleted: 'حذف',
  activated: 'تفعيل',
  generated: 'توليد',
  duplicated: 'نسخ',
  cleared: 'مسح',
};

const ENTITY_LABELS: Record<string, string> = {
  schedule: 'جدول',
  subject: 'مادة',
  professor: 'أستاذ',
  room: 'قاعة',
  group: 'دفعة',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <Sparkles className="h-3.5 w-3.5 text-success" />,
  updated: <FileText className="h-3.5 w-3.5 text-info" />,
  deleted: <Trash2 className="h-3.5 w-3.5 text-destructive" />,
  activated: <Clock className="h-3.5 w-3.5 text-primary" />,
  generated: <Sparkles className="h-3.5 w-3.5 text-warning" />,
  duplicated: <BookOpen className="h-3.5 w-3.5 text-info" />,
  cleared: <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />,
};

interface ActivityLogPanelProps {
  logs: ActivityLog[];
  isLoading: boolean;
}

export function ActivityLogPanel({ logs, isLoading }: ActivityLogPanelProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    if (filterType === 'all') return logs;
    return logs.filter(l => l.entity_type === filterType);
  }, [logs, filterType]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            سجل التغييرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            سجل التغييرات ({logs.length})
          </CardTitle>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="schedule">الجداول</SelectItem>
              <SelectItem value="subject">المواد</SelectItem>
              <SelectItem value="professor">الأساتذة</SelectItem>
              <SelectItem value="room">القاعات</SelectItem>
              <SelectItem value="group">الدفعات</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد سجلات</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
                <div className="mt-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {ACTION_ICONS[log.action] || <FileText className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACTION_LABELS[log.action] || log.action}{' '}
                    <span className="text-muted-foreground">{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                    {log.details?.name && (
                      <span className="text-primary font-semibold"> "{log.details.name}"</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(log.created_at), 'EEEE d MMMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
