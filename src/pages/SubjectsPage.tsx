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
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function SubjectsPage() {
  const { data: subjects, isLoading } = useSubjects();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{ 
    id: string; 
    name: string; 
    professor_id: string; 
    group_id: string 
  } | null>(null);
  const [newSubject, setNewSubject] = useState({ 
    name: '', 
    professor_id: '', 
    group_id: '' 
  });

  const handleAdd = async () => {
    if (!newSubject.name.trim() || !newSubject.professor_id || !newSubject.group_id) return;
    await createSubject.mutateAsync(newSubject);
    setNewSubject({ name: '', professor_id: '', group_id: '' });
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingSubject || !editingSubject.name.trim()) return;
    await updateSubject.mutateAsync(editingSubject);
    setEditingSubject(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المادة؟')) {
      await deleteSubject.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة المواد</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف المواد الدراسية</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button disabled={!professors?.length || !groups?.length}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مادة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مادة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المادة</Label>
                  <Input
                    id="name"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="مثال: البرمجة المتقدمة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الدكتور</Label>
                  <Select
                    value={newSubject.professor_id}
                    onValueChange={(value) => setNewSubject({ ...newSubject, professor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدكتور" />
                    </SelectTrigger>
                    <SelectContent>
                      {professors?.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المجموعة</Label>
                  <Select
                    value={newSubject.group_id}
                    onValueChange={(value) => setNewSubject({ ...newSubject, group_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المجموعة" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={createSubject.isPending} className="w-full">
                  {createSubject.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!professors?.length || !groups?.length) && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                يجب إضافة دكاترة ومجموعات أولاً قبل إضافة المواد
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>قائمة المواد</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4">جاري التحميل...</p>
            ) : subjects?.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">لا توجد مواد بعد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الدكتور</TableHead>
                    <TableHead>المجموعة</TableHead>
                    <TableHead className="w-[100px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects?.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-mono text-sm">{subject.code}</TableCell>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.professor?.name}</TableCell>
                      <TableCell>{subject.group?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSubject({ 
                              id: subject.id, 
                              name: subject.name,
                              professor_id: subject.professor_id,
                              group_id: subject.group_id
                            })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(subject.id)}
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
        <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المادة</DialogTitle>
            </DialogHeader>
            {editingSubject && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم المادة</Label>
                  <Input
                    id="edit-name"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الدكتور</Label>
                  <Select
                    value={editingSubject.professor_id}
                    onValueChange={(value) => setEditingSubject({ ...editingSubject, professor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {professors?.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المجموعة</Label>
                  <Select
                    value={editingSubject.group_id}
                    onValueChange={(value) => setEditingSubject({ ...editingSubject, group_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdate} disabled={updateSubject.isPending} className="w-full">
                  {updateSubject.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
