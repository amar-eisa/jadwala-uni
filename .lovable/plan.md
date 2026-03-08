

## تحسين محاذاة وعرض الأعمدة في الجداول

### المشكلة
التطبيق RTL (عربي) لكن `TableHead` يستخدم `text-left` افتراضياً، مما يسبب محاذاة خاطئة. كذلك الجداول تحتاج تحسينات في العرض والتباعد.

### التعديلات

**1. `src/components/ui/table.tsx`:**
- تغيير `text-left` إلى `text-right` في `TableHead` لدعم RTL بشكل صحيح

**2. `src/pages/ReportsPage.tsx` - تحسينات شاملة:**

- إضافة `dir="rtl"` على كل `Table` لضمان المحاذاة الصحيحة
- توحيد `text-right` للأعمدة النصية (الأستاذ، القاعة، المادة)
- توحيد `text-center` للأعمدة الرقمية مع `whitespace-nowrap`
- إضافة `truncate` و `max-w-[200px]` لعمود المواد الطويل في جدول الأساتذة
- تحسين `min-w` للأعمدة الرئيسية لمنع الانكماش
- إضافة `text-right` لأعمدة المواد المتعارضة في جدول التعارضات

| ملف | تعديل |
|-----|-------|
| `src/components/ui/table.tsx` | تغيير `text-left` → `text-right` في TableHead |
| `src/pages/ReportsPage.tsx` | تحسين محاذاة وعرض أعمدة الجداول الخمسة |

