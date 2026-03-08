

## خطة: إضافة تقرير تفصيلي بعد توليد الجدول

### الفكرة
بعد توليد الجدول بنجاح، يظهر **Dialog** يعرض تقريراً تفصيلياً عن التوزيع يشمل:
- توزيع المحاضرات لكل مجموعة في كل يوم
- نسبة النظري مقابل العملي لكل مجموعة
- ملخص إجمالي

### التغييرات المطلوبة

#### 1. تعديل Edge Function `generate-schedule/index.ts`
إضافة بيانات التقرير في response الـ Edge Function:
- عدد الجلسات لكل مجموعة في كل يوم
- عدد النظري والعملي لكل مجموعة
- الجلسات التي لم تُجدول (إن وجدت) مع السبب

البيانات ستُبنى من المتغيرات الموجودة فعلاً (`groupDaySessions`, `dayTheoryCount`, `dayPracticalCount`) بالإضافة لتتبع جديد per-group theory/practical.

#### 2. تعديل `src/hooks/useSchedule.ts`
- تمرير بيانات التقرير من `onSuccess` عبر callback أو state بدلاً من عرض toast فقط

#### 3. تعديل `src/pages/TimetablePage.tsx`
- إضافة state لبيانات التقرير و Dialog مخصص
- عرض جدول يوضح لكل مجموعة: عدد المحاضرات في كل يوم، نسبة النظري/العملي
- عرض الجلسات غير المُجدولة إن وجدت
- زر لإغلاق التقرير

### هيكل بيانات التقرير (من Edge Function)

```typescript
{
  report: {
    groups: {
      [groupId]: {
        name: string,
        days: { [day]: { total: number, theory: number, practical: number } },
        totals: { theory: number, practical: number, total: number }
      }
    },
    unscheduled: { subjectId: string, reason: string }[],
    overall: { scheduled: number, total: number, successRate: number }
  }
}
```

### التصميم
- Dialog بعنوان "تقرير توزيع الجدول"
- جدول لكل مجموعة: الأيام كأعمدة، مع أعداد (نظري/عملي) في كل خلية
- شريط تقدم يوضح نسبة النظري/العملي الإجمالية
- تنبيه أحمر إذا كانت هناك جلسات لم تُجدول

