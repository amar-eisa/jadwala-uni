
-- schedule_entries indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_id ON public.schedule_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_schedule_id ON public.schedule_entries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_group_id ON public.schedule_entries(group_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_time_slot_id ON public.schedule_entries(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_subject_id ON public.schedule_entries(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_room_id ON public.schedule_entries(room_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_schedule ON public.schedule_entries(user_id, schedule_id);

-- saved_schedules indexes
CREATE INDEX IF NOT EXISTS idx_saved_schedules_user_id ON public.saved_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_schedules_group_id ON public.saved_schedules(group_id);
CREATE INDEX IF NOT EXISTS idx_saved_schedules_is_active ON public.saved_schedules(is_active) WHERE is_active = true;

-- subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_group_id ON public.subjects(group_id);
CREATE INDEX IF NOT EXISTS idx_subjects_professor_id ON public.subjects(professor_id);

-- professors index
CREATE INDEX IF NOT EXISTS idx_professors_user_id ON public.professors(user_id);

-- rooms index
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON public.rooms(user_id);

-- time_slots indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_user_id ON public.time_slots(user_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_day ON public.time_slots(day);

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_group_id ON public.notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- activity_logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- professor_unavailability indexes
CREATE INDEX IF NOT EXISTS idx_professor_unavailability_professor_id ON public.professor_unavailability(professor_id);
CREATE INDEX IF NOT EXISTS idx_professor_unavailability_day ON public.professor_unavailability(day);
