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
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms';
import { RoomType, ROOM_TYPE_LABELS } from '@/types/database';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function RoomsPage() {
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string; type: RoomType } | null>(null);
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

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه القاعة؟')) {
      await deleteRoom.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة القاعات</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف القاعات والمعامل</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة قاعة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة قاعة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم القاعة</Label>
                  <Input
                    id="name"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="مثال: قاعة 101"
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
                      <SelectItem value="lecture">قاعة محاضرات</SelectItem>
                      <SelectItem value="lab">معمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={createRoom.isPending} className="w-full">
                  {createRoom.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة القاعات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4">جاري التحميل...</p>
            ) : rooms?.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">لا توجد قاعات بعد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms?.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>{ROOM_TYPE_LABELS[room.type]}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRoom({ id: room.id, name: room.name, type: room.type })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(room.id)}
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
        <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل القاعة</DialogTitle>
            </DialogHeader>
            {editingRoom && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم القاعة</Label>
                  <Input
                    id="edit-name"
                    value={editingRoom.name}
                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
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
                      <SelectItem value="lecture">قاعة محاضرات</SelectItem>
                      <SelectItem value="lab">معمل</SelectItem>
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
      </div>
    </Layout>
  );
}
