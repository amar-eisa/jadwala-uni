
# خطة تعديل نظام توليد الجداول حسب الدفعة

## نظرة عامة
تعديل نظام توليد الجداول ليكون حسب كل دفعة (مجموعة طلابية) بشكل منفصل، مع إمكانية حفظ عدة جداول، وتحسين تصدير PDF ليشمل هوية المؤسسة.

---

## التغييرات المطلوبة

### 1. تعديل قاعدة البيانات

**إضافة عمود `group_id` لجدول schedule_entries:**

| الجدول | التغيير |
|--------|---------|
| `schedule_entries` | إضافة عمود `group_id` (uuid, nullable) لتحديد المجموعة التي ينتمي لها الجدول |

```sql
ALTER TABLE public.schedule_entries 
ADD COLUMN group_id uuid REFERENCES public.student_groups(id) ON DELETE CASCADE;
```

---

### 2. تعديل واجهة المستخدم (TimetablePage.tsx)

**إضافة محدد المجموعة:**
- قائمة منسدلة لاختيار الدفعة قبل التوليد
- زر توليد يعمل للدفعة المختارة فقط
- إمكانية عرض جدول دفعة محددة

```text
الشكل الجديد:
┌─────────────────────────────────────────────────┐
│  [اختر الدفعة: ▼]  [توليد جدول الدفعة]  [مسح]  │
│  [تصدير PDF]                                    │
└─────────────────────────────────────────────────┘
```

**التغييرات:**
- state جديد: `selectedGroupId` لتخزين الدفعة المختارة
- تمرير `group_id` للـ edge function عند التوليد
- فلترة العرض تلقائياً حسب الدفعة المختارة

---

### 3. تعديل Edge Function (generate-schedule)

**تعديل المنطق:**
- استقبال `group_id` اختياري في الطلب
- إذا تم تحديد `group_id`:
  - توليد الجدول للمواد الخاصة بهذه الدفعة فقط
  - عدم مسح جداول الدفعات الأخرى
- حفظ `group_id` في كل entry

```typescript
const { user_id, group_id } = await req.json();

// Filter subjects by group if specified
let subjectsQuery = supabase.from('subjects').select('*').eq('user_id', user_id);
if (group_id) {
  subjectsQuery = subjectsQuery.eq('group_id', group_id);
}

// Clear only entries for this group
if (group_id) {
  await supabase.from('schedule_entries')
    .delete()
    .eq('user_id', user_id)
    .eq('group_id', group_id);
} else {
  await supabase.from('schedule_entries')
    .delete()
    .eq('user_id', user_id);
}
```

---

### 4. تعديل Hook (useSchedule.ts)

**تعديل `useGenerateSchedule`:**
```typescript
export function useGenerateSchedule() {
  return useMutation({
    mutationFn: async (groupId?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: { user_id: user.id, group_id: groupId }
      });
      return data;
    },
  });
}
```

**تعديل `useClearSchedule`:**
```typescript
export function useClearSchedule() {
  return useMutation({
    mutationFn: async (groupId?: string) => {
      let query = supabase.from('schedule_entries').delete();
      if (groupId) {
        query = query.eq('group_id', groupId);
      }
      // ...
    },
  });
}
```

---

### 5. تحسين تصدير PDF (usePdfExport.ts)

**التصميم الجديد للـ PDF:**

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│            جدول المحاضرات لدفعة: [اسم المجموعة]            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [جدول المحاضرات]                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           [شعار Connect]  جميع الحقوق محفوظة              │
│     للتواصل: jadwala.app@gmail.com - +294 128150105        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**التغييرات في ExportOptions:**
```typescript
interface ExportOptions {
  filename?: string;
  title?: string;
  groupName?: string;     // اسم الدفعة
  orientation?: 'portrait' | 'landscape';
}
```

**إضافة Footer:**
```typescript
// Footer section
const footerY = pageHeight - 20;

// Add Connect logo
const connectLogoBase64 = await loadImage('/src/assets/connect-logo.png');
pdf.addImage(connectLogoBase64, 'PNG', 10, footerY - 8, 15, 15);

// Footer text
pdf.setFontSize(8);
pdf.text('جميع الحقوق محفوظة', 30, footerY);
pdf.text('للتواصل: jadwala.app@gmail.com - +294 128150105', 30, footerY + 5);
```

---

### 6. تعديل عنوان التصدير

**في TimetablePage.tsx:**
```typescript
const handleExportPdf = () => {
  const selectedGroup = groups?.find(g => g.id === selectedGroupId);
  const groupName = selectedGroup?.name || 'جميع الدفعات';
  
  exportToPdf('timetable-grid', { 
    filename: `timetable-${groupName}`,
    title: `جدول المحاضرات لدفعة: ${groupName}`,
    groupName,
    orientation: 'landscape'
  });
};
```

---

## ملخص الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| قاعدة البيانات | إضافة عمود `group_id` |
| `supabase/functions/generate-schedule/index.ts` | دعم التوليد حسب الدفعة |
| `src/hooks/useSchedule.ts` | تمرير `group_id` للتوليد والمسح |
| `src/hooks/usePdfExport.ts` | إضافة Header وFooter احترافي |
| `src/pages/TimetablePage.tsx` | إضافة واجهة اختيار الدفعة |

---

## تفاصيل تقنية

### سير العمل الجديد:
1. المستخدم يختار الدفعة من القائمة المنسدلة
2. يضغط "توليد جدول الدفعة"
3. النظام يولد جدول لهذه الدفعة فقط دون التأثير على جداول الدفعات الأخرى
4. يمكن للمستخدم تكرار العملية لدفعات أخرى
5. عند التصدير، يتم تصدير جدول الدفعة المختارة بالتنسيق المطلوب

### تحميل شعار Connect:
سيتم تحويل الشعار إلى Base64 واستخدامه في PDF لضمان ظهوره بشكل صحيح.
