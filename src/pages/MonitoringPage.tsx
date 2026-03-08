import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { Activity, RefreshCw, Gauge, HardDrive, AlertTriangle, Globe, Clock, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

const ratingColors: Record<string, string> = {
  good: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'needs-improvement': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  poor: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const ratingLabels: Record<string, string> = {
  good: 'جيد',
  'needs-improvement': 'يحتاج تحسين',
  poor: 'ضعيف',
};

const metricDescriptions: Record<string, string> = {
  TTFB: 'وقت أول بايت من الخادم',
  FCP: 'أول رسم للمحتوى',
  LCP: 'أكبر رسم للمحتوى',
  FID: 'تأخر أول تفاعل',
  CLS: 'إزاحة التخطيط التراكمية',
};

export default function MonitoringPage() {
  const { metrics, navigation, resources, errors, memoryUsage, refresh } = usePerformanceMetrics();

  const navChartData = navigation ? [
    { name: 'DNS', value: navigation.dnsLookup },
    { name: 'TCP', value: navigation.tcpConnection },
    { name: 'الخادم', value: navigation.serverResponse },
    { name: 'DOM', value: navigation.domParsing },
    { name: 'DOMLoaded', value: navigation.domContentLoaded },
    { name: 'التحميل', value: navigation.pageLoad },
  ] : [];

  const resourceTypeData = resources.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  const resourceChart = Object.entries(resourceTypeData).map(([name, value]) => ({ name, value }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 md:p-3 rounded-xl bg-primary/10">
              <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">لوحة المراقبة</h1>
              <p className="text-sm md:text-base text-muted-foreground">إحصائيات الأداء والأخطاء في الوقت الفعلي</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.name} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{metric.name}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', ratingColors[metric.rating])}>
                    {ratingLabels[metric.rating]}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{metric.value}{metric.name === 'CLS' ? '' : 'ms'}</p>
                <p className="text-xs text-muted-foreground mt-1">{metricDescriptions[metric.name]}</p>
              </CardContent>
            </Card>
          ))}

          {/* Memory */}
          {memoryUsage && (
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">الذاكرة</span>
                </div>
                <p className="text-2xl font-bold">{memoryUsage.used} MB</p>
                <p className="text-xs text-muted-foreground mt-1">
                  من أصل {memoryUsage.total} MB ({Math.round((memoryUsage.used / memoryUsage.limit) * 100)}% من الحد)
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Timing Chart */}
        {navChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                توزيع وقت التحميل
              </CardTitle>
              <CardDescription>تفصيل مراحل تحميل الصفحة بالمللي ثانية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={navChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" />
                    <YAxis dataKey="name" type="category" width={70} className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}ms`, 'المدة']}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resource Distribution */}
          {resourceChart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  أنواع الموارد المحملة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resourceChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                الأخطاء المسجلة
                {errors.length > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{errors.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد أخطاء مسجلة ✓</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {errors.map((err, i) => (
                    <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <p className="text-sm font-medium truncate">{err.message}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{err.source}</span>
                        <Badge variant="outline" className="text-[10px]">×{err.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Slowest Resources Table */}
        {resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>أبطأ الموارد</CardTitle>
              <CardDescription>أبطأ 20 مورد تم تحميلها في الصفحة</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الملف</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>الحجم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.slice(0, 10).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.type}</Badge></TableCell>
                      <TableCell className={cn('font-medium', r.duration > 1000 ? 'text-destructive' : '')}>{r.duration}ms</TableCell>
                      <TableCell className="text-muted-foreground">{r.size > 0 ? `${(r.size / 1024).toFixed(1)} KB` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
