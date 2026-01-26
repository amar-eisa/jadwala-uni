import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStudentGroups, useCreateStudentGroup, useUpdateStudentGroup, useDeleteStudentGroup } from '@/hooks/useStudentGroups';
import { Plus, Pencil, Trash2, Users, AlertTriangle, UserCircle } from 'lucide-react';

export default function GroupsPage() {
  const { data: groups, isLoading } = useStudentGroups();
  const createGroup = useCreateStudentGroup();
  const updateGroup = useUpdateStudentGroup();
  const deleteGroup = useDeleteStudentGroup();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createGroup.mutateAsync({ name: newName });
    setNewName('');
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingGroup || !editingGroup.name.trim()) return;
    await updateGroup.mutateAsync(editingGroup);
    setEditingGroup(null);
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    await deleteGroup.mutateAsync(deletingGroup.id);
    setDeletingGroup(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة المجموعات</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف مجموعات الطلاب</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/25">
                <Plus className="h-4 w-4" />
                إضافة مجموعة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>إضافة مجموعة جديدة</DialogTitle>
                    <DialogDescription>أدخل اسم مجموعة الطلاب</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المجموعة</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: المستوى الأول - شعبة أ"
                    className="text-right"
                  />
                </div>
                <Button onClick={handleAdd} disabled={createGroup.isPending || !newName.trim()} className="w-full">
                  {createGroup.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-violet-50">
                <Users className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المجموعات</p>
                <p className="text-2xl font-bold">{groups?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>قائمة المجموعات</CardTitle>
            <CardDescription>جميع مجموعات الطلاب المسجلة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
              </div>
            ) : groups?.length === 0 ? (
              <div className="empty-state">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium">لا توجد مجموعات بعد</p>
                <p className="text-sm text-muted-foreground">ابدأ بإضافة مجموعات الطلاب</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>الاسم</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups?.map((group) => (
                    <TableRow key={group.id} className="table-row-hover">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-violet-50">
                            <UserCircle className="h-4 w-4 text-violet-500" />
                          </div>
                          {group.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button"
                            onClick={() => setEditingGroup({ id: group.id, name: group.name })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button text-destructive hover:text-destructive"
                            onClick={() => setDeletingGroup({ id: group.id, name: group.name })}
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
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>تعديل المجموعة</DialogTitle>
                  <DialogDescription>قم بتحديث اسم المجموعة</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editingGroup && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم المجموعة</Label>
                  <Input
                    id="edit-name"
                    value={editingGroup.name}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    className="text-right"
                  />
                </div>
                <Button onClick={handleUpdate} disabled={updateGroup.isPending} className="w-full">
                  {updateGroup.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingGroup} onOpenChange={() => setDeletingGroup(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <DialogTitle>تأكيد الحذف</DialogTitle>
                  <DialogDescription>هل أنت متأكد من حذف هذه المجموعة؟</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {deletingGroup && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="text-sm text-center">
                    سيتم حذف المجموعة <span className="font-bold">{deletingGroup.name}</span> نهائياً
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingGroup(null)} className="flex-1">
                    إلغاء
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteGroup.isPending} className="flex-1">
                    {deleteGroup.isPending ? 'جاري الحذف...' : 'حذف'}
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
