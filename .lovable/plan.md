
# خطة إصلاح صلاحيات الإدارة

## المشكلة
قسم الإدارة يظهر ولكن لا تظهر أي بيانات للمستخدمين أو الاشتراكات. السبب هو أن سياسات الأمان (RLS) في قاعدة البيانات معدّة بشكل خاطئ.

---

## التشخيص التقني

السياسات الحالية على جداول `profiles` و `subscriptions` و `user_roles` محددة كـ **RESTRICTIVE** بدلاً من **PERMISSIVE**:

**الفرق:**
- **PERMISSIVE (المطلوب)**: إذا مرت **أي** سياسة = السماح (منطق OR)
- **RESTRICTIVE (الحالي)**: يجب أن تمر **جميع** السياسات = السماح (منطق AND)

**النتيجة الحالية:**
عندما يحاول Admin قراءة profiles:
```text
سياسة 1: "Admins can view all profiles" → has_role(auth.uid(), 'admin') → TRUE ✓
سياسة 2: "Users can view own profile" → auth.uid() = id → FALSE ✗

النتيجة (AND): FALSE → لا يمكن الوصول!
```

---

## الحل المطلوب

تغيير جميع سياسات SELECT على الجداول التالية من RESTRICTIVE إلى PERMISSIVE:

| الجدول | السياسات المتأثرة |
|--------|------------------|
| `profiles` | Admins can view all profiles, Users can view own profile |
| `subscriptions` | Admins can view all subscriptions, Users can view own subscriptions |
| `user_roles` | Admins can view all roles, Users can view own roles |

---

## التغييرات في قاعدة البيانات

سيتم حذف السياسات القديمة وإنشاء سياسات جديدة كـ PERMISSIVE:

### 1. جدول profiles
```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- إنشاء سياسات جديدة (PERMISSIVE)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

### 2. جدول subscriptions
```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

-- إنشاء سياسات جديدة (PERMISSIVE)
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

### 3. جدول user_roles
```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- إنشاء سياسات جديدة (PERMISSIVE)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);
```

---

## النتيجة المتوقعة بعد التعديل

```text
سياسة 1: "Admins can view all profiles" → TRUE ✓
سياسة 2: "Users can view own profile" → FALSE (لملفات الآخرين)

النتيجة (OR): TRUE → يمكن الوصول! ✓
```

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| قاعدة البيانات | تعديل سياسات RLS |

**لا حاجة لتعديل أي ملفات برمجية** - الكود الحالي سيعمل بشكل صحيح بمجرد إصلاح السياسات.
