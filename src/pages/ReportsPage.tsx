import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReports } from '@/hooks/useReports';
import { DAY_LABELS } from '@/types/database';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, DoorOpen, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f97316',
  '#06b6d4',
  '#8b5cf6',
];

export default function ReportsPage() {
  const { isLoading, workloadData, utilizationData, subjectAllocationData, conflictsData, gapsData } = useReports();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const avgWorkload = workloadData.length > 0 
    ? Math.round(workloadData.reduce((s, w) => s + w.totalHours, 0) / workloadData.length) 
    : 0;

  const avgUtilization = utilizationData.length > 0
    ? Math.round(utilizationData.reduce((s, u) => s + u.percentage, 0) / utilizationData.length)
    : 0;

  const unscheduledCount = subjectAllocationData.filter(s => !s.isFullyScheduled).length;

  const pieData = utilizationData.map(r => ({
    name: r.name,
    value: r.usedSlots,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقارير</h1>
          <p className="text-muted-foreground mt-1">تحليل شامل لبيانات الجدول والموارد</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط عبء الأستاذ</p>
                  <p className="text-2xl font-bold">{avgWorkload} <span className="text-sm font-normal">ساعة</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10"><DoorOpen className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط إشغال القاعات</p>
                  <p className="text-2xl font-bold">{avgUtilization}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10"><BookOpen className="h-5 w-5 text-destructive" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">مواد غير مجدولة بالكامل</p>
                  <p className="text-2xl font-bold">{unscheduledCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">تعارضات</p>
                  <p className="text-2xl font-bold">{conflictsData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="workload" dir="rtl">
          <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="workload" className="flex-1 min-w-[120px]">عبء الأساتذة</TabsTrigger>
            <TabsTrigger value="rooms" className="flex-1 min-w-[120px]">استخدام القاعات</TabsTrigger>
            <TabsTrigger value="subjects" className="flex-1 min-w-[120px]">المواد والدفعات</TabsTrigger>
            <TabsTrigger value="conflicts" className="flex-1 min-w-[120px]">التعارضات والفجوات</TabsTrigger>
          </TabsList>

          {/* Workload Tab */}
          <TabsContent value="workload">
            <Card>
              <CardHeader>
                <CardTitle>عبء العمل الأسبوعي للأساتذة</CardTitle>
              </CardHeader>
              <CardContent>
                {workloadData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">لا توجد بيانات</p>
                ) : (
                  <>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workloadData} layout="vertical" margin={{ right: 30, left: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, direction: 'rtl' }}
                            formatter={(value: number, name: string) => [value, name === 'totalHours' ? 'ساعات' : 'محاضرات']}
                          />
                          <Bar dataKey="totalHours" name="الساعات" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                          <Bar dataKey="lectureCount" name="المحاضرات المجدولة" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table className="mt-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">الأستاذ</TableHead>
                          <TableHead className="text-center whitespace-nowrap">الساعات الأسبوعية</TableHead>
                          <TableHead className="text-center whitespace-nowrap">المحاضرات المجدولة</TableHead>
                          <TableHead className="min-w-[180px]">المواد</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workloadData.map(w => (
                          <TableRow key={w.name}>
                            <TableCell className="font-medium whitespace-nowrap">{w.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={w.totalHours > avgWorkload * 1.5 ? 'destructive' : w.totalHours < avgWorkload * 0.5 ? 'secondary' : 'default'}>
                                {w.totalHours}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{w.lectureCount}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[250px]">{w.subjects.join('، ')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>توزيع الإشغال</CardTitle></CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">لا توجد بيانات</p>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>نسبة الإشغال لكل قاعة</CardTitle></CardHeader>
                <CardContent>
                  {utilizationData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">لا توجد بيانات</p>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={utilizationData} margin={{ right: 20, left: 60 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" domain={[0, 100]} unit="%" />
                          <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, direction: 'rtl' }}
                            formatter={(value: number) => [`${value}%`, 'نسبة الإشغال']}
                          />
                          <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader><CardTitle>تفاصيل استخدام القاعات</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">القاعة</TableHead>
                      <TableHead className="text-center whitespace-nowrap">النوع</TableHead>
                      <TableHead className="text-center whitespace-nowrap">الفترات المستخدمة</TableHead>
                      <TableHead className="text-center whitespace-nowrap">الفترات الفارغة</TableHead>
                      <TableHead className="text-center whitespace-nowrap">نسبة الإشغال</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utilizationData.map(r => (
                      <TableRow key={r.name}>
                        <TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{r.type}</Badge></TableCell>
                        <TableCell className="text-center">{r.usedSlots}</TableCell>
                        <TableCell className="text-center">{r.freeSlots}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={r.percentage > 80 ? 'destructive' : r.percentage < 30 ? 'secondary' : 'default'}>
                            {r.percentage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader><CardTitle>توزيع المواد على الدفعات</CardTitle></CardHeader>
              <CardContent>
                {subjectAllocationData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">لا توجد بيانات</p>
                ) : (
                  <>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectAllocationData} margin={{ right: 20, left: 80 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" />
                          <YAxis dataKey="subjectName" type="category" width={70} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, direction: 'rtl' }}
                            formatter={(value: number, name: string) => [value, name === 'requiredHours' ? 'المطلوب' : 'المخصص']}
                          />
                          <Bar dataKey="requiredHours" name="المطلوب" fill="hsl(var(--chart-3))" radius={[0, 6, 6, 0]} />
                          <Bar dataKey="allocatedHours" name="المخصص" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Table className="mt-6">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[130px]">المادة</TableHead>
                          <TableHead className="whitespace-nowrap">الدفعة</TableHead>
                          <TableHead className="whitespace-nowrap">الأستاذ</TableHead>
                          <TableHead className="text-center whitespace-nowrap">الساعات المطلوبة</TableHead>
                          <TableHead className="text-center whitespace-nowrap">المجدولة</TableHead>
                          <TableHead className="text-center whitespace-nowrap">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectAllocationData.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium whitespace-nowrap">{s.subjectName}</TableCell>
                            <TableCell className="whitespace-nowrap">{s.groupName}</TableCell>
                            <TableCell className="whitespace-nowrap">{s.professorName}</TableCell>
                            <TableCell className="text-center">{s.requiredHours}</TableCell>
                            <TableCell className="text-center">{s.allocatedHours}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={s.isFullyScheduled ? 'default' : 'destructive'}>
                                {s.isFullyScheduled ? 'مكتمل' : `ناقص ${s.deficit}`}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    التعارضات ({conflictsData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conflictsData.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">🎉 لا توجد تعارضات! الجدول سليم.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>النوع</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>اليوم</TableHead>
                          <TableHead>الوقت</TableHead>
                          <TableHead>المواد المتعارضة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conflictsData.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Badge variant="destructive">
                                {c.type === 'professor' ? 'أستاذ' : 'قاعة'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{c.entityName}</TableCell>
                            <TableCell>{DAY_LABELS[c.day as keyof typeof DAY_LABELS] || c.day}</TableCell>
                            <TableCell dir="ltr">{c.time}</TableCell>
                            <TableCell className="text-xs">{c.subjects.join('، ')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الفجوات الزمنية الطويلة ({gapsData.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {gapsData.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">لا توجد فجوات زمنية طويلة.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الدفعة</TableHead>
                          <TableHead>اليوم</TableHead>
                          <TableHead>عدد الفترات الفارغة</TableHead>
                          <TableHead>من</TableHead>
                          <TableHead>إلى</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gapsData.map((g, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{g.groupName}</TableCell>
                            <TableCell>{DAY_LABELS[g.day as keyof typeof DAY_LABELS] || g.day}</TableCell>
                            <TableCell><Badge variant="secondary">{g.gapSize}</Badge></TableCell>
                            <TableCell dir="ltr">{g.fromTime}</TableCell>
                            <TableCell dir="ltr">{g.toTime}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
