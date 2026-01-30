
# خطة إصلاح وتفعيل نظام الصلاحيات

## الحالة الحالية

بعد مراجعة النظام، تبين أن هناك مشكلة رئيسية واحدة تحتاج إلى إصلاح:

**المشكلة:** الـ Triggers غير مرتبطة بجدول auth.users

الدوال (Functions) موجودة وجاهزة:
- `handle_new_user` - إنشاء الملف الشخصي
- `handle_new_user_role` - تعيين دور المستخدم
- `handle_new_user_subscription` - إنشاء اشتراك بحالة "في الانتظار"

لكن هذه الدوال لا تُستدعى تلقائياً لأن الـ Triggers غير مفعّلة.

---

## التغييرات المطلوبة

### 1. تفعيل Triggers على auth.users

سيتم إنشاء/إعادة إنشاء الـ Triggers التالية:

| Trigger | الوظيفة | الدالة المستدعاة |
|---------|---------|------------------|
| `on_auth_user_created` | إنشاء ملف شخصي للمستخدم الجديد | `handle_new_user()` |
| `on_auth_user_created_role` | تعيين دور 'user' تلقائياً | `handle_new_user_role()` |
| `on_auth_user_created_subscription` | إنشاء اشتراك بحالة 'pending' | `handle_new_user_subscription()` |

```sql
-- إنشاء trigger للملف الشخصي
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- إنشاء trigger للدور
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- إنشاء trigger للاشتراك
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
```

---

## ما هو موجود وصحيح (لا يحتاج تعديل)

### واجهة الإدارة
- صفحة `/admin` محمية ومتاحة للمديرين فقط
- تبويب "في الانتظار" يعرض الحسابات الجديدة
- أزرار "اعتماد" و"رفض" تعمل بشكل صحيح

### صلاحيات المدير
- عرض جميع المستخدمين
- تغيير دور المستخدم (مستخدم ↔ مدير)
- تعديل حالة الاشتراك
- تحديد تاريخ بداية ونهاية الاشتراك
- حذف المستخدمين

### تدفق إنشاء الحساب
- المستخدم ينشئ حساب جديد
- يظهر رسالة "حسابك في انتظار موافقة المدير"
- يتم توجيهه لصفحة `/pending-approval`
- المدير يرى الحساب في لوحة الإدارة
- المدير يوافق أو يرفض الحساب

---

## ملخص الملفات المتأثرة

| الملف/المكون | نوع التغيير |
|--------------|-------------|
| قاعدة البيانات | إنشاء 3 Triggers |

**لا حاجة لتعديل أي ملفات برمجية** - الكود الحالي سيعمل بشكل صحيح بمجرد تفعيل الـ Triggers.

---

## النتيجة المتوقعة

بعد تفعيل الـ Triggers:

1. **عند إنشاء حساب جديد:**
   - يتم إنشاء profile تلقائياً
   - يتم تعيين role = 'user' تلقائياً
   - يتم إنشاء subscription بحالة 'pending' تلقائياً

2. **المستخدم الجديد:**
   - يرى رسالة "في انتظار الموافقة"
   - لا يمكنه الوصول للنظام حتى يوافق المدير

3. **المدير:**
   - يرى الحسابات الجديدة في تبويب "في الانتظار"
   - يمكنه الموافقة مع تحديد تاريخ انتهاء الاشتراك
   - يمكنه رفض الحساب وحذف البيانات
   - يمكنه تغيير أي مستخدم إلى مدير
