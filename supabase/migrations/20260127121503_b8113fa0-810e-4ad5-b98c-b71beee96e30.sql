-- 1. تعديل Trigger لجعل الحسابات الجديدة في حالة انتظار
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_name, status, price)
  VALUES (new.id, 'free', 'pending', 0);
  RETURN new;
END;
$function$;

-- 2. إضافة سياسة حذف للمدراء على جدول profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 3. إضافة سياسات حذف للمدراء على الجداول المرتبطة
CREATE POLICY "Admins can delete rooms" ON public.rooms
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete professors" ON public.professors
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete student_groups" ON public.student_groups
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subjects" ON public.subjects
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete time_slots" ON public.time_slots
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schedule_entries" ON public.schedule_entries
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete professor_unavailability" ON public.professor_unavailability
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscriptions" ON public.subscriptions
  FOR DELETE USING (has_role(auth.uid(), 'admin'));