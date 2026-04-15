

## تحسين التخزين المؤقت (Caching) للنظام

### الوضع الحالي
النظام يستخدم `React Query` لكن **بدون أي إعدادات تخزين مؤقت** — `QueryClient` مُعرّف بدون خيارات، مما يعني:
- كل مرة تفتح صفحة يُعاد جلب البيانات من الخادم
- البيانات تُعتبر "قديمة" فوراً (`staleTime: 0`)
- الاستثناء الوحيد: `useSubscription` عنده `staleTime: 30000`

### الخطة

**1. إعداد QueryClient بخيارات تخزين ذكية (`src/App.tsx`)**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 دقائق — البيانات تُعتبر حديثة
      gcTime: 10 * 60 * 1000,         // 10 دقائق — تبقى في الذاكرة
      refetchOnWindowFocus: false,     // لا إعادة جلب عند العودة للتبويب
      retry: 1,                        // محاولة واحدة فقط عند الفشل
    },
  },
});
```

**2. تخصيص staleTime حسب نوع البيانات في كل hook:**

| البيانات | staleTime | السبب |
|----------|-----------|-------|
| القاعات، المجموعات، الدكاترة، المواد | 10 دقائق | بيانات مرجعية نادراً ما تتغير |
| الفترات الزمنية | 10 دقائق | نفس السبب |
| الجدول الدراسي | 2 دقيقة | يتغير أكثر لكن ليس كل ثانية |
| الاشتراك | 30 ثانية (موجود) | حالة حساسة |
| الإشعارات | 1 دقيقة | تحتاج تحديث متكرر نسبياً |

**3. الملفات المتأثرة:**
- `src/App.tsx` — إعدادات QueryClient الافتراضية
- `src/hooks/useRooms.ts` — staleTime: 10 دقائق
- `src/hooks/useProfessors.ts` — staleTime: 10 دقائق
- `src/hooks/useStudentGroups.ts` — staleTime: 10 دقائق
- `src/hooks/useSubjects.ts` — staleTime: 10 دقائق
- `src/hooks/useTimeSlots.ts` — staleTime: 10 دقائق
- `src/hooks/useSchedule.ts` — staleTime: 2 دقيقة
- `src/hooks/useNotifications.ts` — staleTime: 1 دقيقة

### النتيجة المتوقعة
- التنقل بين الصفحات يصبح **فورياً** (البيانات محملة مسبقاً)
- عدد طلبات الخادم ينخفض بنسبة ~70%
- البيانات تتحدث تلقائياً بعد انتهاء مدة الصلاحية

