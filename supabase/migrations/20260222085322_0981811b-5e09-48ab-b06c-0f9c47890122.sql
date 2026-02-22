
-- Create student_profiles table
CREATE TABLE public.student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  student_id_number text NOT NULL,
  group_id uuid REFERENCES public.student_groups(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON public.student_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all student profiles" ON public.student_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert student profiles" ON public.student_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create student profile
CREATE OR REPLACE FUNCTION public.handle_new_student()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'student' THEN
    INSERT INTO public.student_profiles (user_id, full_name, email, student_id_number)
    VALUES (
      NEW.user_id,
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.user_id), ''),
      COALESCE((SELECT email FROM auth.users WHERE id = NEW.user_id), ''),
      COALESCE((SELECT raw_user_meta_data->>'student_id_number' FROM auth.users WHERE id = NEW.user_id), '')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_student_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();

-- Student RLS on existing tables
CREATE POLICY "Students can view all groups" ON public.student_groups
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view active schedules" ON public.saved_schedules
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'student') AND is_active = true);

CREATE POLICY "Students can view schedule entries" ON public.schedule_entries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'student') AND EXISTS (
    SELECT 1 FROM public.saved_schedules ss WHERE ss.id = schedule_id AND ss.is_active = true
  ));

CREATE POLICY "Students can view time slots" ON public.time_slots
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view rooms" ON public.rooms
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view subjects" ON public.subjects
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view professors" ON public.professors
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student'));
