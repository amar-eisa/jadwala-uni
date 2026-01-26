
-- إضافة قيد فريد على مستوى المستخدم لمنع تكرار الفترات الزمنية
ALTER TABLE public.time_slots
ADD CONSTRAINT unique_user_time_slot 
UNIQUE (user_id, day, start_time, end_time);

-- تحديث foreign key في schedule_entries لحذف السجلات المرتبطة تلقائياً
ALTER TABLE public.schedule_entries
DROP CONSTRAINT IF EXISTS schedule_entries_time_slot_id_fkey;

ALTER TABLE public.schedule_entries
ADD CONSTRAINT schedule_entries_time_slot_id_fkey
FOREIGN KEY (time_slot_id) 
REFERENCES public.time_slots(id) 
ON DELETE CASCADE;

-- نفس الشيء للـ foreign keys الأخرى لضمان سلامة الحذف
ALTER TABLE public.schedule_entries
DROP CONSTRAINT IF EXISTS schedule_entries_room_id_fkey;

ALTER TABLE public.schedule_entries
ADD CONSTRAINT schedule_entries_room_id_fkey
FOREIGN KEY (room_id) 
REFERENCES public.rooms(id) 
ON DELETE CASCADE;

ALTER TABLE public.schedule_entries
DROP CONSTRAINT IF EXISTS schedule_entries_subject_id_fkey;

ALTER TABLE public.schedule_entries
ADD CONSTRAINT schedule_entries_subject_id_fkey
FOREIGN KEY (subject_id) 
REFERENCES public.subjects(id) 
ON DELETE CASCADE;
