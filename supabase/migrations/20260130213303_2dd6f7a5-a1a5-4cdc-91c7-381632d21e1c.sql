-- Create saved_schedules table
CREATE TABLE public.saved_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  group_id UUID REFERENCES public.student_groups(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add schedule_id column to schedule_entries
ALTER TABLE public.schedule_entries 
ADD COLUMN schedule_id UUID REFERENCES public.saved_schedules(id) ON DELETE CASCADE;

-- Enable RLS on saved_schedules
ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_schedules
CREATE POLICY "Users can view own saved_schedules"
ON public.saved_schedules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Active users can insert saved_schedules"
ON public.saved_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_subscription_active(auth.uid()));

CREATE POLICY "Active users can update saved_schedules"
ON public.saved_schedules
FOR UPDATE
USING (auth.uid() = user_id AND is_subscription_active(auth.uid()));

CREATE POLICY "Active users can delete saved_schedules"
ON public.saved_schedules
FOR DELETE
USING (auth.uid() = user_id AND is_subscription_active(auth.uid()));

CREATE POLICY "Admins can delete saved_schedules"
ON public.saved_schedules
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_saved_schedules_user_id ON public.saved_schedules(user_id);
CREATE INDEX idx_saved_schedules_group_id ON public.saved_schedules(group_id);
CREATE INDEX idx_schedule_entries_schedule_id ON public.schedule_entries(schedule_id);