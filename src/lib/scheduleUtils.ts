/**
 * Pure utility functions for schedule conflict detection.
 * Mirrors the logic in supabase/functions/generate-schedule/index.ts
 * so it can be unit-tested with Vitest.
 */

export interface TimeSlotInfo {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

export interface UnavailabilityRule {
  professor_id: string;
  day: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
}

export interface SubjectInfo {
  id: string;
  professor_id: string;
  group_id: string;
  type: 'theory' | 'practical';
  weekly_hours: number;
}

export interface RoomInfo {
  id: string;
  type: 'lab' | 'lecture';
}

// ── Conflict checks ───────────────────────────────────────────

export function checkRoomConflict(
  roomId: string,
  timeSlotId: string,
  occupied: Set<string>,
): boolean {
  return occupied.has(`${roomId}-${timeSlotId}`);
}

export function checkProfessorConflict(
  professorId: string,
  timeSlotId: string,
  occupied: Set<string>,
): boolean {
  return occupied.has(`${professorId}-${timeSlotId}`);
}

export function checkGroupConflict(
  groupId: string,
  timeSlotId: string,
  occupied: Set<string>,
): boolean {
  return occupied.has(`${groupId}-${timeSlotId}`);
}

// ── Professor availability ────────────────────────────────────

export function isProfessorAvailable(
  professorId: string,
  timeSlot: TimeSlotInfo,
  unavailabilityMap: Record<string, UnavailabilityRule[]>,
): boolean {
  const rules = unavailabilityMap[professorId];
  if (!rules || rules.length === 0) return true;

  for (const rule of rules) {
    if (rule.day !== timeSlot.day) continue;

    if (rule.all_day) return false;

    if (rule.start_time && rule.end_time) {
      const hasOverlap =
        timeSlot.start_time < rule.end_time && timeSlot.end_time > rule.start_time;
      if (hasOverlap) return false;
    }
  }

  return true;
}

// ── Group daily session cap ───────────────────────────────────

const MAX_GROUP_SESSIONS_PER_DAY = 4;

export function getGroupDaySessionCount(
  groupId: string,
  day: string,
  tracker: Record<string, number>,
): number {
  return tracker[`${groupId}-${day}`] || 0;
}

export function isGroupDayFull(
  groupId: string,
  day: string,
  tracker: Record<string, number>,
): boolean {
  return getGroupDaySessionCount(groupId, day, tracker) >= MAX_GROUP_SESSIONS_PER_DAY;
}

// ── Theory / practical balance ────────────────────────────────

export function isTypeBalanced(
  day: string,
  isTheory: boolean,
  theoryCounts: Record<string, number>,
  practicalCounts: Record<string, number>,
  round: number,
): boolean {
  if (round >= 30) return true; // relax constraint in late rounds

  const theoryCount = theoryCounts[day] || 0;
  const practicalCount = practicalCounts[day] || 0;

  if (theoryCount === 0 || practicalCount === 0) return true;

  const ratio = isTheory
    ? theoryCount / (practicalCount || 1)
    : practicalCount / (theoryCount || 1);

  return ratio <= 3;
}

// ── Find available slot ───────────────────────────────────────

export interface FindSlotResult {
  roomId: string;
  timeSlotId: string;
}

export function findAvailableSlot(
  subject: SubjectInfo,
  rooms: RoomInfo[],
  daySlots: TimeSlotInfo[],
  occupiedRoomSlots: Set<string>,
  occupiedProfessorSlots: Set<string>,
  occupiedGroupSlots: Set<string>,
  unavailabilityMap: Record<string, UnavailabilityRule[]>,
): FindSlotResult | null {
  const requiredRoomType = subject.type === 'theory' ? 'lecture' : 'lab';
  const compatibleRooms = rooms.filter(r => r.type === requiredRoomType);

  if (compatibleRooms.length === 0) return null;

  for (const timeSlot of daySlots) {
    if (!isProfessorAvailable(subject.professor_id, timeSlot, unavailabilityMap)) continue;

    if (checkProfessorConflict(subject.professor_id, timeSlot.id, occupiedProfessorSlots))
      continue;
    if (checkGroupConflict(subject.group_id, timeSlot.id, occupiedGroupSlots)) continue;

    for (const room of compatibleRooms) {
      if (!checkRoomConflict(room.id, timeSlot.id, occupiedRoomSlots)) {
        return { roomId: room.id, timeSlotId: timeSlot.id };
      }
    }
  }

  return null;
}
