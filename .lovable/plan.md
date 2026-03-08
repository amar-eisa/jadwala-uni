

## تحسين تجربة الطالب

### 1. تحميل الجدول كصورة

**تعديل `src/components/student/StudentTimetableView.tsx`:**
- اضافة `id="student-timetable"` على عنصر الجدول
- اضافة زر "تحميل كصورة" يستخدم `html2canvas` (مثبت بالفعل) لتحويل الجدول الى صورة PNG وتنزيلها
- اضافة زر "تحميل PDF" يستخدم `usePdfExport` الموجود

**تعديل `src/pages/student/StudentDashboard.tsx`:**
- اضافة ازرار التحميل (صورة + PDF) بجانب زر "تغيير المجموعة"
- استخدام DropdownMenu بثلاث خيارات: صورة PNG، PDF، مشاركة (اختياري)

### 2. تنبيهات عند تغيير الجدول

**النظام موجود بالفعل** - تم تنفيذه في الخطوة السابقة:
- جدول `notifications` مع Realtime مفعّل
- `useNotifications` hook مع اشتراك realtime
- جرس الاشعارات في هيدر StudentDashboard
- ارسال اشعار تلقائي عند تفعيل جدول جديد

**تحسين اضافي:**
- اضافة اشتراك Realtime على `schedule_entries` في StudentDashboard لتحديث الجدول تلقائيا عند اي تعديل (بدون اعادة تحميل)
- عرض toast فوري عند تحديث الجدول مع رسالة "تم تحديث جدولك الدراسي"

### التفاصيل التقنية

**تحميل كصورة:**
- استخدام `html2canvas` مع `scale: 2` لجودة عالية
- اضافة wrapper مع هيدر يحتوي اسم المجموعة والتاريخ قبل التحويل (مشابه لمنطق PDF الحالي)
- تنزيل الملف كـ PNG

**Realtime للجدول:**
```text
supabase.channel('student-schedule-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_entries' })
  → invalidateQueries(['student-schedule'])
  → toast تحديث
```

