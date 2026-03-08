

## تشخيص المشكلة

من الكونسول والـ session replay:
1. تسجيل الدخول ينجح ✅ (`SIGNED_IN` event يصل)
2. `AuthContext.loading` يصبح `false` ✅
3. **لكن `ProtectedRoute` يعلق على `subscriptionLoading`** ❌ (سطر 31-40)

المشكلة: بعد تسجيل الدخول، `useUserSubscription` يبدأ جلب بيانات الاشتراك لكن لا يوجد timeout - إذا تأخر أو فشل الطلب، يبقى النظام على "جاري التحميل" للأبد.

## الحل

**تعديل `src/components/ProtectedRoute.tsx`:**
- إزالة شاشة التحميل الخاصة بـ `subscriptionLoading` بالكامل
- عرض المحتوى مباشرة بعد تسجيل الدخول
- التحقق من الاشتراك فقط عندما تكون البيانات متاحة فعلاً (إذا `isPending` و `!isLoading` → توجيه لصفحة الانتظار)

```text
الحالي:
login → auth loading ✓ → subscription loading ∞ → علق!

المطلوب:  
login → auth loading ✓ → عرض المحتوى فوراً → (في الخلفية) إذا pending → توجيه
```

تعديل واحد بسيط: بدلاً من حظر العرض أثناء تحميل الاشتراك، يتم عرض المحتوى مباشرة والتوجيه فقط عند التأكد أن الحالة `pending`.

| ملف | تعديل |
|-----|-------|
| `src/components/ProtectedRoute.tsx` | إزالة حظر `subscriptionLoading` وعرض المحتوى فوراً |

