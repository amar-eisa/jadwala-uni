import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, X, Trash2, CalendarIcon, Phone, Search, Shield, Lock, Edit, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  role: string;
  subscription: {
    id: string;
    plan_name: string;
    status: string;
    price: number;
    currency: string;
    start_date: string | null;
    end_date: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  inactive: { label: 'غير نشط', variant: 'secondary' },
  pending: { label: 'في الانتظار', variant: 'outline' },
  expired: { label: 'منتهي', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير',
  user: 'مستخدم',
  editor: 'محرر',
  viewer: 'مشاهد',
};

const PLAN_OPTIONS = [
  { value: 'free', label: 'مجاني' },
  { value: 'basic', label: 'أساسي' },
  { value: 'premium', label: 'متميز' },
  { value: 'enterprise', label: 'مؤسسي' },
];

async function apiCall(secret: string, method: 'GET' | 'POST', body?: any) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-subscriptions`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Password gate component
function PasswordGate({ onSuccess }: { onSuccess: (secret: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiCall(password.trim(), 'GET');
      onSuccess(password.trim());
    } catch {
      setError('كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>إدارة الاشتراكات</CardTitle>
          <p className="text-sm text-muted-foreground">أدخل كلمة المرور للمتابعة</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'دخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Main management dashboard
function ManagementDashboard({ secret }: { secret: string }) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const isMobile = useIsMobile();

  // Edit dialog
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({ plan_name: '', status: '', price: 0, start_date: null as Date | null, end_date: null as Date | null });

  // Approve dialog
  const [approvingUser, setApprovingUser] = useState<UserData | null>(null);
  const [approveEndDate, setApproveEndDate] = useState<Date | null>(null);

  // Delete/reject dialog
  const [deletingUser, setDeletingUser] = useState<{ user: UserData; action: 'delete' | 'reject' } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiCall(secret, 'GET');
      setUsers(data.users || []);
    } catch {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(user.full_name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q) || user.phone?.includes(q))) return false;
      }
      if (statusFilter !== 'all' && user.subscription?.status !== statusFilter) return false;
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      return true;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const pendingUsers = useMemo(() => filteredUsers.filter(u => u.subscription?.status === 'pending'), [filteredUsers]);

  const handleApprove = async (user: UserData) => {
    if (!user.subscription) return;
    setActionLoading(user.id);
    try {
      await apiCall(secret, 'POST', {
        action: 'approve',
        subscriptionId: user.subscription.id,
        updates: { end_date: approveEndDate?.toISOString() || null },
      });
      toast.success('تم اعتماد المستخدم');
      setApprovingUser(null);
      await fetchUsers();
    } catch { toast.error('فشل في اعتماد المستخدم'); }
    finally { setActionLoading(null); }
  };

  const handleRejectOrDelete = async () => {
    if (!deletingUser) return;
    setActionLoading(deletingUser.user.id);
    try {
      await apiCall(secret, 'POST', { action: deletingUser.action === 'reject' ? 'reject' : 'delete', userId: deletingUser.user.id });
      toast.success(deletingUser.action === 'reject' ? 'تم رفض المستخدم' : 'تم حذف المستخدم');
      setDeletingUser(null);
      await fetchUsers();
    } catch { toast.error('حدث خطأ'); }
    finally { setActionLoading(null); }
  };

  const handleSaveEdit = async () => {
    if (!editingUser?.subscription) return;
    setActionLoading(editingUser.id);
    try {
      await apiCall(secret, 'POST', {
        action: 'update_subscription',
        subscriptionId: editingUser.subscription.id,
        updates: {
          plan_name: editForm.plan_name,
          status: editForm.status,
          price: editForm.price,
          start_date: editForm.start_date?.toISOString() || null,
          end_date: editForm.end_date?.toISOString() || null,
        },
      });
      toast.success('تم تحديث الاشتراك');
      setEditingUser(null);
      await fetchUsers();
    } catch { toast.error('فشل في التحديث'); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      await apiCall(secret, 'POST', { action: 'update_role', userId, updates: { role } });
      toast.success('تم تحديث الدور');
      await fetchUsers();
    } catch { toast.error('فشل في تحديث الدور'); }
    finally { setActionLoading(null); }
  };

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      plan_name: user.subscription?.plan_name || 'free',
      status: user.subscription?.status || 'active',
      price: user.subscription?.price || 0,
      start_date: user.subscription?.start_date ? new Date(user.subscription.start_date) : null,
      end_date: user.subscription?.end_date ? new Date(user.subscription.end_date) : null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalUsers = users.length;
  const activeCount = users.filter(u => u.subscription?.status === 'active').length;
  const pendingCount = users.filter(u => u.subscription?.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">إدارة الاشتراكات</h1>
            <p className="text-sm text-muted-foreground">إدارة المستخدمين والاشتراكات</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{totalUsers}</p><p className="text-xs text-muted-foreground">إجمالي</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{activeCount}</p><p className="text-xs text-muted-foreground">نشط</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-accent-foreground">{pendingCount}</p><p className="text-xs text-muted-foreground">في الانتظار</p></CardContent></Card>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو البريد أو الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="الدور" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
                <SelectItem value="editor">محرر</SelectItem>
                <SelectItem value="viewer">مشاهد</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchUsers}><Loader2 className={cn("h-4 w-4", loading && "animate-spin")} /> تحديث</Button>
          </div>
        </div>

        {/* Pending Section */}
        {pendingUsers.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                في انتظار الاعتماد ({pendingUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.id} className="rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /><span dir="ltr">{user.phone}</span></p>}
                    <p className="text-xs text-muted-foreground mt-1">{user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar }) : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { setApprovingUser(user); setApproveEndDate(null); }} disabled={actionLoading === user.id}>
                      <Check className="h-4 w-4 ml-1" />اعتماد
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeletingUser({ user, action: 'reject' })} disabled={actionLoading === user.id}>
                      <X className="h-4 w-4 ml-1" />رفض
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* All Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              جميع المستخدمين ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMobile ? (
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div key={user.id} className="rounded-lg border p-3 space-y-2">
                    <div>
                      <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /><span dir="ltr">{user.phone}</span></p>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {user.subscription && <Badge variant={STATUS_LABELS[user.subscription.status]?.variant || 'default'}>{STATUS_LABELS[user.subscription.status]?.label || user.subscription.status}</Badge>}
                      <Badge variant="outline">{PLAN_OPTIONS.find(p => p.value === user.subscription?.plan_name)?.label || user.subscription?.plan_name}</Badge>
                      <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(user)}><Edit className="h-3.5 w-3.5 ml-1" />تعديل</Button>
                      <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                        <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير</SelectItem>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="editor">محرر</SelectItem>
                          <SelectItem value="viewer">مشاهد</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setDeletingUser({ user, action: 'delete' })}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2 font-medium">المستخدم</th>
                      <th className="text-right p-2 font-medium">الهاتف</th>
                      <th className="text-right p-2 font-medium">الحالة</th>
                      <th className="text-right p-2 font-medium">الخطة</th>
                      <th className="text-right p-2 font-medium">الدور</th>
                      <th className="text-right p-2 font-medium">التاريخ</th>
                      <th className="text-right p-2 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="p-2"><span dir="ltr" className="text-xs">{user.phone || '-'}</span></td>
                        <td className="p-2">{user.subscription && <Badge variant={STATUS_LABELS[user.subscription.status]?.variant || 'default'} className="text-xs">{STATUS_LABELS[user.subscription.status]?.label || user.subscription.status}</Badge>}</td>
                        <td className="p-2 text-xs">{PLAN_OPTIONS.find(p => p.value === user.subscription?.plan_name)?.label || user.subscription?.plan_name || '-'}</td>
                        <td className="p-2">
                          <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                            <SelectTrigger className="h-7 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="user">مستخدم</SelectItem>
                              <SelectItem value="editor">محرر</SelectItem>
                              <SelectItem value="viewer">مشاهد</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{user.subscription?.start_date ? format(new Date(user.subscription.start_date), 'dd/MM/yy') : '-'}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(user)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeletingUser({ user, action: 'delete' })}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {filteredUsers.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد نتائج</p>}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={!!approvingUser} onOpenChange={(o) => !o && setApprovingUser(null)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>اعتماد {approvingUser?.full_name || approvingUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label>تاريخ انتهاء الاشتراك (اختياري)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-right", !approveEndDate && "text-muted-foreground")}>
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {approveEndDate ? format(approveEndDate, 'dd/MM/yyyy') : 'بدون تاريخ انتهاء'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={approveEndDate || undefined} onSelect={(d) => setApproveEndDate(d || null)} /></PopoverContent>
            </Popover>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovingUser(null)}>إلغاء</Button>
            <Button onClick={() => approvingUser && handleApprove(approvingUser)} disabled={actionLoading === approvingUser?.id}>
              {actionLoading === approvingUser?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'اعتماد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>تعديل اشتراك {editingUser?.full_name || editingUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الخطة</Label>
              <Select value={editForm.plan_name} onValueChange={(v) => setEditForm(f => ({ ...f, plan_name: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLAN_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_LABELS).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input type="number" value={editForm.price} onChange={(e) => setEditForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-right text-xs", !editForm.start_date && "text-muted-foreground")}>
                      <CalendarIcon className="ml-1 h-3.5 w-3.5" />
                      {editForm.start_date ? format(editForm.start_date, 'dd/MM/yy') : 'اختر'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editForm.start_date || undefined} onSelect={(d) => setEditForm(f => ({ ...f, start_date: d || null }))} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-right text-xs", !editForm.end_date && "text-muted-foreground")}>
                      <CalendarIcon className="ml-1 h-3.5 w-3.5" />
                      {editForm.end_date ? format(editForm.end_date, 'dd/MM/yy') : 'اختر'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={editForm.end_date || undefined} onSelect={(d) => setEditForm(f => ({ ...f, end_date: d || null }))} /></PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>إلغاء</Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading === editingUser?.id}>
              {actionLoading === editingUser?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete/Reject Confirm */}
      <AlertDialog open={!!deletingUser} onOpenChange={(o) => !o && setDeletingUser(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{deletingUser?.action === 'reject' ? 'تأكيد رفض المستخدم' : 'تأكيد حذف المستخدم'}</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingUser?.action === 'reject'
                ? 'سيتم رفض المستخدم وحذف جميع بياناته نهائياً.'
                : `سيتم حذف ${deletingUser?.user.full_name || deletingUser?.user.email} وجميع بياناته نهائياً.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectOrDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingUser?.action === 'reject' ? 'رفض وحذف' : 'حذف نهائياً'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ManageSubscriptionsPage() {
  const [secret, setSecret] = useState<string | null>(null);

  return (
    <>
      <Toaster />
      {secret ? <ManagementDashboard secret={secret} /> : <PasswordGate onSuccess={setSecret} />}
    </>
  );
}
