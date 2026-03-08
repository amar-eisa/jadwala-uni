

## تشخيص المشكلة

المشكلة في `src/components/ProtectedRoute.tsx`: ترتيب فحص الحالات خاطئ.

**السبب الجذري:** عندما يكون المستخدم غير مسجل دخول (`user = null`)، استعلام الاشتراك يبقى معطل (`enabled: false`) وبالتالي `subscriptionLoading = true` للأبد. الكود الحالي يفحص `subscriptionLoading` **قبل** فحص وجود المستخدم، فيبقى على شاشة التحميل ولا يعيد التوجيه لصفحة تسجيل الدخول.

```text
الترتيب الحالي (خاطئ):
1. if (loading || subscriptionLoading) → spinner  ← يتوقف هنا!
2. if (!user) → redirect /auth
3. if (isPending) → redirect /pending

الترتيب الصحيح:
1. if (loading) → spinner
2. if (!user) → redirect /auth  ← يعيد التوجيه فوراً
3. if (subscriptionLoading) → spinner
4. if (isPending) → redirect /pending
```

## الحل

**تعديل `src/components/ProtectedRoute.tsx`:**
- فصل فحص `loading` (auth) عن `subscriptionLoading`
- فحص وجود المستخدم أولاً قبل انتظار الاشتراك
- فحص `subscriptionLoading` فقط بعد التأكد من وجود المستخدم

