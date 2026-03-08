import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { useProfessors, useCreateProfessor, useUpdateProfessor, useDeleteProfessor } from '@/hooks/useProfessors';
import { Plus, Pencil, Trash2, CalendarOff, GraduationCap, AlertTriangle, User } from 'lucide-react';
import { ProfessorUnavailabilityDialog } from '@/components/ProfessorUnavailabilityDialog';
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
  const [search, setSearch] = useState('');

  const filteredProfessors = professors?.filter(p => {
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

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
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <SubscriptionBanner />

        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة الدكاترة</h1>
            <p className="text-muted-foreground mt-1 text-sm">إضافة وتعديل وحذف أعضاء هيئة التدريس</p>
          </div>
          {isActiveSubscription && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-2xl shadow-lg shadow-primary/20"><Plus className="h-4 w-4" />إضافة دكتور</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center"><GraduationCap className="h-5 w-5 text-success" /></div>
                    <div><DialogTitle>إضافة دكتور جديد</DialogTitle><DialogDescription>أدخل اسم الدكتور الجديد</DialogDescription></div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label htmlFor="name">اسم الدكتور</Label><Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: د. أحمد محمد" className="text-right rounded-xl" /></div>
                  <Button onClick={handleAdd} disabled={createProfessor.isPending || !newName.trim()} className="w-full rounded-xl">{createProfessor.isPending ? 'جاري الإضافة...' : 'إضافة'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Summary Card */}
        <motion.div variants={item}>
          <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <Card className="card-glass border-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي الدكاترة</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{professors?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Professors Table */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader>
              <CardTitle className="text-base">قائمة الدكاترة</CardTitle>
              <CardDescription className="text-xs">جميع أعضاء هيئة التدريس المسجلين في النظام</CardDescription>
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
              ) : professors?.length === 0 ? (
                <EmptyStateIllustration
                  type="professors"
                  title="لا يوجد دكاترة بعد"
                  description="ابدأ بإضافة أعضاء هيئة التدريس لربطهم بالمواد الدراسية"
                />
              ) : (
                <div className="table-enhanced">
                  <Table>
                    <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[50px]">#</TableHead><TableHead>الاسم</TableHead><TableHead className="w-[180px]">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {professors?.map((professor, index) => (
                        <TableRow key={professor.id}>
                          <TableCell><div className="row-number">{index + 1}</div></TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center"><User className="h-4 w-4 text-success" /></div>
                              {professor.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="icon-button text-warning hover:text-warning" onClick={() => setUnavailabilityProfessor({ id: professor.id, name: professor.name })} title="أوقات عدم التوفر" disabled={!isActiveSubscription}><CalendarOff className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="icon-button" onClick={() => setEditingProfessor({ id: professor.id, name: professor.name })} disabled={!isActiveSubscription}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="icon-button text-destructive hover:text-destructive" onClick={() => setDeletingProfessor({ id: professor.id, name: professor.name })} disabled={!isActiveSubscription}><Trash2 className="h-4 w-4" /></Button>
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
        <Dialog open={!!editingProfessor} onOpenChange={() => setEditingProfessor(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Pencil className="h-5 w-5 text-primary" /></div>
                <div><DialogTitle>تعديل الدكتور</DialogTitle><DialogDescription>قم بتحديث بيانات الدكتور</DialogDescription></div>
              </div>
            </DialogHeader>
            {editingProfessor && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label htmlFor="edit-name">اسم الدكتور</Label><Input id="edit-name" value={editingProfessor.name} onChange={(e) => setEditingProfessor({ ...editingProfessor, name: e.target.value })} className="text-right rounded-xl" /></div>
                <Button onClick={handleUpdate} disabled={updateProfessor.isPending} className="w-full rounded-xl">{updateProfessor.isPending ? 'جاري التحديث...' : 'تحديث'}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingProfessor} onOpenChange={() => setDeletingProfessor(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <div><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>هل أنت متأكد من حذف هذا الدكتور؟</DialogDescription></div>
              </div>
            </DialogHeader>
            {deletingProfessor && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20"><p className="text-sm text-center">سيتم حذف الدكتور <span className="font-bold">{deletingProfessor.name}</span> نهائياً</p></div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingProfessor(null)} className="flex-1 rounded-xl">إلغاء</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteProfessor.isPending} className="flex-1 rounded-xl">{deleteProfessor.isPending ? 'جاري الحذف...' : 'حذف'}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ProfessorUnavailabilityDialog professor={unavailabilityProfessor} onClose={() => setUnavailabilityProfessor(null)} />
      </motion.div>
    </Layout>
  );
}
