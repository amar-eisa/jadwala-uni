
# خطة تقييد صلاحيات المستخدمين بناءً على حالة الاشتراك

## الوصف

عند قيام المدير (Admin) بتغيير حالة اشتراك المستخدم إلى أي حالة غير "نشط" (active)، سيتمكن المستخدم من **عرض** بياناته فقط، ولن يستطيع:
- إضافة بيانات جديدة
- تعديل البيانات الموجودة  
- حذف أي بيانات

## التعديلات المطلوبة

### 1. إنشاء Hook جديد لجلب حالة الاشتراك

**ملف جديد: `src/hooks/useSubscription.ts`**

```typescript
export function useUserSubscription() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user_subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });
}

export function useIsActiveSubscription() {
  const { data: subscription, isLoading } = useUserSubscription();
  
  return {
    isActive: subscription?.status === 'active',
    isLoading,
    subscription
  };
}
```

### 2. تحديث AuthContext لتضمين حالة الاشتراك

**ملف: `src/contexts/AuthContext.tsx`**

سيتم إضافة:
- `subscription` state
- `isActiveSubscription` computed value
- جلب الاشتراك عند تسجيل الدخول
- تحديث الاشتراك عند تغيير الـ auth state

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: Subscription | null;      // جديد
  isActiveSubscription: boolean;           // جديد
  signIn: (...) => Promise<...>;
  signUp: (...) => Promise<...>;
  signOut: () => Promise<void>;
}
```

### 3. تحديث جميع Hooks لفحص حالة الاشتراك

سيتم تعديل الـ mutations (create, update, delete) في الملفات التالية:

| الملف | الـ Hooks المتأثرة |
|-------|-------------------|
| `useRooms.ts` | useCreateRoom, useUpdateRoom, useDeleteRoom |
| `useProfessors.ts` | useCreateProfessor, useUpdateProfessor, useDeleteProfessor |
| `useStudentGroups.ts` | useCreateStudentGroup, useUpdateStudentGroup, useDeleteStudentGroup |
| `useSubjects.ts` | useCreateSubject, useUpdateSubject, useDeleteSubject |
| `useTimeSlots.ts` | useCreateTimeSlot, useUpdateTimeSlot, useDeleteTimeSlot |
| `useSchedule.ts` | useGenerateSchedule, useClearSchedule, useMoveScheduleEntry |

**مثال للتعديل:**
```typescript
export function useCreateRoom() {
  const { isActiveSubscription } = useIsActiveSubscription();
  
  return useMutation({
    mutationFn: async (room: { name: string; type: RoomType }) => {
      // فحص الاشتراك أولاً
      if (!isActiveSubscription) {
        throw new Error('اشتراكك غير نشط. يرجى التواصل مع المدير لتفعيل الاشتراك.');
      }
      // ... باقي الكود
    },
    // ...
  });
}
```

### 4. تحديث واجهة المستخدم لإظهار حالة التقييد

**أ) إنشاء مكون تنبيه جديد:**

**ملف جديد: `src/components/SubscriptionBanner.tsx`**

```typescript
export function SubscriptionBanner() {
  const { isActiveSubscription, isLoading, subscription } = useIsActiveSubscription();
  
  if (isLoading || isActiveSubscription) return null;
  
  const statusLabels = {
    inactive: 'غير نشط',
    expired: 'منتهي',
    cancelled: 'ملغي'
  };
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>اشتراكك {statusLabels[subscription?.status]}</AlertTitle>
      <AlertDescription>
        لا يمكنك إضافة أو تعديل أو حذف البيانات. يمكنك فقط عرض البيانات الموجودة.
        يرجى التواصل مع المدير لتفعيل اشتراكك.
      </AlertDescription>
    </Alert>
  );
}
```

**ب) تعديل صفحات الإدارة لإخفاء/تعطيل أزرار التعديل:**

سيتم تعديل الصفحات التالية:
- `RoomsPage.tsx`
- `ProfessorsPage.tsx`
- `GroupsPage.tsx`
- `SubjectsPage.tsx`
- `TimeSlotsPage.tsx`
- `TimetablePage.tsx`

**مثال:**
```typescript
export default function RoomsPage() {
  const { isActiveSubscription } = useIsActiveSubscription();
  
  return (
    <Layout>
      <SubscriptionBanner />  {/* تنبيه في أعلى الصفحة */}
      
      {/* إخفاء زر الإضافة للمستخدمين غير النشطين */}
      {isActiveSubscription && (
        <Button>
          <Plus className="h-4 w-4" />
          إضافة قاعة
        </Button>
      )}
      
      {/* تعطيل أزرار التعديل والحذف */}
      <Button
        disabled={!isActiveSubscription}
        // ...
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </Layout>
  );
}
```

### 5. إضافة طبقة أمان إضافية في قاعدة البيانات (اختياري - موصى به)

**Migration SQL:**

إنشاء دالة للتحقق من حالة الاشتراك:

```sql
-- دالة للتحقق من حالة اشتراك المستخدم
CREATE OR REPLACE FUNCTION public.is_subscription_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
  )
