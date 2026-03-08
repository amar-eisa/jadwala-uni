

## خطة تنفيذ جميع التحسينات

### 1. الوضع الداكن (Dark Mode)
- متغيرات CSS الداكنة **موجودة بالفعل** في `index.css` (`.dark` class)
- `next-themes` مثبت بالفعل
- **المطلوب**: إضافة `ThemeProvider` في `App.tsx`، وزر تبديل في الشريط الجانبي (`Layout.tsx`)

### 2. بحث وفلترة في الجداول
إضافة حقل بحث فوق كل جدول في 4 صفحات:
- `RoomsPage.tsx` — فلترة بالاسم والنوع
- `ProfessorsPage.tsx` — فلترة بالاسم
- `GroupsPage.tsx` — فلترة بالاسم
- `SubjectsPage.tsx` — فلترة بالاسم والدكتور والمجموعة

### 3. صفحة سجل النشاطات المفصلة
- إنشاء `src/pages/ActivityLogPage.tsx` — صفحة مستقلة مع فلترة بنوع الكيان، نوع العملية، والتاريخ
- إضافة Route في `App.tsx`
- إضافة رابط في الـ sidebar

### 4. تحسين تجربة الموبايل
- جعل الجداول قابلة للتمرير أفقياً (`overflow-x-auto`)
- تحسين أحجام الأزرار وتباعدها على الشاشات الصغيرة
- تحسين header الموبايل

### الملفات المتأثرة

| ملف | تعديل |
|-----|-------|
| `src/App.tsx` | إضافة ThemeProvider + route سجل النشاطات |
| `src/components/Layout.tsx` | زر تبديل Dark Mode + رابط سجل النشاطات |
| `src/pages/RoomsPage.tsx` | إضافة بحث + تحسين موبايل |
| `src/pages/ProfessorsPage.tsx` | إضافة بحث + تحسين موبايل |
| `src/pages/GroupsPage.tsx` | إضافة بحث + تحسين موبايل |
| `src/pages/SubjectsPage.tsx` | إضافة بحث + تحسين موبايل |
| `src/pages/ActivityLogPage.tsx` | **ملف جديد** — صفحة سجل نشاطات مفصلة |

> **ملاحظة**: الإشعارات الفورية (Realtime) موجودة بالفعل في النظام مع جدول `notifications` ونظام كامل. سيتم التركيز على التحسينات الأربعة الأخرى.

