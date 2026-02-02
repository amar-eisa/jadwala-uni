
# خطة إصلاح عرض الجدول المحفوظ عند تفعيله

## المشكلة

عند الضغط على جدول محفوظ من القائمة المنسدلة، يتم تحديث علامة `is_active` فقط، لكن **لا يتغير الجدول المعروض** لأن:

1. دالة `useScheduleEntries()` تجلب **كل** الإدخالات بدون فلترة حسب `schedule_id`
2. لا يوجد ربط بين الجدول النشط وما يتم عرضه

---

## تحليل الكود الحالي

### useActivateSchedule (المشكلة)

```typescript
// يقوم فقط بتحديث is_active
await supabase
  .from('saved_schedules')
  .update({ is_active: true })
  .eq('id', scheduleId);

// لا يقوم بإبلاغ useScheduleEntries لإعادة الجلب!
```

### useScheduleEntries (المشكلة)

```typescript
// يجلب كل الإدخالات بدون فلترة
const { data, error } = await supabase
  .from('schedule_entries')
  .select(`*,...`);  // ← لا يوجد .eq('schedule_id', activeScheduleId)!
```

---

## الحل المقترح

### 1. تعديل `useScheduleEntries` لدعم الفلترة

| التغيير | التفاصيل |
|---------|----------|
| إضافة معامل `scheduleId` | فلترة الإدخالات حسب الجدول المحفوظ |
| إضافة `scheduleId` للـ `queryKey` | إعادة الجلب عند تغيير الجدول |

```typescript
export function useScheduleEntries(scheduleId?: string | null) {
  return useQuery({
    queryKey: ['schedule_entries', scheduleId],
    queryFn: async () => {
      let query = supabase
        .from('schedule_entries')
        .select(`*,room:rooms(*),time_slot:time_slots(*),subject:subjects(*,...)`);
      
      // فلترة حسب الجدول المحفوظ إذا كان موجوداً
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });
}
```

### 2. تعديل `useActivateSchedule` لتحديث الـ cache

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
  queryClient.invalidateQueries({ queryKey: ['schedule_entries'] }); // إضافة هذا السطر
  toast({ title: 'تم تفعيل الجدول' });
},
```

### 3. تعديل `TimetablePage` لتمرير الجدول النشط

```typescript
// الحصول على الجدول النشط
const activeSchedule = savedSchedules?.find(s => s.is_active);

// تمرير schedule_id للـ hook
const { data: scheduleEntries, isLoading } = useScheduleEntries(activeSchedule?.id);
```

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/hooks/useSchedule.ts` | تعديل `useScheduleEntries` لقبول `scheduleId` |
| `src/hooks/useSavedSchedules.ts` | إضافة invalidate للـ `schedule_entries` |
| `src/pages/TimetablePage.tsx` | تمرير `activeSchedule?.id` للـ hook |

---

## تفاصيل التنفيذ

### تعديل useSchedule.ts

```typescript
export function useScheduleEntries(scheduleId?: string | null) {
  return useQuery({
    queryKey: ['schedule_entries', scheduleId],
    queryFn: async () => {
      let query = supabase
        .from('schedule_entries')
        .select(`
          *,
          room:rooms(*),
          time_slot:time_slots(*),
          subject:subjects(
            *,
            professor:professors(*),
            group:student_groups(*)
          )
        `);
      
      // فلترة حسب الجدول المحفوظ
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleEntry[];
    },
  });
}
```

### تعديل useSavedSchedules.ts

```typescript
// في useActivateSchedule - onSuccess
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['saved_schedules'] });
  queryClient.invalidateQueries({ queryKey: ['schedule_entries'] }); // جديد
  toast({ title: 'تم تفعيل الجدول' });
},
```

### تعديل TimetablePage.tsx

```typescript
// قبل استدعاء useScheduleEntries
const { data: savedSchedules, isLoading: isLoadingSaved } = useSavedSchedules();
const activeSchedule = savedSchedules?.find(s => s.is_active);

// تمرير ID الجدول النشط
const { data: scheduleEntries, isLoading } = useScheduleEntries(activeSchedule?.id);
```

---

## تدفق العمل بعد الإصلاح

```text
المستخدم يضغط على جدول محفوظ
          ↓
useActivateSchedule يُحدّث is_active في قاعدة البيانات
          ↓
invalidateQueries للـ saved_schedules و schedule_entries
          ↓
useSavedSchedules يُعيد الجلب → activeSchedule يتغير
          ↓
useScheduleEntries يُعيد الجلب بفلتر schedule_id الجديد
          ↓
الجدول المعروض يتغير ✓
```

---

## النتيجة المتوقعة

- عند الضغط على جدول محفوظ، يتم عرض محتواه فوراً
- كل جدول محفوظ يعرض إدخالاته الخاصة فقط
- التبديل بين الجداول يعمل بسلاسة
