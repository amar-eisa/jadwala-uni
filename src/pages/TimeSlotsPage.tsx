import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Trash2, Clock, Calendar, Settings } from 'lucide-react';

const DAYS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

export default function TimeSlotsPage() {
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
    
    // Create time slot for all selected days
    for (const day of selectedDays) {
      await createTimeSlot.mutateAsync({
        day,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time
      });
    }
    
    setNewSlot({ name: '', start_time: '', end_time: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفترة الزمنية؟')) {
      await deleteTimeSlot.mutateAsync(id);
    }
  };

  const handleRestoreDefaults = () => {
    setSelectedDays(['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
    setBreakDuration(5);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Get unique time ranges (regardless of day)
  const uniqueTimeRanges = timeSlots?.reduce((acc, slot) => {
    const key = `${slot.start_time}-${slot.end_time}`;
    if (!acc.find(s => `${s.start_time}-${s.end_time}` === key)) {
      acc.push(slot);
    }
    return acc;
  }, [] as typeof timeSlots) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفترات الزمنية</h1>
          <p className="text-muted-foreground mt-1">تحديد أوقات المحاضرات المتاحة</p>
        </div>

        {/* Top Section - Days & Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Days Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Calendar className="h-5 w-5" />
                <CardTitle>أيام العمل</CardTitle>
              </div>
              <CardDescription>حدد الأيام التي تُعقد فيها المحاضرات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-2 justify-end">
                    <Label htmlFor={day} className="cursor-pointer">
                      {DAY_LABELS[day]}
                    </Label>
                    <Checkbox
                      id={day}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                  </div>
                ))}
              </div>
              <div className="text-center text-sm text-primary font-medium pt-2 border-t">
                الأيام المحددة: {selectedDays.length} أيام
              </div>
            </CardContent>
          </Card>

          {/* General Settings Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Settings className="h-5 w-5" />
                <CardTitle>إعدادات عامة</CardTitle>
              </div>
              <CardDescription>إعدادات إضافية للجدولة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="break" className="text-right block">
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
                />
              </div>
              <div className="text-center text-sm text-primary font-medium py-2 bg-muted/50 rounded-md">
                إجمالي الفترات: {uniqueTimeRanges.length} فترات
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRestoreDefaults}
              >
                استعادة الإعدادات الافتراضية
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Time Slots Section */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <CardTitle>الفترات الزمنية للمحاضرات</CardTitle>
            </div>
            <CardDescription>حدد أوقات بداية ونهاية كل فترة محاضرة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Slot Form */}
            <div className="space-y-3">
              <h3 className="text-center font-semibold">إضافة فترة جديدة</h3>
              <div className="flex flex-col sm:flex-row items-center gap-3" dir="rtl">
                <div className="flex-1 w-full">
                  <Input
                    placeholder="مثال: الفترة الخامسة"
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
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm">إلى</span>
                  <div className="flex-1 sm:flex-none">
                    <div className="relative">
                      <Input
                        type="time"
                        value={newSlot.end_time}
                        onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                        className="pl-8"
                      />
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleAddSlot} 
                  disabled={createTimeSlot.isPending || !newSlot.start_time || !newSlot.end_time}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة
                </Button>
              </div>
            </div>

            {/* Existing Slots Table */}
            <div className="border rounded-lg">
              {isLoading ? (
                <p className="text-center py-8">جاري التحميل...</p>
              ) : uniqueTimeRanges.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">لا توجد فترات زمنية بعد</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-center">وقت البداية</TableHead>
                      <TableHead className="text-center">وقت النهاية</TableHead>
                      <TableHead className="text-center">المدة</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
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
                        <TableRow key={slot.id}>
                          <TableCell className="font-medium text-right">
                            الفترة {index + 1}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatTime(slot.start_time)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatTime(slot.end_time)}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {durationMinutes} دقيقة
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(slot.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
