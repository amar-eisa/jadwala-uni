

## خطة: صفحة إدارة اشتراكات خارجية محمية بمفتاح سري

### الفكرة
إنشاء صفحة ويب مستقلة (بدون القائمة الجانبية أو تسجيل الدخول) للتحكم في اشتراكات المستخدمين، محمية بمفتاح سري يُمرر عبر الرابط. يمكن لـ n8n أو المدير فتحها مباشرة.

### الملفات المتأثرة

| ملف | نوع |
|-----|------|
| `src/pages/ManageSubscriptionsPage.tsx` | إنشاء جديد |
| `src/App.tsx` | إضافة route جديد |
| `supabase/functions/admin-subscriptions/index.ts` | Edge Function جديدة لجلب/تحديث البيانات |

### التفاصيل

**1. Edge Function `admin-subscriptions`**
- تتحقق من المفتاح السري `N8N_WEBHOOK_SECRET` (موجود بالفعل) عبر header `Authorization: Bearer`
- `GET` → جلب كل المستخدمين مع اشتراكاتهم وأدوارهم
- `POST` → تحديث اشتراك (approve/reject/update status) أو حذف مستخدم
- تستخدم `SUPABASE_SERVICE_ROLE_KEY` للوصول الكامل

**2. صفحة `ManageSubscriptionsPage`**
- رابط: `/manage-subscriptions?key=SECRET_KEY`
- تصميم بسيط ومستقل (بدون Layout/sidebar)
- تتحقق من المفتاح عبر query parameter وترسله مع كل طلب للـ Edge Function
- تعرض جدول المستخدمين مع:
  - الاسم، البريد، الهاتف
  - حالة الاشتراك، الخطة
  - أزرار: اعتماد، رفض، تعديل الاشتراك
- متجاوبة مع الموبايل (بطاقات)

**3. تحديث `App.tsx`**
- إضافة route عام: `/manage-subscriptions`

### الأمان
- المفتاح السري `N8N_WEBHOOK_SECRET` مُخزّن بالفعل في المشروع
- لا يمكن الوصول للبيانات بدون المفتاح الصحيح
- كل العمليات تمر عبر Edge Function (لا وصول مباشر لقاعدة البيانات من الصفحة)

