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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProfessors, useCreateProfessor, useUpdateProfessor, useDeleteProfessor } from '@/hooks/useProfessors';
import { Plus, Pencil, Trash2, CalendarOff } from 'lucide-react';
import { ProfessorUnavailabilityDialog } from '@/components/ProfessorUnavailabilityDialog';

export default function ProfessorsPage() {
  const { data: professors, isLoading } = useProfessors();
  const createProfessor = useCreateProfessor();
  const updateProfessor = useUpdateProfessor();
  const deleteProfessor = useDeleteProfessor();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<{ id: string; name: string } | null>(null);
  const [unavailabilityProfessor, setUnavailabilityProfessor] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await createProfessor.mutateAsync({ name: newName });
    setNewName('');
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingProfessor || !editingProfessor.name.trim()) return;
    await updateProfessor.mutateAsync(editingProfessor);
    setEditingProfessor(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدكتور؟')) {
      await deleteProfessor.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة الدكاترة</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف أعضاء هيئة التدريس</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة دكتور
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة دكتور جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الدكتور</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: د. أحمد محمد"
                  />
                </div>
                <Button onClick={handleAdd} disabled={createProfessor.isPending} className="w-full">
                  {createProfessor.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الدكاترة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-4">جاري التحميل...</p>
            ) : professors?.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">لا يوجد دكاترة بعد</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead className="w-[150px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professors?.map((professor) => (
                    <TableRow key={professor.id}>
                      <TableCell className="font-medium">{professor.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUnavailabilityProfessor({ id: professor.id, name: professor.name })}
                            title="أوقات عدم التوفر"
                          >
                            <CalendarOff className="h-4 w-4 text-orange-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProfessor({ id: professor.id, name: professor.name })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(professor.id)}
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
        <Dialog open={!!editingProfessor} onOpenChange={() => setEditingProfessor(null)}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل الدكتور</DialogTitle>
            </DialogHeader>
            {editingProfessor && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم الدكتور</Label>
                  <Input
                    id="edit-name"
                    value={editingProfessor.name}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, name: e.target.value })}
                  />
                </div>
                <Button onClick={handleUpdate} disabled={updateProfessor.isPending} className="w-full">
                  {updateProfessor.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Unavailability Dialog */}
        <ProfessorUnavailabilityDialog
          professor={unavailabilityProfessor}
          onClose={() => setUnavailabilityProfessor(null)}
        />
      </div>
    </Layout>
  );
}
