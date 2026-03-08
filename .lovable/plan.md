

## خطة التنفيذ: اختبارات الخوارزمية + التحميل الكسول

### المهمة 1: كتابة اختبارات Collision Detection

بما أن خوارزمية التوليد تعمل داخل Edge Function (Deno)، لا يمكن اختبارها مباشرة من Vitest. الحل: **استخراج منطق Collision Detection إلى دوال نقية (pure functions)** في ملف مشترك يمكن اختباره.

#### الملفات الجديدة:
1. **`src/lib/scheduleUtils.ts`** — دوال نقية مستخرجة من الخوارزمية:
   - `checkRoomConflict(roomId, timeSlotId, occupied)` — هل القاعة مشغولة؟
   - `checkProfessorConflict(professorId, timeSlotId, occupied)` — هل الأستاذ مشغول؟
   - `checkGroupConflict(groupId, timeSlotId, occupied)` — هل المجموعة مشغولة؟
   - `isProfessorAvailable(professorId, timeSlot, unavailabilityRules)` — هل الأستاذ متاح؟
   - `findAvailableSlot(subject, rooms, timeSlots, occupiedSets, unavailability)` — إيجاد أول فترة وقاعة متاحة
   - `getGroupDaySessionCount(groupId, day, tracker)` — عدد جلسات المجموعة في اليوم
   - `isTypeBalanced(day, isTheory, theoryCounts, practicalCounts, round)` — هل التوزيع النظري/العملي متوازن؟

2. **`src/lib/__tests__/scheduleUtils.test.ts`** — اختبارات شاملة:
   - اختبار عدم وجود تعارض عند فترات مختلفة
   - اختبار كشف تعارض القاعة (نفس القاعة + نفس الفترة)
   - اختبار كشف تعارض الأستاذ (نفس الأستاذ + نفس الفترة)
   - اختبار كشف تعارض المجموعة (نفس المجموعة + نفس الفترة)
   - اختبار عدم توفر الأستاذ (يوم كامل / فترة محددة)
   - اختبار حد المجموعة اليومي (max 4)
   - اختبار توازن النظري/العملي
   - اختبار `findAvailableSlot` يعيد أول خيار متاح
   - اختبار `findAvailableSlot` يعيد null عند عدم التوفر

3. تحديث **Edge Function** لاستيراد نفس المنطق (أو إبقاء نسخة مطابقة مع تعليق يربطها بالملف المشترك).

---

### المهمة 2: التحميل الكسول (Code Splitting)

تحويل استيراد الصفحات في `src/App.tsx` من استيراد مباشر إلى `React.lazy` مع `Suspense`.

#### الصفحات التي ستُحمّل كسولاً (غير أساسية):
- `ReportsPage`
- `ActivityLogPage`
- `AdminPage`
- `SettingsPage`
- `ManageSubscriptionsPage`
- `StudentAuthPage`
- `StudentDashboard`
- `StudentProfilePage`
- `TimetablePage`
- `ProfessorsPage`
- `GroupsPage`
- `SubjectsPage`
- `TimeSlotsPage`
- `RoomsPage`

#### الصفحات التي تبقى محمّلة مباشرة (أساسية):
- `Dashboard` (الصفحة الرئيسية)
- `AuthPage` (تسجيل الدخول)
- `PendingApprovalPage`
- `NotFound`

#### التغييرات في `App.tsx`:
```tsx
import { lazy, Suspense } from 'react';

const RoomsPage = lazy(() => import('./pages/RoomsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
// ... etc

// Wrap routes with Suspense + loading fallback
<Suspense fallback={<div className="flex items-center justify-center min-h-screen">...</div>}>
  <Routes>...</Routes>
</Suspense>
```

هذا سيقلل حجم الحزمة الأولية بشكل ملحوظ لأن كل صفحة ستُحمّل فقط عند الحاجة.

