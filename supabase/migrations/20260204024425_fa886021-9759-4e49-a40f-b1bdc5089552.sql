-- Add version column to saved_schedules table
ALTER TABLE public.saved_schedules 
ADD COLUMN version integer NOT NULL DEFAULT 1;