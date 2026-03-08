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
import { useStudentGroups, useCreateStudentGroup, useUpdateStudentGroup, useDeleteStudentGroup } from '@/hooks/useStudentGroups';
import { Plus, Pencil, Trash2, Users, AlertTriangle, UserCircle } from 'lucide-react';
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

export default function GroupsPage() {
  const { isActive: isActiveSubscription } = useIsActiveSubscription();
  const { data: groups, isLoading } = useStudentGroups();
  const createGroup = useCreateStudentGroup();
  const updateGroup = useUpdateStudentGroup();
  const deleteGroup = useDeleteStudentGroup();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [search, setSearch] = useState('');

  const filteredGroups = groups?.filter(g => {
    if (!search) return true;
    return g.name.toLowerCase().includes(search.toLowerCase());
  });

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
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <SubscriptionBanner />

        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">إدارة المجموعات</h1>
            <p className="text-muted-foreground mt-1 text-sm">إضافة وتعديل وحذف مجموعات الطلاب</p>
          </div>
          {isActiveSubscription && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-2xl shadow-lg shadow-primary/20"><Plus className="h-4 w-4" />إضافة مجموعة</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[hsl(262,60%,55%)/0.1] flex items-center justify-center"><Users className="h-5 w-5 text-[hsl(262,60%,50%)]" /></div>
                    <div><DialogTitle>إضافة مجموعة جديدة</DialogTitle><DialogDescription>أدخل اسم مجموعة الطلاب</DialogDescription></div>
                  </div>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2"><Label htmlFor="name">اسم المجموعة</Label><Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: المستوى الأول - شعبة أ" className="text-right rounded-xl" /></div>
                  <Button onClick={handleAdd} disabled={createGroup.isPending || !newName.trim()} className="w-full rounded-xl">{createGroup.isPending ? 'جاري الإضافة...' : 'إضافة'}</Button>
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
                  <div className="w-12 h-12 rounded-full bg-[hsl(262,60%,55%)/0.1] flex items-center justify-center">
                    <Users className="h-5 w-5 text-[hsl(262,60%,50%)]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي المجموعات</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{groups?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Groups Table */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">قائمة المجموعات</CardTitle>
                  <CardDescription className="text-xs">جميع مجموعات الطلاب المسجلة في النظام</CardDescription>
                </div>
                <div className="w-full sm:w-64">
                  <SearchInput value={search} onChange={setSearch} placeholder="بحث في المجموعات..." />
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
              ) : groups?.length === 0 ? (
                <EmptyStateIllustration
                  type="groups"
                  title="لا توجد مجموعات بعد"
                  description="ابدأ بإضافة مجموعات الطلاب لتنظيم الجداول حسب الدفعات"
                />
              ) : (
                <div className="table-enhanced">
                  <Table>
                    <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-[50px]">#</TableHead><TableHead>الاسم</TableHead><TableHead className="w-[100px]">إجراءات</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {groups?.map((group, index) => (
                        <TableRow key={group.id}>
                          <TableCell><div className="row-number">{index + 1}</div></TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[hsl(262,60%,55%)/0.1] flex items-center justify-center"><UserCircle className="h-4 w-4 text-[hsl(262,60%,50%)]" /></div>
                              {group.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="icon-button" onClick={() => setEditingGroup({ id: group.id, name: group.name })} disabled={!isActiveSubscription}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="icon-button text-destructive hover:text-destructive" onClick={() => setDeletingGroup({ id: group.id, name: group.name })} disabled={!isActiveSubscription}><Trash2 className="h-4 w-4" /></Button>
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
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Pencil className="h-5 w-5 text-primary" /></div>
                <div><DialogTitle>تعديل المجموعة</DialogTitle><DialogDescription>قم بتحديث اسم المجموعة</DialogDescription></div>
              </div>
            </DialogHeader>
            {editingGroup && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2"><Label htmlFor="edit-name">اسم المجموعة</Label><Input id="edit-name" value={editingGroup.name} onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })} className="text-right rounded-xl" /></div>
                <Button onClick={handleUpdate} disabled={updateGroup.isPending} className="w-full rounded-xl">{updateGroup.isPending ? 'جاري التحديث...' : 'تحديث'}</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingGroup} onOpenChange={() => setDeletingGroup(null)}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <div><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>هل أنت متأكد من حذف هذه المجموعة؟</DialogDescription></div>
              </div>
            </DialogHeader>
            {deletingGroup && (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-destructive/5 rounded-2xl border border-destructive/20"><p className="text-sm text-center">سيتم حذف المجموعة <span className="font-bold">{deletingGroup.name}</span> نهائياً</p></div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setDeletingGroup(null)} className="flex-1 rounded-xl">إلغاء</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleteGroup.isPending} className="flex-1 rounded-xl">{deleteGroup.isPending ? 'جاري الحذف...' : 'حذف'}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </Layout>
  );
}
