import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms';
import { RoomType, ROOM_TYPE_LABELS } from '@/types/database';
import { Plus, Pencil, Trash2, DoorOpen, FlaskConical, Presentation, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoomsPage() {
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string; type: RoomType } | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<{ id: string; name: string } | null>(null);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'lecture' as RoomType });

  const handleAdd = async () => {
    if (!newRoom.name.trim()) return;
    await createRoom.mutateAsync(newRoom);
    setNewRoom({ name: '', type: 'lecture' });
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingRoom || !editingRoom.name.trim()) return;
    await updateRoom.mutateAsync(editingRoom);
    setEditingRoom(null);
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;
    await deleteRoom.mutateAsync(deletingRoom.id);
    setDeletingRoom(null);
  };

  const lectureCount = rooms?.filter(r => r.type === 'lecture').length || 0;
  const labCount = rooms?.filter(r => r.type === 'lab').length || 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة القاعات</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف القاعات والمعامل</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/25">
                <Plus className="h-4 w-4" />
                إضافة قاعة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DoorOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>إضافة قاعة جديدة</DialogTitle>
                    <DialogDescription>أدخل بيانات القاعة أو المعمل</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم القاعة</Label>
                  <Input
                    id="name"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="مثال: قاعة 101"
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">نوع القاعة</Label>
                  <Select
                    value={newRoom.type}
                    onValueChange={(value: RoomType) => setNewRoom({ ...newRoom, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">
                        <div className="flex items-center gap-2">
                          <Presentation className="h-4 w-4 text-blue-500" />
                          قاعة محاضرات
                        </div>
                      </SelectItem>
                      <SelectItem value="lab">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="h-4 w-4 text-emerald-500" />
                          معمل
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={createRoom.isPending || !newRoom.name.trim()} className="w-full">
                  {createRoom.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <DoorOpen className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي القاعات</p>
                  <p className="text-2xl font-bold">{rooms?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Presentation className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قاعات محاضرات</p>
                  <p className="text-2xl font-bold">{lectureCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-50">
                  <FlaskConical className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">معامل</p>
                  <p className="text-2xl font-bold">{labCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>قائمة القاعات</CardTitle>
            <CardDescription>جميع القاعات والمعامل المسجلة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
              </div>
            ) : rooms?.length === 0 ? (
              <div className="empty-state">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <DoorOpen className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium">لا توجد قاعات بعد</p>
                <p className="text-sm text-muted-foreground">ابدأ بإضافة القاعات والمعامل</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms?.map((room, index) => (
                    <TableRow key={room.id} className="table-row-hover">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            room.type === 'lecture' ? 'bg-blue-50' : 'bg-emerald-50'
                          )}>
                            {room.type === 'lecture' ? (
                              <Presentation className="h-4 w-4 text-blue-500" />
                            ) : (
                              <FlaskConical className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          {room.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "font-medium",
                          room.type === 'lecture' ? 'badge-lecture' : 'badge-lab'
                        )}>
                          {ROOM_TYPE_LABELS[room.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button"
                            onClick={() => setEditingRoom({ id: room.id, name: room.name, type: room.type })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button text-destructive hover:text-destructive"
                            onClick={() => setDeletingRoom({ id: room.id, name: room.name })}
                          >
                            <Trash2 className="h-4 w-4" />
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
        <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>تعديل القاعة</DialogTitle>
                  <DialogDescription>قم بتحديث بيانات القاعة</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editingRoom && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم القاعة</Label>
                  <Input
                    id="edit-name"
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">نوع القاعة</Label>
                  <Select
                    value={editingRoom.type}
                    onValueChange={(value: RoomType) => setEditingRoom({ ...editingRoom, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">
                        <div className="flex items-center gap-2">
                          <Presentation className="h-4 w-4 text-blue-500" />
                          قاعة محاضرات
                        </div>
                      </SelectItem>
                      <SelectItem value="lab">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="h-4 w-4 text-emerald-500" />
                          معمل
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdate} disabled={updateRoom.isPending} className="w-full">
                  {updateRoom.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingRoom} onOpenChange={() => setDeletingRoom(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <DialogTitle>تأكيد الحذف</DialogTitle>
                  <DialogDescription>هل أنت متأكد من حذف هذه القاعة؟</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {deletingRoom && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="text-sm text-center">
                    سيتم حذف القاعة <span className="font-bold">{deletingRoom.name}</span> نهائياً
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingRoom(null)} className="flex-1">
                    إلغاء
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteRoom.isPending} className="flex-1">
                    {deleteRoom.isPending ? 'جاري الحذف...' : 'حذف'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
