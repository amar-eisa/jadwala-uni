-- Drop old unique constraints that don't account for schedule_id
ALTER TABLE schedule_entries DROP CONSTRAINT IF EXISTS schedule_entries_room_id_time_slot_id_key;
ALTER TABLE schedule_entries DROP CONSTRAINT IF EXISTS schedule_entries_time_slot_id_subject_id_key;

-- Create new unique constraints that include schedule_id
-- This allows same room+timeslot in different schedules (versions)
-- For NULL schedule_id (drafts), we use COALESCE to treat them as a single "draft" space
CREATE UNIQUE INDEX schedule_entries_room_timeslot_schedule_unique 
ON schedule_entries (room_id, time_slot_id, COALESCE(schedule_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE UNIQUE INDEX schedule_entries_timeslot_subject_schedule_unique 
ON schedule_entries (time_slot_id, subject_id, COALESCE(schedule_id, '00000000-0000-0000-0000-000000000000'::uuid));