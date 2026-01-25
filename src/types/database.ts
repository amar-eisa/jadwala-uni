export type RoomType = 'lab' | 'lecture';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  created_at: string;
  updated_at: string;
}

export interface Professor {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  professor_id: string;
  group_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  professor?: Professor;
  group?: StudentGroup;
}

export interface TimeSlot {
  id: string;
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleEntry {
  id: string;
  room_id: string;
  time_slot_id: string;
  subject_id: string;
  created_at: string;
  // Joined data
  room?: Room;
  time_slot?: TimeSlot;
  subject?: Subject;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
};

export const DAY_LABELS_EN: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  lab: 'معمل',
  lecture: 'قاعة محاضرات',
};
