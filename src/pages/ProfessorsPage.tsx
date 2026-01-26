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
import { useProfessors, useCreateProfessor, useUpdateProfessor, useDeleteProfessor } from '@/hooks/useProfessors';
import { Plus, Pencil, Trash2, CalendarOff, GraduationCap, AlertTriangle, User } from 'lucide-react';
import { ProfessorUnavailabilityDialog } from '@/components/ProfessorUnavailabilityDialog';
import { cn } from '@/lib/utils';
import { useIsActiveSubscription } from '@/hooks/useSubscription';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';

export default function ProfessorsPage() {
  const { isActive: isActiveSubscription } = useIsActiveSubscription();
  const { data: professors, isLoading } = useProfessors();
  const createProfessor = useCreateProfessor();
  const updateProfessor = useUpdateProfessor();
  const deleteProfessor = useDeleteProfessor();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<{ id: string; name: string } | null>(null);
  const [deletingProfessor, setDeletingProfessor] = useState<{ id: string; name: string } | null>(null);
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

  const handleDelete = async () => {
    if (!deletingProfessor) return;
    await deleteProfessor.mutateAsync(deletingProfessor.id);
    setDeletingProfessor(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة الدكاترة</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف أعضاء هيئة التدريس</p>
          </div>
          {isActiveSubscription && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/25">
                  <Plus className="h-4 w-4" />
                  إضافة دكتور
                </Button>
              </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle>إضافة دكتور جديد</DialogTitle>
                    <DialogDescription>أدخل اسم الدكتور الجديد</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الدكتور</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="مثال: د. أحمد محمد"
                    className="text-right"
                  />
                </div>
                <Button onClick={handleAdd} disabled={createProfessor.isPending || !newName.trim()} className="w-full">
                  {createProfessor.isPending ? 'جاري الإضافة...' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Summary Card */}
        <Card className="border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50">
                <GraduationCap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الدكاترة</p>
                <p className="text-2xl font-bold">{professors?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professors Table */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>قائمة الدكاترة</CardTitle>
            <CardDescription>جميع أعضاء هيئة التدريس المسجلين في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
              </div>
            ) : professors?.length === 0 ? (
              <div className="empty-state">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <GraduationCap className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium">لا يوجد دكاترة بعد</p>
                <p className="text-sm text-muted-foreground">ابدأ بإضافة أعضاء هيئة التدريس</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>الاسم</TableHead>
                    <TableHead className="w-[180px]">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professors?.map((professor) => (
                    <TableRow key={professor.id} className="table-row-hover">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50">
                            <User className="h-4 w-4 text-emerald-500" />
                          </div>
                          {professor.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button text-warning hover:text-warning"
                            onClick={() => setUnavailabilityProfessor({ id: professor.id, name: professor.name })}
                            title="أوقات عدم التوفر"
                            disabled={!isActiveSubscription}
                          >
                            <CalendarOff className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button"
                            onClick={() => setEditingProfessor({ id: professor.id, name: professor.name })}
                            disabled={!isActiveSubscription}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="icon-button text-destructive hover:text-destructive"
                            onClick={() => setDeletingProfessor({ id: professor.id, name: professor.name })}
                            disabled={!isActiveSubscription}
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
        <Dialog open={!!editingProfessor} onOpenChange={() => setEditingProfessor(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pencil className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>تعديل الدكتور</DialogTitle>
                  <DialogDescription>قم بتحديث بيانات الدكتور</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {editingProfessor && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">اسم الدكتور</Label>
                  <Input
                    id="edit-name"
                    value={editingProfessor.name}
                    onChange={(e) => setEditingProfessor({ ...editingProfessor, name: e.target.value })}
                    className="text-right"
                  />
                </div>
                <Button onClick={handleUpdate} disabled={updateProfessor.isPending} className="w-full">
                  {updateProfessor.isPending ? 'جاري التحديث...' : 'تحديث'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingProfessor} onOpenChange={() => setDeletingProfessor(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <DialogTitle>تأكيد الحذف</DialogTitle>
                  <DialogDescription>هل أنت متأكد من حذف هذا الدكتور؟</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            {deletingProfessor && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <p className="text-sm text-center">
                    سيتم حذف الدكتور <span className="font-bold">{deletingProfessor.name}</span> نهائياً
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingProfessor(null)} className="flex-1">
                    إلغاء
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteProfessor.isPending} className="flex-1">
                    {deleteProfessor.isPending ? 'جاري الحذف...' : 'حذف'}
                  </Button>
                </div>
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
