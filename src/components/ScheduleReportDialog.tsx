import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { DAY_LABELS, DayOfWeek } from '@/types/database';
import { Button } from '@/components/ui/button';

const DAYS_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export interface ScheduleReport {
  groups: Record<string, {
    name: string;
    days: Record<string, { total: number; theory: number; practical: number }>;
    totals: { theory: number; practical: number; total: number };
  }>;
  unscheduled: Array<{
    subjectName: string;
    groupName: string;
    type: string;
    reason: string;
  }>;
  overall: {
    scheduled: number;
    total: number;
    successRate: number;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ScheduleReport | null;
}

export function ScheduleReportDialog({ open, onOpenChange, report }: Props) {
  if (!report) return null;

  const { overall, unscheduled } = report;
  const groupEntries = Object.entries(report.groups);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            تقرير توزيع الجدول
          </DialogTitle>
          <DialogDescription>
            ملخص توزيع المحاضرات والمعامل بعد التوليد
          </DialogDescription>
        </DialogHeader>

        {/* Overall Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">نسبة الجدولة</span>
            <span className="font-bold text-foreground">{overall.scheduled} / {overall.total} ({overall.successRate}%)</span>
          </div>
          <Progress value={overall.successRate} className="h-3" />
          {overall.successRate === 100 ? (
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" />
              تم جدولة جميع المحاضرات بنجاح
            </div>
          ) : (
            <div className="flex items-center gap-2 text-warning text-sm">
              <AlertCircle className="h-4 w-4" />
              لم يتم جدولة {overall.total - overall.scheduled} جلسة
            </div>
          )}
        </div>

        {/* Per-Group Tables */}
        {groupEntries.map(([groupId, group]) => {
          const theoryPct = group.totals.total > 0 ? Math.round((group.totals.theory / group.totals.total) * 100) : 0;
          return (
            <div key={groupId} className="space-y-2 border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{group.name}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">نظري: {group.totals.theory}</Badge>
                  <Badge variant="outline">عملي: {group.totals.practical}</Badge>
                  <Badge>إجمالي: {group.totals.total}</Badge>
                </div>
              </div>

              {/* Theory/Practical ratio bar */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-16">نظري {theoryPct}%</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
                  <div className="bg-primary h-full transition-all" style={{ width: `${theoryPct}%` }} />
                  <div className="bg-success h-full transition-all" style={{ width: `${100 - theoryPct}%` }} />
                </div>
                <span className="text-muted-foreground w-16 text-left">عملي {100 - theoryPct}%</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اليوم</TableHead>
                    <TableHead className="text-center">نظري</TableHead>
                    <TableHead className="text-center">عملي</TableHead>
                    <TableHead className="text-center">إجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DAYS_ORDER.map(day => {
                    const dayData = group.days[day];
                    if (!dayData) return (
                      <TableRow key={day}>
                        <TableCell className="font-medium">{DAY_LABELS[day]}</TableCell>
                        <TableCell className="text-center text-muted-foreground">-</TableCell>
                        <TableCell className="text-center text-muted-foreground">-</TableCell>
                        <TableCell className="text-center text-muted-foreground">0</TableCell>
                      </TableRow>
                    );
                    return (
                      <TableRow key={day}>
                        <TableCell className="font-medium">{DAY_LABELS[day]}</TableCell>
                        <TableCell className="text-center">{dayData.theory || '-'}</TableCell>
                        <TableCell className="text-center">{dayData.practical || '-'}</TableCell>
                        <TableCell className="text-center font-semibold">{dayData.total}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          );
        })}

        {/* Unscheduled Sessions */}
        {unscheduled.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>جلسات لم تُجدول ({unscheduled.length})</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                {unscheduled.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>• {item.subjectName}</span>
                    <Badge variant="outline" className="text-[10px]">{item.groupName}</Badge>
                    <Badge variant="outline" className="text-[10px]">{item.type === 'theory' ? 'نظري' : 'عملي'}</Badge>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
