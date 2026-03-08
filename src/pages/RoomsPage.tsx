import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '@/hooks/useRooms';
import { RoomType, ROOM_TYPE_LABELS } from '@/types/database';
import { Plus, Pencil, Trash2, DoorOpen, FlaskConical, Presentation, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyStateIllustration } from '@/components/ui/empty-state-illustration';
import { SearchInput } from '@/components/SearchInput';
import { useIsActiveSubscription } from '@/hooks/useSubscription';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
};

export default function RoomsPage() {
  const { isActive: isActiveSubscription } = useIsActiveSubscription();
  const { data: rooms, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<{ id: string; name: string; type: RoomType } | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<{ id: string; name: string } | null>(null);
  const [newRoom, setNewRoom] = useState({ name: '', type: 'lecture' as RoomType });
  const [search, setSearch] = useState('');

  const filteredRooms = rooms?.filter(room => {
    if (!search) return true;
    const s = search.toLowerCase();
    return room.name.toLowerCase().includes(s) || ROOM_TYPE_LABELS[room.type].includes(s);
  });

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
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <SubscriptionBanner />

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة القاعات</h1>
            <p className="text-muted-foreground mt-1 text-sm">إضافة وتعديل وحذف القاعات والمعامل</p>
          </div>
          {isActiveSubscription && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-2xl shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  إضافة قاعة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
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
                    <Input id="name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="مثال: قاعة 101" className="text-right rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">نوع القاعة</Label>
                    <Select value={newRoom.type} onValueChange={(value: RoomType) => setNewRoom({ ...newRoom, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture"><div className="flex items-center gap-2"><Presentation className="h-4 w-4 text-primary" />قاعة محاضرات</div></SelectItem>
                        <SelectItem value="lab"><div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-success" />معمل</div></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAdd} disabled={createRoom.isPending || !newRoom.name.trim()} className="w-full rounded-xl">
                    {createRoom.isPending ? 'جاري الإضافة...' : 'إضافة'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'إجمالي القاعات', value: rooms?.length || 0, iconBg: 'bg-primary/10', iconColor: 'text-primary', Icon: DoorOpen },
            { label: 'قاعات محاضرات', value: lectureCount, iconBg: 'bg-[hsl(197,80%,55%)/0.1]', iconColor: 'text-[hsl(197,80%,48%)]', Icon: Presentation },
            { label: 'معامل', value: labCount, iconBg: 'bg-success/10', iconColor: 'text-success', Icon: FlaskConical },
          ].map((s, i) => (
            <motion.div key={s.label} whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Card className="card-glass border-0">
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
            </motion.div>
          ))}
        </motion.div>

        {/* Rooms Table */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">قائمة القاعات</CardTitle>
                  <CardDescription className="text-xs">جميع القاعات والمعامل المسجلة في النظام</CardDescription>
                </div>
                <div className="w-full sm:w-64">
                  <SearchInput value={search} onChange={setSearch} placeholder="بحث في القاعات..." />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton-row">
                      <div className="skeleton-circle" />
                      <div className="skeleton-line-medium flex-1" />
                      <div className="skeleton-line-short" />
                    </div>
                  ))}
                </div>
              ) : filteredRooms?.length === 0 ? (
                <EmptyStateIllustration
                  type="rooms"
                  title={search ? "لا توجد نتائج مطابقة" : "لا توجد قاعات بعد"}
                  description={search ? "جرّب تغيير كلمة البحث" : "ابدأ بإضافة القاعات والمعامل لتنظيم جداولك الدراسية"}
                />
              ) : (
                <div className="overflow-x-auto table-enhanced">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead className="w-[100px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRooms?.map((room, index) => (
                        <TableRow key={room.id}>
                          <TableCell><div className="row-number">{index + 1}</div></TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", room.type === 'lecture' ? 'bg-primary/10' : 'bg-success/10')}>
                                {room.type === 'lecture' ? <Presentation className="h-4 w-4 text-primary" /> : <FlaskConical className="h-4 w-4 text-success" />}
                              </div>
                              {room.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("font-medium rounded-xl", room.type === 'lecture' ? 'badge-lecture' : 'badge-lab')}>
                              {ROOM_TYPE_LABELS[room.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="icon-button" onClick={() => setEditingRoom({ id: room.id, name: room.name, type: room.type })} disabled={!isActiveSubscription}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="icon-button text-destructive hover:text-destructive" onClick={() => setDeletingRoom({ id: room.id, name: room.name })} disabled={!isActiveSubscription}><Trash2 className="h-4 w-4" /></Button>
                            </div>
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

        {/* Edit Dialog */}
        <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Pencil className="h-5 w-5 text-primary" /></div>
                <div><DialogTitle>تعديل القاعة</DialogTitle><DialogDescription>قم بتحديث بيانات القاعة</DialogDescription></div>
              </div>
            </DialogHeader>
            {editingRoom && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label htmlFor="edit-name">اسم القاعة</Label><Input id="edit-name" value={editingRoom.name} onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })} className="text-right rounded-xl" /></div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">نوع القاعة</Label>
                  <Select value={editingRoom.type} onValueChange={(value: RoomType) => setEditingRoom({ ...editingRoom, type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture"><div className="flex items-center gap-2"><Presentation className="h-4 w-4 text-primary" />قاعة محاضرات</div></SelectItem>
                      <SelectItem value="lab"><div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-success" />معمل</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdate} disabled={updateRoom.isPending} className="w-full rounded-xl">{updateRoom.isPending ? 'جاري التحديث...' : 'تحديث'}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingRoom} onOpenChange={() => setDeletingRoom(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <div><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>هل أنت متأكد من حذف هذه القاعة؟</DialogDescription></div>
              </div>
            </DialogHeader>
            {deletingRoom && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20"><p className="text-sm text-center">سيتم حذف القاعة <span className="font-bold">{deletingRoom.name}</span> نهائياً</p></div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingRoom(null)} className="flex-1 rounded-xl">إلغاء</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteRoom.isPending} className="flex-1 rounded-xl">{deleteRoom.isPending ? 'جاري الحذف...' : 'حذف'}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </Layout>
  );
}