$$;
```

تحديث سياسات RLS لجميع الجداول:

```sql
-- مثال: تحديث سياسة جدول rooms
DROP POLICY IF EXISTS "Users can CRUD own rooms" ON public.rooms;

-- السماح بالقراءة للجميع
CREATE POLICY "Users can view own rooms"
ON public.rooms
FOR SELECT
USING (auth.uid() = user_id);

-- السماح بالإضافة فقط للمشتركين النشطين
CREATE POLICY "Active users can insert rooms"
ON public.rooms
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- السماح بالتحديث فقط للمشتركين النشطين
CREATE POLICY "Active users can update rooms"
ON public.rooms
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- السماح بالحذف فقط للمشتركين النشطين
CREATE POLICY "Active users can delete rooms"
ON public.rooms
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);
```

## ملخص الملفات المتأثرة

### ملفات جديدة:
| الملف | الوصف |
|-------|-------|
| `src/hooks/useSubscription.ts` | Hook لجلب وفحص حالة الاشتراك |
| `src/components/SubscriptionBanner.tsx` | مكون تنبيه لعرض حالة الاشتراك غير النشط |

### ملفات سيتم تعديلها:
| الملف | التعديلات |
|-------|-----------|
| `src/contexts/AuthContext.tsx` | إضافة subscription state و isActiveSubscription |
| `src/hooks/useRooms.ts` | فحص الاشتراك في mutations |
| `src/hooks/useProfessors.ts` | فحص الاشتراك في mutations |
| `src/hooks/useStudentGroups.ts` | فحص الاشتراك في mutations |
| `src/hooks/useSubjects.ts` | فحص الاشتراك في mutations |
| `src/hooks/useTimeSlots.ts` | فحص الاشتراك في mutations |
| `src/hooks/useSchedule.ts` | فحص الاشتراك في mutations |
| `src/pages/RoomsPage.tsx` | تعطيل/إخفاء أزرار التعديل + Banner |
| `src/pages/ProfessorsPage.tsx` | تعطيل/إخفاء أزرار التعديل + Banner |
| `src/pages/GroupsPage.tsx` | تعطيل/إخفاء أزرار التعديل + Banner |
| `src/pages/SubjectsPage.tsx` | تعطيل/إخفاء أزرار التعديل + Banner |
| `src/pages/TimeSlotsPage.tsx` | تعطيل/إخفاء أزرار التعديل + Banner |
| `src/pages/TimetablePage.tsx` | تعطيل أزرار توليد/مسح الجدول + Banner |

### Migration جديد:
- `is_subscription_active` function
- تحديث RLS policies لجميع الجداول (rooms, professors, student_groups, subjects, time_slots, schedule_entries)

## التأثير على تجربة المستخدم

### للمستخدم النشط (status = 'active'):
- ✅ يستطيع عرض جميع بياناته
- ✅ يستطيع إضافة بيانات جديدة
- ✅ يستطيع تعديل البيانات
- ✅ يستطيع حذف البيانات
- ✅ يستطيع توليد الجدول

### للمستخدم غير النشط (status != 'active'):
- ✅ يستطيع عرض جميع بياناته الموجودة
- ❌ لا يستطيع إضافة بيانات جديدة
- ❌ لا يستطيع تعديل البيانات
- ❌ لا يستطيع حذف البيانات
- ❌ لا يستطيع توليد/مسح الجدول
- ⚠️ يرى تنبيه واضح بحالة اشتراكه

## الأمان

- ✅ فحص مزدوج: Frontend + Backend (RLS)
- ✅ لا يمكن تجاوز القيود عبر API مباشرة
- ✅ حماية كاملة من التلاعب

## اختبار الميزة

بعد التنفيذ، يجب اختبار:
1. تسجيل دخول مستخدم نشط → يمكنه CRUD
2. تغيير حالة المستخدم إلى "غير نشط" من لوحة الإدارة
3. تحديث صفحة المستخدم → يرى التنبيه
4. محاولة الإضافة/التعديل/الحذف → يفشل مع رسالة خطأ
5. يمكنه فقط عرض البيانات
