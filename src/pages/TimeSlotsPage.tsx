import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTimeSlots, useCreateTimeSlot, useDeleteTimeSlot } from '@/hooks/useTimeSlots';
import { DayOfWeek, DAY_LABELS } from '@/types/database';
import { Plus, Trash2, Clock, Calendar, Settings, RotateCcw, Loader2 } from 'lucide-react';
import { TimeSlot } from '@/types/database';
import { cn } from '@/lib/utils';
import { useIsActiveSubscription } from '@/hooks/useSubscription';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';

const DAYS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export default function TimeSlotsPage() {
  const { isActive: isActiveSubscription } = useIsActiveSubscription();
  const { data: timeSlots, isLoading } = useTimeSlots();
  const createTimeSlot = useCreateTimeSlot();
  const deleteTimeSlot = useDeleteTimeSlot();

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
  const [breakDuration, setBreakDuration] = useState(5);
  const [newSlot, setNewSlot] = useState({ 
    name: '',
    start_time: '', 
    end_time: '' 
  });

  const handleDayToggle = (day: DayOfWeek) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleAddSlot = async () => {
    if (!newSlot.start_time || !newSlot.end_time) return;
    
    for (const day of selectedDays) {
      await createTimeSlot.mutateAsync({
        day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time
      });
    }
    
    setNewSlot({ name: '', start_time: '', end_time: '' });
  };

  const handleDelete = async (slot: TimeSlot) => {
    const daysCount = timeSlots?.filter(
      s => s.start_time === slot.start_time && s.end_time === slot.end_time
    ).length || 0;
    
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف هذه الفترة؟\nسيتم حذفها من ${daysCount} يوم/أيام`
    );
    
    if (confirmed) {
      await deleteTimeSlot.mutateAsync({
        start_time: slot.start_time,
        end_time: slot.end_time
      });
    }
  };

  const handleRestoreDefaults = () => {
    setSelectedDays(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
    setBreakDuration(5);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const uniqueTimeRanges = timeSlots?.reduce((acc, slot) => {
    const key = `${slot.start_time}-${slot.end_time}`;
    if (!acc.find(s => `${s.start_time}-${s.end_time}` === key)) {
      acc.push(slot);
    }
    return acc;
  }, [] as typeof timeSlots) || [];

  // حساب عدد الأيام لكل فترة زمنية
  const getSlotDaysCount = (slot: TimeSlot) => {
    return timeSlots?.filter(
      s => s.start_time === slot.start_time && s.end_time === slot.end_time
    ).length || 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">إدارة الفترات الزمنية</h1>
          <p className="text-muted-foreground mt-1">تحديد أوقات المحاضرات المتاحة</p>
        </div>

        {/* Top Section - Days & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work Days Card */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>أيام العمل</CardTitle>
                  <CardDescription>حدد الأيام التي تُعقد فيها المحاضرات</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                        !isActiveSubscription && "opacity-50 cursor-not-allowed",
                        isActiveSubscription && "cursor-pointer",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-muted hover:border-muted-foreground/30"
                      )}
                      onClick={() => isActiveSubscription && handleDayToggle(day)}
                    >
                      <Checkbox
                        id={day}
                        checked={isSelected}
                        onCheckedChange={() => handleDayToggle(day)}
                        className="pointer-events-none"
                        disabled={!isActiveSubscription}
                      />
                      <Label htmlFor={day} className="cursor-pointer flex-1">
                        {DAY_LABELS[day]}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">الأيام المحددة</span>
                <Badge variant="secondary" className="font-bold">
                  {selectedDays.length} أيام
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* General Settings Card */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Settings className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <CardTitle>إعدادات عامة</CardTitle>
                  <CardDescription>إعدادات إضافية للجدولة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="break">
                  مدة الاستراحة بين المحاضرات (بالدقائق)
                </Label>
                <Input
                  id="break"
                  type="number"
                  min={0}
                  max={60}
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="text-center"
                  disabled={!isActiveSubscription}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-sm text-muted-foreground">إجمالي الفترات</span>
                <Badge className="bg-primary font-bold">
                  {uniqueTimeRanges.length} فترات
                </Badge>
              </div>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleRestoreDefaults}
                disabled={!isActiveSubscription}
              >
                <RotateCcw className="h-4 w-4" />
                استعادة الإعدادات الافتراضية
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Time Slots Section */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50">
                <Clock className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <CardTitle>الفترات الزمنية للمحاضرات</CardTitle>
                <CardDescription>حدد أوقات بداية ونهاية كل فترة محاضرة</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Slot Form */}
            {isActiveSubscription && (
              <div className="p-4 bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20">
                <h3 className="text-sm font-semibold mb-4 text-center">إضافة فترة جديدة</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3" dir="rtl">
                  <div className="flex-1 w-full">
                    <Input
                      placeholder="مثال: الفترة الخامسة (اختياري)"
                      value={newSlot.name}
                      onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })}
                      className="text-right"
                    />
                  </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none">
                    <div className="relative">
                      <Input
                        type="time"
                        value={newSlot.start_time}
                        onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                        className="pl-10"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">إلى</span>
                  <div className="flex-1 sm:flex-none">
                    <div className="relative">
                      <Input
                        type="time"
                        value={newSlot.end_time}
                        onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                        className="pl-10"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleAddSlot} 
                  disabled={createTimeSlot.isPending || !newSlot.start_time || !newSlot.end_time}
                  className="w-full sm:w-auto gap-2"
                >
                  <Plus className="h-4 w-4" />
                    إضافة
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Slots Table */}
            <div className="border rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
                </div>
              ) : uniqueTimeRanges.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="font-medium">لا توجد فترات زمنية بعد</p>
                  <p className="text-sm text-muted-foreground">ابدأ بإضافة الفترات الزمنية للمحاضرات</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/50">
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-center">وقت البداية</TableHead>
                      <TableHead className="text-center">وقت النهاية</TableHead>
                      <TableHead className="text-center">المدة</TableHead>
                      <TableHead className="text-center">الأيام</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueTimeRanges.map((slot, index) => {
                      const startParts = slot.start_time.split(':');
                      const endParts = slot.end_time.split(':');
                      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                      const durationMinutes = endMinutes - startMinutes;
                      
                      return (
                        <TableRow key={slot.id} className="table-row-hover">
                          <TableCell className="font-medium text-right">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {index + 1}
                              </div>
                              الفترة {index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono text-sm">
                              {formatTime(slot.start_time)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="font-mono text-sm">
                              {formatTime(slot.end_time)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-muted-foreground text-sm">
                              {durationMinutes} دقيقة
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {getSlotDaysCount(slot)} أيام
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="icon-button text-destructive hover:text-destructive"
                              onClick={() => handleDelete(slot)}
                              disabled={deleteTimeSlot.isPending || !isActiveSubscription}
                            >
                              {deleteTimeSlot.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
