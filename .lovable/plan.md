

## خطة: إضافة تتبع الأخطاء باستخدام Sentry

### ما هو Sentry؟
أداة لمراقبة الأخطاء في بيئة الإنتاج — تسجل كل خطأ يحدث للمستخدمين مع تفاصيل (المتصفح، المسار، المستخدم، stack trace).

### المتطلبات
- **Sentry DSN**: مفتاح عام (publishable) يُضاف مباشرة في الكود — لا يحتاج تخزين كسر.
- ستحتاج إنشاء حساب مجاني على [sentry.io](https://sentry.io) وإنشاء مشروع React للحصول على DSN.

### التغييرات المطلوبة

#### 1. إضافة مكتبة Sentry
تثبيت `@sentry/react` كاعتماد جديد.

#### 2. تهيئة Sentry في `src/main.tsx`
```tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN_HERE",
  environment: import.meta.env.MODE, // development / production
  enabled: import.meta.env.PROD, // فقط في الإنتاج
  tracesSampleRate: 0.2, // 20% من الطلبات
});
```

#### 3. إضافة Error Boundary في `src/App.tsx`
لف التطبيق بـ `Sentry.ErrorBoundary` مع صفحة خطأ عربية:
```tsx
<Sentry.ErrorBoundary fallback={<ErrorFallback />}>
  <Routes>...</Routes>
</Sentry.ErrorBoundary>
```

#### 4. إنشاء مكون `src/components/ErrorFallback.tsx`
صفحة خطأ بسيطة بالعربية تظهر عند حدوث خطأ غير متوقع مع زر "إعادة المحاولة".

#### 5. تسجيل هوية المستخدم (اختياري)
في `AuthContext.tsx` عند تسجيل الدخول:
```tsx
Sentry.setUser({ id: user.id, email: user.email });
```
وعند الخروج: `Sentry.setUser(null);`

### ما تحتاج فعله
1. إنشاء حساب على sentry.io (مجاني)
2. إنشاء مشروع React
3. نسخ الـ DSN (يبدأ بـ `https://...@...sentry.io/...`)
4. إعطائي الـ DSN لإضافته في الكود

هل لديك DSN من Sentry، أم تريدني أرشدك لإنشاء الحساب والمشروع؟

