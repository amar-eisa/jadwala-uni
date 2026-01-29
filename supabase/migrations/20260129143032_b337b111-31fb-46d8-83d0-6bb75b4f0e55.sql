-- Add group_id column to schedule_entries for per-group schedule generation
ALTER TABLE public.schedule_entries 
ADD COLUMN group_id uuid REFERENCES public.student_groups(id) ON DELETE CASCADE;