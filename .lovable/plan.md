
# خطة إصلاح مشكلة الحذف المتكرر للفترات الزمنية

## تشخيص المشكلة

### السبب الجذري:
المشكلة تحدث بسبب عدم تطابق بين **طريقة العرض** و **طريقة الحذف**:

1. **عند الإضافة**: عندما يضيف المستخدم فترة زمنية (مثل 08:00 - 10:00) ويختار 6 أيام عمل، يتم إنشاء **6 سجلات منفصلة** في قاعدة البيانات (سجل لكل يوم):
   ```
   - Saturday 08:00-10:00 (id: abc123)
   - Sunday 08:00-10:00 (id: def456)
   - Monday 08:00-10:00 (id: ghi789)
   - Tuesday 08:00-10:00 (id: jkl012)
   - Wednesday 08:00-10:00 (id: mno345)
   - Thursday 08:00-10:00 (id: pqr678)
   ```

2. **عند العرض**: الكود يعرض فقط **الفترات الفريدة** (uniqueTimeRanges) بناءً على الأوقات فقط، متجاهلاً الأيام:
   ```typescript
   const uniqueTimeRanges = timeSlots?.reduce((acc, slot) => {
     const key = `${slot.start_time}-${slot.end_time}`;
     if (!acc.find(s => `${s.start_time}-${s.end_time}` === key)) {
       acc.push(slot);  // يضيف أول سجل فقط
     }
     return acc;
   }, [] as typeof timeSlots) || [];
   ```
   النتيجة: يعرض سجل واحد فقط (08:00 - 10:00)

3. **عند الحذف**: يتم حذف السجل بناءً على الـ id:
   ```typescript
   const handleDelete = async (id: string) => {
     await deleteTimeSlot.mutateAsync(id);  // يحذف سجل واحد فقط
   };
   ```
   النتيجة: يحذف سجل واحد فقط من الـ 6 سجلات

4. **بعد الحذف**: 
   - يتم invalidate للـ query وإعادة تحميل البيانات
   - الآن لدينا 5 سجلات متبقية بنفس الأوقات
   - `uniqueTimeRanges` يجد سجل آخر بنفس الأوقات ويعرضه مرة أخرى
   - **يبدو للمستخدم أن الحذف لم يحدث!**

### لماذا يحتاج 3-4 ضغطات؟
لأن لديك 6 سجلات (6 أيام)، وكل ضغطة تحذف سجل واحد فقط. بعد 3-4 ضغطات، يتبقى سجل أو اثنان حتى يختفي في النهاية.

---

## الحل المقترح

### التعديلات المطلوبة:

#### 1. تعديل TimeSlotsPage.tsx
تمرير معلومات إضافية للدالة handleDelete:

```typescript
const handleDelete = async (slot: TimeSlot) => {
  // حذف جميع الفترات الزمنية بنفس الأوقات للمستخدم الحالي
  await deleteTimeSlot.mutateAsync({
    start_time: slot.start_time,
    end_time: slot.end_time
  });
};
```

وتحديث استدعاء الدالة:
```typescript
<Button
  variant="ghost"
  size="icon"
  className="icon-button text-destructive hover:text-destructive"
  onClick={() => handleDelete(slot)}  // تمرير الكائن بدلاً من الـ id فقط
>
  <Trash2 className="h-4 w-4" />
</Button>
```

#### 2. تعديل useTimeSlots.ts
تحديث دالة `useDeleteTimeSlot` لحذف جميع الفترات الزمنية بنفس الأوقات:

```typescript
export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: { start_time: string; end_time: string }) => {
      // الحصول على المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يجب تسجيل الدخول');

      // حذف جميع الفترات الزمنية بنفس الأوقات للمستخدم الحالي
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('user_id', user.id)
        .eq('start_time', params.start_time)
        .eq('end_time', params.end_time);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_slots'] });
      toast({ title: 'تم حذف الفترة الزمنية بنجاح' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في حذف الفترة الزمنية', description: error.message, variant: 'destructive' });
    },
  });
}
```

