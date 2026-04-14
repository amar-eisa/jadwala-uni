

## إعداد Amplitude Analytics في التطبيق

### الفكرة
دمج Amplitude SDK لتتبع جميع الأحداث المهمة: المصادقة، التنقل، وعمليات الجداول الدراسية.

### الخطوات

**1. تخزين API Key بأمان**
- مفتاح Amplitude هو مفتاح عام (publishable key)، لذا سيتم تخزينه مباشرة في الكود كـ environment variable
- سنطلب منك إدخاله عبر أداة الأسرار

**2. تثبيت `@amplitude/analytics-browser`**

**3. إنشاء ملف `src/lib/amplitude.ts`** — وحدة مركزية للتحليلات:
- دالة `initAmplitude()` لتهيئة SDK
- دالة `trackEvent(name, properties)` للتتبع
- دوال مخصصة لكل نوع حدث:
  - `trackLogin()` / `trackLogout()` / `trackSignup()`
  - `trackPageView(pageName)`
  - `trackScheduleCreate()` / `trackScheduleEdit()` / `trackScheduleSave()`
  - `identifyUser(userId, properties)` لربط الأحداث بالمستخدم

**4. تعديل `src/main.tsx`** — استدعاء `initAmplitude()` عند بدء التطبيق

**5. تعديل `src/contexts/AuthContext.tsx`** — تتبع أحداث المصادقة:
- عند تسجيل الدخول: `trackLogin()`
- عند تسجيل الخروج: `trackLogout()`
- عند إنشاء حساب: `trackSignup()`
- عند تغيير المستخدم: `identifyUser()`

**6. تعديل `src/components/Layout.tsx`** — تتبع التنقل:
- إضافة `useEffect` مع `useLocation()` لتتبع كل تغيير صفحة تلقائياً

**7. تعديل hooks الجداول** — تتبع العمليات:
- `useSchedule.ts`: تتبع إنشاء/تعديل/حذف الجداول
- `useSavedSchedules.ts`: تتبع حفظ الجداول

### الأحداث المتتبعة

| الحدث | الوقت |
|-------|-------|
| `user_login` | عند تسجيل الدخول بنجاح |
| `user_signup` | عند إنشاء حساب جديد |
| `user_logout` | عند تسجيل الخروج |
| `page_view` | عند كل تنقل بين الصفحات |
| `schedule_created` | عند إنشاء جدول |
| `schedule_saved` | عند حفظ جدول |
| `schedule_exported` | عند تصدير جدول |

