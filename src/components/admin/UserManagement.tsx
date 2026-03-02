import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  useAdminUsers, 
  useUpdateSubscription, 
  useUpdateUserRole, 
  useApproveUser,
  useRejectUser,
  useDeleteUser,
  UserWithDetails 
} from '@/hooks/useAdmin';
import { FileText, Edit, Loader2, Check, X, Trash2, CalendarIcon, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  inactive: { label: 'غير نشط', variant: 'secondary' },
  pending: { label: 'في الانتظار', variant: 'outline' },
  expired: { label: 'منتهي', variant: 'destructive' },
  cancelled: { label: 'ملغي', variant: 'outline' },
};

const PLAN_OPTIONS = [
  { value: 'free', label: 'مجاني' },
  { value: 'basic', label: 'أساسي' },
  { value: 'premium', label: 'متميز' },
  { value: 'enterprise', label: 'مؤسسي' },
];

export function UserManagement() {
  const { data: users, isLoading, error } = useAdminUsers();
  const updateSubscription = useUpdateSubscription();
  const updateRole = useUpdateUserRole();
  const approveUser = useApproveUser();
  const rejectUser = useRejectUser();
  const deleteUser = useDeleteUser();
  
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [editForm, setEditForm] = useState({
    plan_name: '',
    status: '',
    price: 0,
    start_date: null as Date | null,
    end_date: null as Date | null,
  });
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvingUser, setApprovingUser] = useState<UserWithDetails | null>(null);
  const [approveEndDate, setApproveEndDate] = useState<Date | null>(null);

  const pendingUsers = users?.filter(u => u.subscription?.status === 'pending') || [];
  const allUsers = users || [];

  const handleEditClick = (user: UserWithDetails) => {
    setEditingUser(user);
    setEditForm({
      plan_name: user.subscription?.plan_name || 'free',
      status: user.subscription?.status || 'active',
      price: user.subscription?.price || 0,
      start_date: user.subscription?.start_date ? new Date(user.subscription.start_date) : null,
      end_date: user.subscription?.end_date ? new Date(user.subscription.end_date) : null,
    });
  };

  const handleSaveSubscription = async () => {
    if (!editingUser?.subscription) return;
    
    try {
      await updateSubscription.mutateAsync({
        subscriptionId: editingUser.subscription.id,
        updates: {
          plan_name: editForm.plan_name,
          status: editForm.status,
          price: editForm.price,
          start_date: editForm.start_date?.toISOString() || null,
          end_date: editForm.end_date?.toISOString() || null,
        },
      });
      toast.success('تم تحديث الاشتراك بنجاح');
      setEditingUser(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الاشتراك');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast.success('تم تحديث الدور بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الدور');
    }
  };

  const handleApproveClick = (user: UserWithDetails) => {
    setApprovingUser(user);
    setApproveEndDate(null);
    setApproveDialogOpen(true);
  };

  const handleApproveUser = async () => {
    if (!approvingUser?.subscription) return;
    
    try {
      await approveUser.mutateAsync({
        subscriptionId: approvingUser.subscription.id,
        endDate: approveEndDate?.toISOString(),
      });
      toast.success('تم اعتماد المستخدم بنجاح');
      setApproveDialogOpen(false);
      setApprovingUser(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء اعتماد المستخدم');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await rejectUser.mutateAsync(userId);
      toast.success('تم رفض المستخدم وحذف بياناته');
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض المستخدم');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success('تم حذف المستخدم بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء حذف المستخدم');
    }
  };

  const handleExportInvoice = (user: UserWithDetails) => {
    if (!user.subscription) {
      toast.error('لا يوجد اشتراك لهذا المستخدم');
      return;
    }
    
    generateInvoicePDF(user);
    toast.success('تم تصدير الفاتورة بنجاح');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        حدث خطأ أثناء تحميل البيانات
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            في الانتظار
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="mr-1">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">جميع المستخدمين</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مستخدمين في الانتظار</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">تاريخ التسجيل</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span dir="ltr">{user.phone}</span>
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.created_at 
                          ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleApproveClick(user)}
                            disabled={approveUser.isPending}
                          >
                            <Check className="h-4 w-4 ml-1" />
                            اعتماد
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={rejectUser.isPending}
                              >
                                <X className="h-4 w-4 ml-1" />
                                رفض
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد رفض المستخدم</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من رفض هذا المستخدم؟ سيتم حذف جميع بياناته نهائياً.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRejectUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  رفض وحذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">الخطة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">فترة الاشتراك</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span dir="ltr">{user.phone}</span>
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: 'admin' | 'user') => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">مستخدم</SelectItem>
                          <SelectItem value="admin">مدير</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PLAN_OPTIONS.find(p => p.value === user.subscription?.plan_name)?.label || user.subscription?.plan_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.subscription && (
                        <Badge variant={STATUS_LABELS[user.subscription.status]?.variant || 'default'}>
                          {STATUS_LABELS[user.subscription.status]?.label || user.subscription.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {user.subscription?.start_date ? (
                          <span>
                            {format(new Date(user.subscription.start_date), 'dd/MM/yyyy')}
                            {user.subscription.end_date && (
                              <> - {format(new Date(user.subscription.end_date), 'dd/MM/yyyy')}</>
                            )}
                          </span>
                        ) : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditClick(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent dir="rtl" className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>تعديل اشتراك {user.full_name || user.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>الخطة</Label>
                                <Select
                                  value={editForm.plan_name}
                                  onValueChange={(value) => setEditForm({ ...editForm, plan_name: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PLAN_OPTIONS.map((plan) => (
                                      <SelectItem key={plan.value} value={plan.value}>
                                        {plan.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>الحالة</Label>
                                <Select
                                  value={editForm.status}
                                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>السعر</Label>
                                <Input
                                  type="number"
                                  value={editForm.price}
                                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>تاريخ البداية</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-right font-normal",
                                          !editForm.start_date && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {editForm.start_date ? format(editForm.start_date, 'dd/MM/yyyy') : 'اختر'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={editForm.start_date || undefined}
                                        onSelect={(date) => setEditForm({ ...editForm, start_date: date || null })}
                                        initialFocus
                                        className={cn("p-3 pointer-events-auto")}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="space-y-2">
                                  <Label>تاريخ النهاية</Label>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full justify-start text-right font-normal",
                                          !editForm.end_date && "text-muted-foreground"
                                        )}
                                      >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {editForm.end_date ? format(editForm.end_date, 'dd/MM/yyyy') : 'اختر'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={editForm.end_date || undefined}
                                        onSelect={(date) => setEditForm({ ...editForm, end_date: date || null })}
                                        initialFocus
                                        className={cn("p-3 pointer-events-auto")}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                              <Button 
                                className="w-full" 
                                onClick={handleSaveSubscription}
                                disabled={updateSubscription.isPending}
                              >
                                {updateSubscription.isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                )}
                                حفظ التغييرات
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleExportInvoice(user)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد حذف المستخدم</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع بياناته نهائياً ولا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف نهائياً
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve User Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>اعتماد المستخدم</DialogTitle>
            <DialogDescription>
              {approvingUser?.full_name || approvingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>تاريخ انتهاء الاشتراك (اختياري)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !approveEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {approveEndDate ? format(approveEndDate, 'dd/MM/yyyy') : 'بدون تاريخ انتهاء'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={approveEndDate || undefined}
                    onSelect={(date) => setApproveEndDate(date || null)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleApproveUser} disabled={approveUser.isPending}>
              {approveUser.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              اعتماد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
