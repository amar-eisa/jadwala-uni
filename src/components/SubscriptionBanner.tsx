import { useIsActiveSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  inactive: 'غير نشط',
  expired: 'منتهي',
  cancelled: 'ملغي',
  suspended: 'موقوف',
};

export function SubscriptionBanner() {
  const { isActive, isLoading, subscription } = useIsActiveSubscription();
  
  // Don't show banner if loading, active, or no subscription found
  if (isLoading || isActive || !subscription) return null;
  
  const statusLabel = STATUS_LABELS[subscription.status] || subscription.status;
  
  return (
    <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">
        اشتراكك {statusLabel}
      </AlertTitle>
      <AlertDescription className="mt-2">
        لا يمكنك إضافة أو تعديل أو حذف البيانات. يمكنك فقط عرض البيانات الموجودة.
        <br />
        يرجى التواصل مع المدير لتفعيل اشتراكك.
      </AlertDescription>
    </Alert>
  );
}
