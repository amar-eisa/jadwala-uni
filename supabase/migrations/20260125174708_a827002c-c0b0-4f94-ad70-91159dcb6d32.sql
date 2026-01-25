-- Add subject type enum
CREATE TYPE public.subject_type AS ENUM ('theory', 'practical');

-- Add new columns to subjects table
ALTER TABLE public.subjects
ADD COLUMN type public.subject_type NOT NULL DEFAULT 'theory',
ADD COLUMN weekly_hours integer NOT NULL DEFAULT 2;

-- Add constraint to ensure weekly_hours is positive
ALTER TABLE public.subjects
ADD CONSTRAINT subjects_weekly_hours_positive CHECK (weekly_hours > 0 AND weekly_hours <= 20);