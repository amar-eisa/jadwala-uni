
-- Allow anonymous (not logged in) users to read student_groups
CREATE POLICY "Anyone can view student groups"
ON public.student_groups
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read active schedules
CREATE POLICY "Anyone can view active schedules"
ON public.saved_schedules
FOR SELECT
TO anon
USING (is_active = true);

-- Allow anonymous users to read schedule entries from active schedules
CREATE POLICY "Anyone can view active schedule entries"
ON public.schedule_entries
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM saved_schedules ss
  WHERE ss.id = schedule_entries.schedule_id AND ss.is_active = true
));

-- Allow anonymous users to read time_slots
CREATE POLICY "Anyone can view time slots"
ON public.time_slots
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read rooms
CREATE POLICY "Anyone can view rooms"
ON public.rooms
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read subjects
CREATE POLICY "Anyone can view subjects"
ON public.subjects
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read professors
CREATE POLICY "Anyone can view professors"
ON public.professors
FOR SELECT
TO anon
USING (true);