---

## آلية العمل بعد التعديل

### قبل التعديل:
```
1. المستخدم يضغط "حذف" للفترة 08:00-10:00
2. يحذف سجل واحد (مثلاً Saturday 08:00-10:00)
3. تبقى 5 سجلات أخرى
4. uniqueTimeRanges يجد Sunday 08:00-10:00 ويعرضها
5. المستخدم يضغط "حذف" مرة أخرى
6. يحذف Sunday 08:00-10:00
7. تكرار العملية 4-6 مرات حتى تُحذف جميع السجلات
```

### بعد التعديل:
```
1. المستخدم يضغط "حذف" للفترة 08:00-10:00
2. يحذف جميع السجلات بهذه الأوقات (6 سجلات دفعة واحدة)
3. لا توجد سجلات متبقية
4. تختفي الفترة الزمنية من الجدول مباشرة
```

---

## التحسينات الإضافية (اختيارية)

### 1. إضافة مؤشر لعدد الأيام
يمكن عرض عدد الأيام المرتبطة بكل فترة زمنية:

```typescript
// في TimeSlotsPage.tsx
const timeSlotsWithDays = uniqueTimeRanges.map(slot => {
  const daysCount = timeSlots?.filter(
    s => s.start_time === slot.start_time && s.end_time === slot.end_time
  ).length || 0;
  
  return { ...slot, daysCount };
});
```

وعرضها في الجدول:
```tsx
<TableCell className="text-center">
  <Badge variant="secondary">
    {slot.daysCount} أيام
  </Badge>
</TableCell>
```

### 2. إضافة تأكيد قبل الحذف
لتجنب الحذف بالخطأ:

```typescript
const handleDelete = async (slot: TimeSlot) => {
  const daysCount = timeSlots?.filter(
    s => s.start_time === slot.start_time && s.end_time === slot.end_time
  ).length || 0;
  
  const confirmed = window.confirm(
    `هل أنت متأكد من حذف هذه الفترة؟\nسيتم حذفها من ${daysCount} يوم/أيام`
  );
  
  if (confirmed) {
    await deleteTimeSlot.mutateAsync({
      start_time: slot.start_time,
      end_time: slot.end_time
    });
  }
};
```

### 3. إضافة مؤشر تحميل على الزر
لتوضيح أن العملية جارية:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="icon-button text-destructive hover:text-destructive"
  onClick={() => handleDelete(slot)}
  disabled={deleteTimeSlot.isPending}
>
  {deleteTimeSlot.isPending ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Trash2 className="h-4 w-4" />
  )}
</Button>
```

---

## الملفات التي سيتم تعديلها

1. **src/hooks/useTimeSlots.ts**
   - تعديل `useDeleteTimeSlot` لقبول `{ start_time, end_time }` بدلاً من `id`
   - إضافة شرط `user_id` للأمان
   - حذف جميع السجلات المطابقة

2. **src/pages/TimeSlotsPage.tsx**
   - تعديل `handleDelete` لتمرير الكائن الكامل
   - إضافة مؤشر عدد الأيام (اختياري)
   - إضافة تأكيد الحذف (اختياري)
   - إضافة مؤشر التحميل (اختياري)

---

## الاختبار المطلوب

بعد التعديلات، يجب اختبار:
1. ✅ إضافة فترة زمنية لـ 6 أيام
2. ✅ حذف الفترة بضغطة واحدة
3. ✅ التحقق من اختفاء الفترة مباشرة
4. ✅ التحقق من عدم تأثر فترات المستخدمين الآخرين
5. ✅ اختبار حذف فترات مختلفة

---

## الأمان

- ✅ يتم التحقق من `user_id` قبل الحذف
- ✅ RLS Policies تمنع حذف بيانات المستخدمين الآخرين
- ✅ لا يمكن حذف فترات زمنية تنتمي لمستخدمين آخرين
