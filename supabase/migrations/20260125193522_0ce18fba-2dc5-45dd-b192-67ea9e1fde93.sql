-- Create table for professor unavailability
CREATE TABLE public.professor_unavailability (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
    day public.day_of_week NOT NULL,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    all_day BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Unique constraint to prevent duplicate entries
    UNIQUE (professor_id, day, start_time, end_time)
);

-- Enable Row Level Security
ALTER TABLE public.professor_unavailability ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on professor_unavailability"
ON public.professor_unavailability
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_professor_unavailability_professor_id ON public.professor_unavailability(professor_id);
CREATE INDEX idx_professor_unavailability_day ON public.professor_unavailability(day);