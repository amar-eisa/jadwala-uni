

## تحسينات الأمان

### 1. حذف المستخدم من auth.users عند الرفض/الحذف

**المشكلة:** حاليا `useRejectUser` و `useDeleteUser` يحذفان البيانات من الجداول العامة فقط (profiles, user_roles, subscriptions...) لكن السجل يبقى في `auth.users`، مما يعني ان المستخدم المرفوض يمكنه الاستمرار في تسجيل الدخول.

**الحل:** انشاء Edge Function تستخدم `service_role_key` لحذف المستخدم من `auth.users` عبر Admin API، ثم استدعاؤها من الفرونتند.

**ملف جديد: `supabase/functions/delete-user/index.ts`**
- يستقبل `user_id` في body
- يتحقق ان المستدعي admin عبر JWT
- يستخدم `supabase.auth.admin.deleteUser(userId)` لحذف المستخدم نهائيا (هذا يؤدي تلقائيا لحذف البيانات المرتبطة عبر CASCADE)
- يرجع نجاح او خطأ

**تعديل `supabase/config.toml`:**
- اضافة `[functions.delete-user]` مع `verify_jwt = false` (التحقق يتم يدويا في الكود)

**تعديل `src/hooks/useAdmin.ts`:**
- في `useRejectUser` و `useDeleteUser`: استبدال الحذف اليدوي من كل جدول باستدعاء واحد للـ Edge Function
- بما ان الجداول مرتبطة بـ `auth.users` عبر triggers (وليس foreign keys مباشرة)، سنحذف من الجداول العامة اولا ثم نستدعي الدالة لحذف من auth

### 2. تحديد عدد محاولات تسجيل الدخول

**الحل:** اضافة rate limiting على مستوى الفرونتند مع عداد محاولات فاشلة.

**تعديل `src/contexts/AuthContext.tsx`:**
- اضافة state لعدد المحاولات الفاشلة و وقت القفل
- بعد 5 محاولات فاشلة متتالية، قفل تسجيل الدخول لمدة 5 دقائق
- عرض رسالة واضحة بالوقت المتبقي
- اعادة العداد عند نجاح تسجيل الدخول

**تعديل `src/pages/AuthPage.tsx` و `src/pages/student/StudentAuthPage.tsx`:**
- اضافة عرض حالة القفل (عداد تنازلي) وتعطيل زر تسجيل الدخول اثناء القفل

### التفاصيل التقنية

**Edge Function (delete-user):**
- تتحقق من صلاحية المدير عبر فك JWT وفحص الدور في user_roles
- تستخدم `createClient` مع `SUPABASE_SERVICE_ROLE_KEY` للوصول الى Admin API
- الحذف من auth.users يفعّل ON DELETE CASCADE على اي foreign keys

**Rate Limiting:**
- يُخزن في state المكون (يُفقد عند اعادة التحميل - وهذا مقبول كطبقة حماية اولية)
- الصيغة: بعد 5 محاولات فاشلة → قفل 5 دقائق → يعاد العداد

