-- حذف الـ constraint القديم الذي يمنع التكرار على مستوى الجدول بأكمله
-- هذا سيسمح لكل مستخدم بإضافة فتراته الزمنية الخاصة
ALTER TABLE public.time_slots
DROP CONSTRAINT IF EXISTS time_slots_day_start_time_end_time_key;