
# خطة إضافة نظام المستخدمين والمصادقة

## نظرة عامة
سنقوم بإضافة نظام مصادقة كامل مع عزل البيانات لكل مستخدم، بحيث يمتلك كل مستخدم بياناته الخاصة من قاعات ودكاترة ومجموعات ومواد وجداول.

---

## المرحلة 1: تغييرات قاعدة البيانات

### 1.1 إنشاء جدول profiles
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- سياسة: المستخدم يرى بياناته فقط
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger لإنشاء profile تلقائياً عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2 إضافة عمود user_id لجميع الجداول
سنضيف عمود `user_id` للجداول التالية مع ربطه بـ `auth.users`:
- `rooms`
- `professors`
- `student_groups`
- `subjects`
- `time_slots`
- `schedule_entries`
- `professor_unavailability`

```sql
-- مثال لجدول rooms
ALTER TABLE public.rooms 
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- تحديث البيانات الموجودة (اختياري - سيتم حذفها لاحقاً أو تجاهلها)
-- حذف السياسات القديمة وإنشاء سياسات جديدة
DROP POLICY IF EXISTS "Allow all operations on rooms" ON public.rooms;

CREATE POLICY "Users can CRUD own rooms" ON public.rooms
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 1.3 تحديث سياسات RLS لجميع الجداول
كل جدول سيحتاج:
- حذف السياسة القديمة (Allow all operations)
- إنشاء سياسة جديدة تسمح للمستخدم برؤية وتعديل بياناته فقط

---

## المرحلة 2: صفحة تسجيل الدخول والتسجيل

### 2.1 إنشاء صفحة Auth جديدة (`src/pages/AuthPage.tsx`)
- تصميم متناسق مع باقي التطبيق
- دعم تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
- دعم إنشاء حساب جديد
- التحقق من صحة المدخلات باستخدام Zod
- رسائل خطأ واضحة ومفهومة
- إعادة توجيه للوحة التحكم بعد تسجيل الدخول

### 2.2 مكونات الصفحة:
```text
┌─────────────────────────────────────────┐
│              شعار النظام               │
│         نظام إدارة الجداول الجامعية      │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  [تسجيل الدخول] | [إنشاء حساب]  │   │
│   ├─────────────────────────────────┤   │
│   │                                 │   │
│   │  البريد الإلكتروني              │   │
│   │  ┌───────────────────────────┐  │   │
│   │  │ email@example.com        │  │   │
│   │  └───────────────────────────┘  │   │
│   │                                 │   │
│   │  كلمة المرور                    │   │
│   │  ┌───────────────────────────┐  │   │
│   │  │ ********                 │  │   │
│   │  └───────────────────────────┘  │   │
│   │                                 │   │
│   │  (عند التسجيل: الاسم الكامل)    │   │
│   │                                 │   │
│   │  ┌───────────────────────────┐  │   │
│   │  │      تسجيل الدخول         │  │   │
│   │  └───────────────────────────┘  │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## المرحلة 3: إدارة حالة المصادقة

### 3.1 إنشاء Auth Context (`src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### 3.2 حماية المسارات
- إنشاء مكون `ProtectedRoute` يتحقق من تسجيل الدخول
- إعادة توجيه غير المسجلين إلى صفحة تسجيل الدخول
- إعادة توجيه المسجلين من صفحة Auth إلى لوحة التحكم

---

## المرحلة 4: تحديث Hooks لدعم user_id

### 4.1 تحديث جميع الـ Hooks
كل hook يحتاج تعديل لـ:
- **جلب البيانات**: البيانات ستُفلتر تلقائياً بواسطة RLS
- **إضافة بيانات**: إضافة `user_id` تلقائياً عند الإنشاء

```typescript
// مثال: useCreateRoom
mutationFn: async (room: { name: string; type: RoomType }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('يجب تسجيل الدخول');
  
  const { data, error } = await supabase
    .from('rooms')
    .insert({ ...room, user_id: user.id })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 4.2 الملفات المتأثرة:
| الملف | التغيير |
|-------|---------|
| `useRooms.ts` | إضافة user_id عند الإنشاء |
| `useProfessors.ts` | إضافة user_id عند الإنشاء |
| `useStudentGroups.ts` | إضافة user_id عند الإنشاء |
| `useSubjects.ts` | إضافة user_id عند الإنشاء |
| `useTimeSlots.ts` | إضافة user_id عند الإنشاء |
| `useSchedule.ts` | إضافة user_id عند الإنشاء |
| `useProfessorUnavailability.ts` | إضافة user_id عند الإنشاء |

---

## المرحلة 5: تحديث التطبيق الرئيسي

### 5.1 تحديث App.tsx
```typescript
// إضافة AuthProvider
<AuthProvider>
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
    {/* ... باقي المسارات محمية */}
  </Routes>
</AuthProvider>
```

### 5.2 تحديث Layout
- إضافة زر تسجيل الخروج
- عرض اسم المستخدم أو البريد الإلكتروني

---

## المرحلة 6: تفعيل Auto-Confirm للبريد الإلكتروني

- تفعيل التأكيد التلقائي للحسابات الجديدة لتسهيل الاختبار
- يمكن تعطيله لاحقاً للإنتاج

---

## ملخص الملفات

### ملفات جديدة:
| الملف | الوصف |
|-------|-------|
| `src/pages/AuthPage.tsx` | صفحة تسجيل الدخول والتسجيل |
| `src/contexts/AuthContext.tsx` | سياق المصادقة |
| `src/components/ProtectedRoute.tsx` | حماية المسارات |

### ملفات معدلة:
| الملف | التغيير |
|-------|---------|
| `src/App.tsx` | إضافة AuthProvider والمسارات المحمية |
| `src/components/Layout.tsx` | إضافة زر تسجيل الخروج واسم المستخدم |
| `src/hooks/useRooms.ts` | إضافة user_id |
| `src/hooks/useProfessors.ts` | إضافة user_id |
| `src/hooks/useStudentGroups.ts` | إضافة user_id |
| `src/hooks/useSubjects.ts` | إضافة user_id |
| `src/hooks/useTimeSlots.ts` | إضافة user_id |
| `src/hooks/useSchedule.ts` | إضافة user_id |
| `src/hooks/useProfessorUnavailability.ts` | إضافة user_id |
| `src/types/database.ts` | إضافة أنواع Profile و user_id |

### تغييرات قاعدة البيانات (Migration):
- إنشاء جدول `profiles`
- إضافة عمود `user_id` لـ 7 جداول
- تحديث سياسات RLS لـ 8 جداول
- إنشاء trigger لإنشاء profile تلقائياً

---

## التفاصيل التقنية

### التحقق من المدخلات (Validation Schema):
```typescript
const authSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').optional(),
});
```

### معالجة الأخطاء:
- خطأ "User already registered" -> "هذا البريد الإلكتروني مسجل مسبقاً"
- خطأ "Invalid credentials" -> "البريد الإلكتروني أو كلمة المرور غير صحيحة"

---

## النتيجة المتوقعة

1. **صفحة تسجيل دخول أنيقة** متناسقة مع تصميم النظام
2. **عزل كامل للبيانات** - كل مستخدم يرى بياناته فقط
3. **أمان محسّن** عبر RLS policies
4. **تجربة مستخدم سلسة** مع إعادة توجيه تلقائية
5. **دعم متعدد المستخدمين** - كل جامعة/مؤسسة تستخدم حسابها الخاص
