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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminUsers, useUpdateSubscription, useUpdateUserRole, UserWithDetails } from '@/hooks/useAdmin';
import { FileText, Edit, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  inactive: { label: 'غير نشط', variant: 'secondary' },
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
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [editForm, setEditForm] = useState({
    plan_name: '',
    status: '',
    price: 0,
  });

  const handleEditClick = (user: UserWithDetails) => {
    setEditingUser(user);
    setEditForm({
      plan_name: user.subscription?.plan_name || 'free',
      status: user.subscription?.status || 'active',
      price: user.subscription?.price || 0,
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
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المستخدم</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              <TableHead className="text-right">الخطة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">السعر</TableHead>
              <TableHead className="text-right">تاريخ التسجيل</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.full_name || 'بدون اسم'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
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
                  {user.subscription?.price ? `${user.subscription.price} ${user.subscription.currency}` : '-'}
                </TableCell>
                <TableCell>
                  {user.created_at 
                    ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: ar })
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
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
                      <DialogContent dir="rtl">
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
                          <Button 
                            className="w-full" 
                            onClick={handleSaveSubscription}
                            disabled={updateSubscription.isPending}
                          >
                            {updateSubscription.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            ) : null}
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
