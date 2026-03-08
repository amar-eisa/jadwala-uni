import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useActivityLogs } from '@/hooks/useActivityLog';
import { SearchInput } from '@/components/SearchInput';
import { Activity, Calendar, Filter, FileText, Download } from 'lucide-react';
import { EmptyStateIllustration } from '@/components/ui/empty-state-illustration';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { exportActivityLogsToCSV, exportActivityLogsToExcel, exportActivityLogsToPDF } from '@/lib/activityLogExport';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
};

const ACTION_LABELS: Record<string, string> = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  activate: 'تفعيل',
  deactivate: 'إلغاء تفعيل',
  copy: 'نسخ',
  generate: 'توليد',
};

const ENTITY_LABELS: Record<string, string> = {
  room: 'قاعة',
  professor: 'دكتور',
  subject: 'مادة',
  group: 'مجموعة',
  schedule: 'جدول',
  time_slot: 'فترة زمنية',
  schedule_entry: 'حصة',
  saved_schedule: 'جدول محفوظ',
};

export default function ActivityLogPage() {
  const { data: logs, isLoading } = useActivityLogs({ limit: 200 });
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const entityTypes = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map(l => l.entity_type))];
  }, [logs]);

  const actionTypes = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map(l => l.action))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(log.created_at) > new Date(dateTo + 'T23:59:59')) return false;
      if (search) {
        const s = search.toLowerCase();
        const actionLabel = ACTION_LABELS[log.action] || log.action;
        const entityLabel = ENTITY_LABELS[log.entity_type] || log.entity_type;
        const details = JSON.stringify(log.details || {});
        return actionLabel.includes(s) || entityLabel.includes(s) || details.toLowerCase().includes(s);
      }
      return true;
    });
  }, [logs, search, entityFilter, actionFilter, dateFrom, dateTo]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-success/10 text-success border-success/20';
      case 'delete': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'update': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold gradient-text">سجل النشاطات</h1>
            <p className="text-muted-foreground mt-1 text-sm">تتبع جميع العمليات والتغييرات في النظام</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => exportActivityLogsToCSV(filteredLogs)}>
              <Download className="h-3 w-3" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => exportActivityLogsToExcel(filteredLogs)}>
              <Download className="h-3 w-3" /> Excel
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => exportActivityLogsToPDF(filteredLogs)}>
              <Download className="h-3 w-3" /> PDF
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">الفلاتر</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <SearchInput value={search} onChange={setSearch} placeholder="بحث في السجل..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">نوع الكيان</Label>
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {entityTypes.map(t => (
                        <SelectItem key={t} value={t}>{ENTITY_LABELS[t] || t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">نوع العملية</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {actionTypes.map(a => (
                        <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">من تاريخ</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">إلى تاريخ</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl" dir="ltr" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'إجمالي السجلات', value: filteredLogs.length, Icon: Activity, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
            { label: 'أنواع الكيانات', value: entityTypes.length, Icon: FileText, iconBg: 'bg-info/10', iconColor: 'text-info' },
            { label: 'أنواع العمليات', value: actionTypes.length, Icon: Calendar, iconBg: 'bg-warning/10', iconColor: 'text-warning' },
          ].map(s => (
            <Card key={s.label} className="card-glass border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", s.iconBg)}>
                    <s.Icon className={cn("h-5 w-5", s.iconColor)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Logs Table */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader>
              <CardTitle className="text-base">السجلات</CardTitle>
              <CardDescription className="text-xs">{filteredLogs.length} سجل</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton-row">
                      <div className="skeleton-circle" />
                      <div className="skeleton-line-medium flex-1" />
                      <div className="skeleton-line-short" />
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد سجلات مطابقة</p>
                </div>
              ) : (
                <div className="overflow-x-auto table-enhanced">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>العملية</TableHead>
                        <TableHead>الكيان</TableHead>
                        <TableHead>التفاصيل</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log, index) => (
                        <TableRow key={log.id}>
                          <TableCell><div className="row-number">{index + 1}</div></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("rounded-xl", getActionColor(log.action))}>
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="rounded-xl">
                              {ENTITY_LABELS[log.entity_type] || log.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {log.details && Object.keys(log.details).length > 0
                              ? JSON.stringify(log.details).slice(0, 80)
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
