

## تحسينات وظيفية - خطة التنفيذ

### 1. تصدير الجدول بصيغ متعددة (Excel, CSV)

**ملف جديد: `src/hooks/useExport.ts`**
- دالة `exportToCSV` تحول بيانات الجدول (entries + timeSlots) الى ملف CSV بترميز UTF-8 BOM للعربية
- دالة `exportToExcel` تنشئ ملف Excel (.xlsx) باستخدام بناء XML بسيط (SpreadsheetML) بدون مكتبة خارجية
- كلا الدالتين تأخذ نفس البيانات: الايام، الفترات الزمنية، والمحاضرات

**تعديل `src/pages/TimetablePage.tsx`:**
- تحويل زر التصدير الحالي الى dropdown menu يحتوي 3 خيارات: PDF, Excel, CSV
- استخدام DropdownMenu من shadcn

**تعديل `src/components/SavedSchedulesList.tsx`:**
- اضافة خيارات Excel و CSV بجانب زر PDF الحالي عبر dropdown

### 2. نظام إشعارات داخلي للطلاب

**Migration جديد:**
- جدول `notifications` بالاعمدة: id, user_id (nullable for broadcast), group_id, title, message, type (schedule_update, general), is_read, created_at
- RLS: الطلاب يقرأون اشعاراتهم فقط، المدراء يضيفون
- تفعيل Realtime على الجدول

**تعديل `src/hooks/useSavedSchedules.ts`:**
- عند تفعيل جدول (activate)، ادراج اشعار تلقائي في جدول notifications للمجموعة المعنية

**ملف جديد: `src/hooks/useNotifications.ts`**
- جلب الاشعارات غير المقروءة للطالب
- تحديث حالة القراءة
- اشتراك Realtime

**تعديل `src/pages/student/StudentDashboard.tsx`:**
- اضافة جرس اشعارات في الهيدر مع عدد غير المقروءة
- عرض قائمة الاشعارات في popover

### 3. سجل تغييرات (Activity Log)

**Migration جديد:**
- جدول `activity_logs` بالاعمدة: id, user_id, action (created, updated, deleted, activated, generated), entity_type (schedule, subject, professor, room, group), entity_id, details (jsonb), created_at
- RLS: المستخدم يرى سجلاته، المدير يرى الكل

**ملف جديد: `src/hooks/useActivityLog.ts`**
- دالة `logActivity` لتسجيل الاحداث
- hook لجلب السجلات مع فلترة حسب النوع والتاريخ

**تعديل الهوكات الموجودة:**
- اضافة `logActivity` في: useSaveSchedule, useActivateSchedule, useDeleteSavedSchedule, useGenerateSchedule, useClearSchedule

**ملف جديد: `src/components/ActivityLogPanel.tsx`**
- عرض السجلات كقائمة زمنية (timeline) مع ايقونات حسب نوع الحدث
- فلترة حسب النوع والتاريخ

**تعديل `src/pages/TimetablePage.tsx`:**
- اضافة تبويب او زر لعرض سجل التغييرات

### 4. نسخ جدول من فصل سابق كقالب

**تعديل `src/hooks/useSavedSchedules.ts`:**
- اضافة mutation `useDuplicateSchedule` تنسخ جدول محفوظ: تنشئ saved_schedule جديد وتنسخ جميع schedule_entries مع IDs جديدة

**تعديل `src/components/SavedSchedulesList.tsx`:**
- اضافة زر "نسخ كقالب" (Copy icon) لكل جدول محفوظ
- عند الضغط يظهر dialog لتسمية النسخة الجديدة

**تعديل `src/pages/TimetablePage.tsx`:**
- دعم فتح النسخة المنسوخة مباشرة بعد الانشاء

### التفاصيل التقنية

**هيكل جدول notifications:**
```text
notifications
├── id (uuid, PK)
├── group_id (uuid, FK -> student_groups)
├── title (text)
├── message (text)
├── type (text: schedule_update | general)
├── is_read (boolean, default false)
├── user_id (uuid, nullable - for targeted)
└── created_at (timestamptz)
```

**هيكل جدول activity_logs:**
```text
activity_logs
├── id (uuid, PK)
├── user_id (uuid)
├── action (text)
├── entity_type (text)
├── entity_id (uuid, nullable)
├── details (jsonb)
└── created_at (timestamptz)
```

**تصدير CSV/Excel:**
- الهيكل: صف لكل فترة زمنية، عمود لكل يوم
- كل خلية تحتوي: اسم المادة + الاستاذ + القاعة
- ترميز UTF-8 BOM لدعم العربية في Excel

