
# خطة إصلاح عرض الجداول المحفوظة

## المشكلة الحالية

عند اختيار جدول محفوظ (مثل "all" الذي يحتوي على كل الدفعات):
1. النظام يفعّل الجدول ويجلب محاضراته من قاعدة البيانات ✓
2. لكن عند العرض، يقوم بفلترة المحاضرات بناءً على `selectedGroupId` المختار في قسم التوليد
3. إذا كان `selectedGroupId` = دفعة معينة (مثل "2")، سيُخفي كل محاضرات الدفعات الأخرى

## الحل المقترح

فصل منطق "الدفعة المختارة للتوليد" عن "عرض الجدول المحفوظ":

### 1. إضافة state جديد للتحكم في وضع العرض

| الملف | التغيير |
|-------|---------|
| `src/pages/TimetablePage.tsx` | إضافة state لتتبع ما إذا كنا نعرض جدول محفوظ |

```typescript
// State جديد لتحديد ما إذا كان يتم عرض جدول محفوظ
const [viewingScheduleId, setViewingScheduleId] = useState<string | null>(null);
```

### 2. تعديل منطق الفلترة

عند عرض جدول محفوظ، لا نطبق فلترة الدفعة:

```typescript
// قبل
if (selectedGroupId && selectedGroupId !== 'all') {
  entries = entries.filter((entry) => entry.subject?.group_id === selectedGroupId);
}

// بعد
// لا نفلتر حسب الدفعة إذا كنا نعرض جدولاً محفوظاً
if (!viewingScheduleId && selectedGroupId && selectedGroupId !== 'all') {
  entries = entries.filter((entry) => entry.subject?.group_id === selectedGroupId);
}
```

### 3. تعديل handleActivateSchedule

عند تفعيل جدول محفوظ، نحفظ ID الجدول ونتجاهل الفلترة:

```typescript
const handleActivateSchedule = useCallback((scheduleId: string) => {
  setViewingScheduleId(scheduleId);  // تحديد أننا نعرض جدول محفوظ
  setHasDraft(false);
  activateSchedule.mutate(scheduleId);
}, [activateSchedule]);
```

### 4. تعديل handleGenerateSchedule

عند توليد جدول جديد، نخرج من وضع "عرض الجدول المحفوظ":

```typescript
const handleGenerateSchedule = async () => {
  setViewingScheduleId(null);  // الخروج من وضع عرض الجدول المحفوظ
  // ... باقي الكود
};
```

### 5. تحسين العرض البصري

إظهار معلومات واضحة عن الجدول المعروض:

- إذا كان `viewingScheduleId` موجود: عرض اسم الجدول المحفوظ مع badge "جدول محفوظ"
- إذا لم يكن موجوداً: عرض الدفعة المختارة للتوليد

---

## ملخص التغييرات

| الملف | التغيير |
|-------|---------|
| `src/pages/TimetablePage.tsx` | إضافة `viewingScheduleId` state وتعديل منطق الفلترة |

## السلوك المتوقع بعد التعديل

1. **عند اختيار جدول محفوظ**: يُعرض الجدول كاملاً دون أي فلترة
2. **عند توليد جدول جديد**: تُطبق الفلترة حسب الدفعة المختارة في قسم التوليد
3. **عند تغيير الدفعة في قسم التوليد** بينما نعرض جدول محفوظ: يبقى الجدول المحفوظ معروضاً كاملاً (لا تتأثر الفلترة)
