

## المشكلة

صفحة `/pending-approval` ليست محمية بـ `ProtectedRoute` - هي route عام. عند الضغط على "تسجيل الخروج":
1. يتم تسجيل الخروج فعلاً من النظام (الجلسة تُحذف)
2. لكن المستخدم يبقى على نفس الصفحة لأنها لا تحتوي على منطق إعادة توجيه

الصفحة تستخدم `useAuth()` للحصول على `user` لكنها لا تتحقق إذا أصبح `user = null` بعد تسجيل الخروج لإعادة التوجيه إلى `/auth`.

## الحل

تعديل `src/pages/PendingApprovalPage.tsx` لإضافة تحقق: إذا كان `user` هو `null` (بعد تسجيل الخروج)، يتم إعادة التوجيه تلقائياً إلى `/auth` باستخدام `Navigate` من react-router-dom.

### التعديل

```tsx
// إضافة في أعلى الملف
import { Navigate } from 'react-router-dom';

// إضافة قبل return الرئيسي
if (!user && !loading) {
  return <Navigate to="/auth" replace />;
}
```

ملف واحد يتأثر: `src/pages/PendingApprovalPage.tsx`

