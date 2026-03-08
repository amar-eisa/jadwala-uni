

## سجل النشاطات (Audit Log) — تتبع شامل

### الوضع الحالي
- جدول `activity_logs` موجود في قاعدة البيانات مع RLS ✅
- `logActivity()` و `useActivityLogs()` و `ActivityLogPanel` موجودين ✅
- **المشكلة**: `logActivity` مستخدم فقط في `useSavedSchedules.ts` (الجداول فقط)
- لا يوجد تتبع للقاعات، الأساتذة، المجموعات، المواد
- سجل النشاطات غير معروض في لوحة التحكم الرئيسية

### التعديلات المطلوبة

**1. إضافة `logActivity` لجميع عمليات CRUD (4 ملفات):**

| Hook | العمليات المتتبعة |
|------|------------------|
| `useRooms.ts` | created/updated/deleted room |
| `useProfessors.ts` | created/updated/deleted professor |
| `useStudentGroups.ts` | created/updated/deleted group |
| `useSubjects.ts` | created/updated/deleted subject |

في كل `onSuccess` لـ create/update/delete، نضيف استدعاء `logActivity` مع اسم العنصر ونوع العملية.

**2. عرض سجل النشاطات في لوحة التحكم (`Dashboard.tsx`):**
- إضافة `useActivityLogs` و `ActivityLogPanel` أسفل قسم "إجراءات سريعة"
- عرض آخر 20 نشاط

### مثال على التعديل في كل hook:

```typescript
// useRooms.ts - useCreateRoom
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['rooms'] });
  toast({ title: 'تم إضافة القاعة بنجاح' });
  logActivity('created', 'room', data.id, { name: data.name });
},
```

| ملف | تعديل |
|-----|-------|
| `src/hooks/useRooms.ts` | إضافة `logActivity` لـ create/update/delete |
| `src/hooks/useProfessors.ts` | إضافة `logActivity` لـ create/update/delete |
| `src/hooks/useStudentGroups.ts` | إضافة `logActivity` لـ create/update/delete |
| `src/hooks/useSubjects.ts` | إضافة `logActivity` لـ create/update/delete |
| `src/pages/Dashboard.tsx` | عرض `ActivityLogPanel` في لوحة التحكم |

