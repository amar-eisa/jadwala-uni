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

-- تحديث سياسات جدول rooms
DROP POLICY IF EXISTS "Users can CRUD own rooms" ON public.rooms;

CREATE POLICY "Users can view own rooms"
ON public.rooms
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert rooms"
ON public.rooms
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update rooms"
ON public.rooms
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete rooms"
ON public.rooms
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- تحديث سياسات جدول professors
DROP POLICY IF EXISTS "Users can CRUD own professors" ON public.professors;

CREATE POLICY "Users can view own professors"
ON public.professors
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert professors"
ON public.professors
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update professors"
ON public.professors
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete professors"
ON public.professors
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- تحديث سياسات جدول student_groups
DROP POLICY IF EXISTS "Users can CRUD own student_groups" ON public.student_groups;

CREATE POLICY "Users can view own student_groups"
ON public.student_groups
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert student_groups"
ON public.student_groups
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update student_groups"
ON public.student_groups
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete student_groups"
ON public.student_groups
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- تحديث سياسات جدول subjects
DROP POLICY IF EXISTS "Users can CRUD own subjects" ON public.subjects;

CREATE POLICY "Users can view own subjects"
ON public.subjects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert subjects"
ON public.subjects
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update subjects"
ON public.subjects
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete subjects"
ON public.subjects
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- تحديث سياسات جدول time_slots
DROP POLICY IF EXISTS "Users can CRUD own time_slots" ON public.time_slots;

CREATE POLICY "Users can view own time_slots"
ON public.time_slots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert time_slots"
ON public.time_slots
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update time_slots"
ON public.time_slots
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete time_slots"
ON public.time_slots
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- تحديث سياسات جدول schedule_entries
DROP POLICY IF EXISTS "Users can CRUD own schedule_entries" ON public.schedule_entries;

CREATE POLICY "Users can view own schedule_entries"
ON public.schedule_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert schedule_entries"
ON public.schedule_entries
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update schedule_entries"
ON public.schedule_entries
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete schedule_entries"
ON public.schedule_entries
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

-- تحديث سياسات جدول professor_unavailability
DROP POLICY IF EXISTS "Users can CRUD own professor_unavailability" ON public.professor_unavailability;

CREATE POLICY "Users can view own professor_unavailability"
ON public.professor_unavailability
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert professor_unavailability"
ON public.professor_unavailability
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can update professor_unavailability"
ON public.professor_unavailability
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);

CREATE POLICY "Active users can delete professor_unavailability"
ON public.professor_unavailability
FOR DELETE
USING (
  auth.uid() = user_id 
  AND public.is_subscription_active(auth.uid())
);