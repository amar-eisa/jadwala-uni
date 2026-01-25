import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTimeSlots, useCreateTimeSlot, useUpdateTimeSlot, useDeleteTimeSlot } from '@/hooks/useTimeSlots';
import { DayOfWeek, DAY_LABELS } from '@/types/database';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const DAYS: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function TimeSlotsPage() {
  const { data: timeSlots, isLoading } = useTimeSlots();
  const createTimeSlot = useCreateTimeSlot();
  const updateTimeSlot = useUpdateTimeSlot();
  const deleteTimeSlot = useDeleteTimeSlot();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{ 
    id: string; 
    day: DayOfWeek; 
    start_time: string; 
    end_time: string 
  } | null>(null);
  const [newSlot, setNewSlot] = useState({ 
    day: 'sunday' as DayOfWeek, 
    start_time: '08:00', 
    end_time: '09:00' 
  });

  const handleAdd = async () => {
    await createTimeSlot.mutateAsync(newSlot);
    setNewSlot({ day: 'sunday', start_time: '08:00', end_time: '09:00' });
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingSlot) return;
    await updateTimeSlot.mutateAsync(editingSlot);
    setEditingSlot(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفترة الزمنية؟')) {
      await deleteTimeSlot.mutateAsync(id);
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة الفترات الزمنية</h1>
            <p className="text-muted-foreground mt-1">تحديد أوقات المحاضرات المتاحة</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة فترة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة فترة زمنية جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اليوم</Label>
                  <Select
                    value={newSlot.day}
                    onValueChange={(value: DayOfWeek) => setNewSlot({ ...newSlot, day: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {DAY_LABELS[day]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">وقت البداية</Label>
                    <Input
                      id="start"
                      type="time"
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">وقت النهاية</Label>
                    <Input
                      id="end"
                      type="time"
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAdd} disabled={createTimeSlot.isPending} className="w-full">
                  {createTimeSlot.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الفترات الزمنية</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4">جاري التحميل...</p>
            ) : timeSlots?.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">لا توجد فترات زمنية بعد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اليوم</TableHead>
                    <TableHead>وقت البداية</TableHead>
                    <TableHead>وقت النهاية</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots?.map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="font-medium">{DAY_LABELS[slot.day]}</TableCell>
                      <TableCell>{formatTime(slot.start_time)}</TableCell>
                      <TableCell>{formatTime(slot.end_time)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSlot({ 
                              id: slot.id, 
                              day: slot.day,
                              start_time: formatTime(slot.start_time),
                              end_time: formatTime(slot.end_time)
                            })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(slot.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل الفترة الزمنية</DialogTitle>
            </DialogHeader>
            {editingSlot && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اليوم</Label>
                  <Select
                    value={editingSlot.day}
                    onValueChange={(value: DayOfWeek) => setEditingSlot({ ...editingSlot, day: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {DAY_LABELS[day]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>وقت البداية</Label>
                    <Input
                      type="time"
                      value={editingSlot.start_time}
                      onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت النهاية</Label>
                    <Input
                      type="time"
                      value={editingSlot.end_time}
                      onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleUpdate} disabled={updateTimeSlot.isPending} className="w-full">
                  {updateTimeSlot.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
