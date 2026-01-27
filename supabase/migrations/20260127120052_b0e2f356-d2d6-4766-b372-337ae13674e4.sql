-- إصلاح جدول الأساتذة
ALTER TABLE public.professors DROP CONSTRAINT IF EXISTS professors_name_key;
ALTER TABLE public.professors ADD CONSTRAINT unique_user_professor_name UNIQUE (user_id, name);

-- إصلاح جدول المجموعات
ALTER TABLE public.student_groups DROP CONSTRAINT IF EXISTS student_groups_name_key;
ALTER TABLE public.student_groups ADD CONSTRAINT unique_user_group_name UNIQUE (user_id, name);

-- إصلاح جدول المواد (على اسم المادة والكود)
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_name_key;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_code_key;
ALTER TABLE public.subjects ADD CONSTRAINT unique_user_subject_name UNIQUE (user_id, name);
ALTER TABLE public.subjects ADD CONSTRAINT unique_user_subject_code UNIQUE (user_id, code);