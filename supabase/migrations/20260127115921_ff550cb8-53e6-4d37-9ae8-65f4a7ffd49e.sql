-- 1. حذف القيد القديم (العام)
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_name_key;

-- 2. إضافة قيد جديد على مستوى المستخدم
ALTER TABLE public.rooms 
ADD CONSTRAINT unique_user_room_name UNIQUE (user_id, name);