ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS unique_user_subject_name;
ALTER TABLE public.subjects ADD CONSTRAINT unique_user_subject_name_type UNIQUE (user_id, name, type);