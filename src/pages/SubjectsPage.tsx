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
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { Plus, Pencil, Trash2, BookOpen, AlertTriangle, FlaskConical, FileText, Clock } from 'lucide-react';
import { SubjectType, SUBJECT_TYPE_LABELS } from '@/types/database';
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

export default function SubjectsPage() {
  const { isActive: isActiveSubscription } = useIsActiveSubscription();
  const { data: subjects, isLoading } = useSubjects();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<{ 
    id: string; name: string; professor_id: string; group_id: string; type: SubjectType; weekly_hours: number;
  } | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<{ id: string; name: string } | null>(null);
  const [newSubject, setNewSubject] = useState({ 
    name: '', professor_id: '', group_id: '', type: 'theory' as SubjectType, weekly_hours: 2
  });
  const [search, setSearch] = useState('');

  const filteredSubjects = subjects?.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) ||
      s.professor?.name?.toLowerCase().includes(q) || s.group?.name?.toLowerCase().includes(q) ||
      SUBJECT_TYPE_LABELS[s.type].includes(q);
  });

  const handleAdd = async () => {
    if (!newSubject.name.trim() || !newSubject.professor_id || !newSubject.group_id) return;
    await createSubject.mutateAsync(newSubject);
    setNewSubject({ name: '', professor_id: '', group_id: '', type: 'theory', weekly_hours: 2 });
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingSubject || !editingSubject.name.trim()) return;
    await updateSubject.mutateAsync(editingSubject);
    setEditingSubject(null);
  };

  const handleDelete = async () => {
    if (!deletingSubject) return;
    await deleteSubject.mutateAsync(deletingSubject.id);
    setDeletingSubject(null);
  };

  const theoryCount = subjects?.filter(s => s.type === 'theory').length || 0;
  const practicalCount = subjects?.filter(s => s.type === 'practical').length || 0;

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <SubscriptionBanner />

        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة المواد</h1>
            <p className="text-muted-foreground mt-1 text-sm">إضافة وتعديل وحذف المواد الدراسية</p>
          </div>
          {isActiveSubscription && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-2xl shadow-lg shadow-primary/20" disabled={!professors?.length || !groups?.length}>
                  <Plus className="h-4 w-4" />إضافة مادة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-lg">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center"><BookOpen className="h-5 w-5 text-warning" /></div>
                    <div><DialogTitle>إضافة مادة جديدة</DialogTitle><DialogDescription>أدخل بيانات المادة الدراسية</DialogDescription></div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label htmlFor="name">اسم المادة</Label><Input id="name" value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="مثال: البرمجة المتقدمة" className="text-right rounded-xl" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الدكتور</Label>
                      <Select value={newSubject.professor_id} onValueChange={(value) => setNewSubject({ ...newSubject, professor_id: value })}>
                        <SelectTrigger><SelectValue placeholder="اختر الدكتور" /></SelectTrigger>
                        <SelectContent>{professors?.map((prof) => (<SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المجموعة</Label>
                      <Select value={newSubject.group_id} onValueChange={(value) => setNewSubject({ ...newSubject, group_id: value })}>
                        <SelectTrigger><SelectValue placeholder="اختر المجموعة" /></SelectTrigger>
                        <SelectContent>{groups?.map((group) => (<SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع المادة</Label>
                      <Select value={newSubject.type} onValueChange={(value) => setNewSubject({ ...newSubject, type: value as SubjectType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="theory"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-info" />{SUBJECT_TYPE_LABELS.theory}</div></SelectItem>
                          <SelectItem value="practical"><div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-warning" />{SUBJECT_TYPE_LABELS.practical}</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekly_hours">الساعات الأسبوعية</Label>
                      <Input id="weekly_hours" type="number" min={1} max={20} value={newSubject.weekly_hours} onChange={(e) => setNewSubject({ ...newSubject, weekly_hours: parseInt(e.target.value) || 2 })} className="rounded-xl" />
                    </div>
                  </div>
                  <Button onClick={handleAdd} disabled={createSubject.isPending || !newSubject.name.trim() || !newSubject.professor_id || !newSubject.group_id} className="w-full rounded-xl">
                    {createSubject.isPending ? 'جاري الإضافة...' : 'إضافة'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Warning */}
        {(!professors?.length || !groups?.length) && (
          <motion.div variants={item}>
            <Card className="card-glass border-0 ring-1 ring-warning/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-warning" /></div>
                  <p className="text-sm text-warning">يجب إضافة دكاترة ومجموعات أولاً قبل إضافة المواد</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Summary Cards */}
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'إجمالي المواد', value: subjects?.length || 0, iconBg: 'bg-warning/10', iconColor: 'text-warning', Icon: BookOpen },
            { label: 'مواد نظرية', value: theoryCount, iconBg: 'bg-info/10', iconColor: 'text-info', Icon: FileText },
            { label: 'مواد عملية', value: practicalCount, iconBg: 'bg-warning/10', iconColor: 'text-warning', Icon: FlaskConical },
          ].map((s) => (
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

        {/* Subjects Table */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">قائمة المواد</CardTitle>
                  <CardDescription className="text-xs">جميع المواد الدراسية المسجلة في النظام</CardDescription>
                </div>
                <div className="w-full sm:w-64">
                  <SearchInput value={search} onChange={setSearch} placeholder="بحث في المواد..." />
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
                      <div className="skeleton-line-short" />
                    </div>
                  ))}
                </div>
              ) : subjects?.length === 0 ? (
                <EmptyStateIllustration
                  type="subjects"
                  title="لا توجد مواد بعد"
                  description="ابدأ بإضافة المواد الدراسية وربطها بالدكاترة والمجموعات"
                />
              ) : (
                <div className="overflow-x-auto table-enhanced">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[50px]">#</TableHead>
                        <TableHead>الكود</TableHead><TableHead>الاسم</TableHead><TableHead>النوع</TableHead>
                        <TableHead>الساعات</TableHead><TableHead>الدكتور</TableHead><TableHead>المجموعة</TableHead>
                        <TableHead className="w-[100px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects?.map((subject, index) => (
                        <TableRow key={subject.id}>
                          <TableCell><div className="row-number">{index + 1}</div></TableCell>
                          <TableCell className="font-mono text-sm"><Badge variant="outline" className="font-mono rounded-xl">{subject.code}</Badge></TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", subject.type === 'theory' ? 'bg-info/10' : 'bg-warning/10')}>
                                {subject.type === 'theory' ? <FileText className="h-4 w-4 text-info" /> : <FlaskConical className="h-4 w-4 text-warning" />}
                              </div>
                              {subject.name}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={cn("font-medium rounded-xl", subject.type === 'theory' ? 'badge-theory' : 'badge-practical')}>{SUBJECT_TYPE_LABELS[subject.type]}</Badge></TableCell>
                          <TableCell><div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" />{subject.weekly_hours}</div></TableCell>
                          <TableCell>{subject.professor?.name}</TableCell>
                          <TableCell><Badge variant="secondary" className="rounded-xl">{subject.group?.name}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="icon-button" onClick={() => setEditingSubject({ id: subject.id, name: subject.name, professor_id: subject.professor_id, group_id: subject.group_id, type: subject.type, weekly_hours: subject.weekly_hours })} disabled={!isActiveSubscription}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="icon-button text-destructive hover:text-destructive" onClick={() => setDeletingSubject({ id: subject.id, name: subject.name })} disabled={!isActiveSubscription}><Trash2 className="h-4 w-4" /></Button>
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
        <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
          <DialogContent dir="rtl" className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Pencil className="h-5 w-5 text-primary" /></div>
                <div><DialogTitle>تعديل المادة</DialogTitle><DialogDescription>قم بتحديث بيانات المادة</DialogDescription></div>
              </div>
            </DialogHeader>
            {editingSubject && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label htmlFor="edit-name">اسم المادة</Label><Input id="edit-name" value={editingSubject.name} onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })} className="text-right rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الدكتور</Label>
                    <Select value={editingSubject.professor_id} onValueChange={(value) => setEditingSubject({ ...editingSubject, professor_id: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{professors?.map((prof) => (<SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المجموعة</Label>
                    <Select value={editingSubject.group_id} onValueChange={(value) => setEditingSubject({ ...editingSubject, group_id: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{groups?.map((group) => (<SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المادة</Label>
                    <Select value={editingSubject.type} onValueChange={(value) => setEditingSubject({ ...editingSubject, type: value as SubjectType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">{SUBJECT_TYPE_LABELS.theory}</SelectItem>
                        <SelectItem value="practical">{SUBJECT_TYPE_LABELS.practical}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-weekly-hours">الساعات الأسبوعية</Label>
                    <Input id="edit-weekly-hours" type="number" min={1} max={20} value={editingSubject.weekly_hours} onChange={(e) => setEditingSubject({ ...editingSubject, weekly_hours: parseInt(e.target.value) || 2 })} className="rounded-xl" />
                  </div>
                </div>
                <Button onClick={handleUpdate} disabled={updateSubject.isPending} className="w-full rounded-xl">{updateSubject.isPending ? 'جاري التحديث...' : 'تحديث'}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <div><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>هل أنت متأكد من حذف هذه المادة؟</DialogDescription></div>
              </div>
            </DialogHeader>
            {deletingSubject && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20"><p className="text-sm text-center">سيتم حذف المادة <span className="font-bold">{deletingSubject.name}</span> نهائياً</p></div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingSubject(null)} className="flex-1 rounded-xl">إلغاء</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteSubject.isPending} className="flex-1 rounded-xl">{deleteSubject.isPending ? 'جاري الحذف...' : 'حذف'}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </Layout>
  );
}
