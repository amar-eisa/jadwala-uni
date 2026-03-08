import { describe, it, expect } from 'vitest';
import {
  checkRoomConflict,
  checkProfessorConflict,
  checkGroupConflict,
  isProfessorAvailable,
  getGroupDaySessionCount,
  isGroupDayFull,
  isTypeBalanced,
  findAvailableSlot,
  type TimeSlotInfo,
  type UnavailabilityRule,
  type SubjectInfo,
  type RoomInfo,
} from '../scheduleUtils';

// ── Helpers ──────────────────────────────────────────────────

const slot = (id: string, day = 'sunday', start = '08:00', end = '10:00'): TimeSlotInfo => ({
  id,
  day,
  start_time: start,
  end_time: end,
});

const subject = (overrides: Partial<SubjectInfo> = {}): SubjectInfo => ({
  id: 'sub1',
  professor_id: 'prof1',
  group_id: 'grp1',
  type: 'theory',
  weekly_hours: 2,
  ...overrides,
});

// ── Room conflict ────────────────────────────────────────────

describe('checkRoomConflict', () => {
  it('returns false when no conflict', () => {
    const occupied = new Set<string>();
    expect(checkRoomConflict('room1', 'ts1', occupied)).toBe(false);
  });

  it('detects conflict for same room + same slot', () => {
    const occupied = new Set(['room1-ts1']);
    expect(checkRoomConflict('room1', 'ts1', occupied)).toBe(true);
  });

  it('no conflict for same room + different slot', () => {
    const occupied = new Set(['room1-ts1']);
    expect(checkRoomConflict('room1', 'ts2', occupied)).toBe(false);
  });
});

// ── Professor conflict ───────────────────────────────────────

describe('checkProfessorConflict', () => {
  it('returns false when no conflict', () => {
    expect(checkProfessorConflict('prof1', 'ts1', new Set())).toBe(false);
  });

  it('detects conflict for same professor + same slot', () => {
    expect(checkProfessorConflict('prof1', 'ts1', new Set(['prof1-ts1']))).toBe(true);
  });

  it('no conflict for different professor', () => {
    expect(checkProfessorConflict('prof2', 'ts1', new Set(['prof1-ts1']))).toBe(false);
  });
});

// ── Group conflict ───────────────────────────────────────────

describe('checkGroupConflict', () => {
  it('returns false when no conflict', () => {
    expect(checkGroupConflict('grp1', 'ts1', new Set())).toBe(false);
  });

  it('detects conflict for same group + same slot', () => {
    expect(checkGroupConflict('grp1', 'ts1', new Set(['grp1-ts1']))).toBe(true);
  });
});

// ── Professor availability ───────────────────────────────────

describe('isProfessorAvailable', () => {
  it('available when no rules exist', () => {
    expect(isProfessorAvailable('prof1', slot('ts1'), {})).toBe(true);
  });

  it('unavailable when all_day rule matches', () => {
    const map: Record<string, UnavailabilityRule[]> = {
      prof1: [{ professor_id: 'prof1', day: 'sunday', start_time: null, end_time: null, all_day: true }],
    };
    expect(isProfessorAvailable('prof1', slot('ts1', 'sunday'), map)).toBe(false);
  });

  it('available when all_day rule is on different day', () => {
    const map: Record<string, UnavailabilityRule[]> = {
      prof1: [{ professor_id: 'prof1', day: 'monday', start_time: null, end_time: null, all_day: true }],
    };
    expect(isProfessorAvailable('prof1', slot('ts1', 'sunday'), map)).toBe(true);
  });

  it('unavailable when time range overlaps', () => {
    const map: Record<string, UnavailabilityRule[]> = {
      prof1: [{ professor_id: 'prof1', day: 'sunday', start_time: '09:00', end_time: '11:00', all_day: false }],
    };
    // slot 08:00-10:00 overlaps with 09:00-11:00
    expect(isProfessorAvailable('prof1', slot('ts1', 'sunday', '08:00', '10:00'), map)).toBe(false);
  });

  it('available when time range does not overlap', () => {
    const map: Record<string, UnavailabilityRule[]> = {
      prof1: [{ professor_id: 'prof1', day: 'sunday', start_time: '12:00', end_time: '14:00', all_day: false }],
    };
    expect(isProfessorAvailable('prof1', slot('ts1', 'sunday', '08:00', '10:00'), map)).toBe(true);
  });
});

// ── Group daily cap ──────────────────────────────────────────

describe('getGroupDaySessionCount / isGroupDayFull', () => {
  it('returns 0 for untracked group-day', () => {
    expect(getGroupDaySessionCount('grp1', 'sunday', {})).toBe(0);
  });

  it('returns correct count', () => {
    expect(getGroupDaySessionCount('grp1', 'sunday', { 'grp1-sunday': 3 })).toBe(3);
  });

  it('not full at 3', () => {
    expect(isGroupDayFull('grp1', 'sunday', { 'grp1-sunday': 3 })).toBe(false);
  });

  it('full at 4', () => {
    expect(isGroupDayFull('grp1', 'sunday', { 'grp1-sunday': 4 })).toBe(true);
  });
});

// ── Type balance ─────────────────────────────────────────────

describe('isTypeBalanced', () => {
  it('balanced when counts are zero', () => {
    expect(isTypeBalanced('sun', true, {}, {}, 0)).toBe(true);
  });

  it('balanced when ratio <= 3', () => {
    expect(isTypeBalanced('sun', true, { sun: 3 }, { sun: 1 }, 0)).toBe(true);
  });

  it('imbalanced when ratio > 3', () => {
    expect(isTypeBalanced('sun', true, { sun: 4 }, { sun: 1 }, 0)).toBe(false);
  });

  it('always balanced in late rounds (>= 30)', () => {
    expect(isTypeBalanced('sun', true, { sun: 10 }, { sun: 1 }, 30)).toBe(true);
  });
});

// ── findAvailableSlot ────────────────────────────────────────

describe('findAvailableSlot', () => {
  const rooms: RoomInfo[] = [
    { id: 'lec1', type: 'lecture' },
    { id: 'lab1', type: 'lab' },
  ];
  const daySlots = [slot('ts1'), slot('ts2', 'sunday', '10:00', '12:00')];

  it('returns first available slot for theory subject', () => {
    const result = findAvailableSlot(
      subject({ type: 'theory' }),
      rooms,
      daySlots,
      new Set(),
      new Set(),
      new Set(),
      {},
    );
    expect(result).toEqual({ roomId: 'lec1', timeSlotId: 'ts1' });
  });

  it('returns lab room for practical subject', () => {
    const result = findAvailableSlot(
      subject({ type: 'practical' }),
      rooms,
      daySlots,
      new Set(),
      new Set(),
      new Set(),
      {},
    );
    expect(result).toEqual({ roomId: 'lab1', timeSlotId: 'ts1' });
  });

  it('returns null when all rooms occupied', () => {
    const result = findAvailableSlot(
      subject({ type: 'theory' }),
      rooms,
      daySlots,
      new Set(['lec1-ts1', 'lec1-ts2']),
      new Set(),
      new Set(),
      {},
    );
    expect(result).toBeNull();
  });

  it('returns null when professor unavailable all slots', () => {
    const unavail: Record<string, UnavailabilityRule[]> = {
      prof1: [{ professor_id: 'prof1', day: 'sunday', start_time: null, end_time: null, all_day: true }],
    };
    const result = findAvailableSlot(
      subject(),
      rooms,
      daySlots,
      new Set(),
      new Set(),
      new Set(),
      unavail,
    );
    expect(result).toBeNull();
  });

  it('skips occupied slot and returns next available', () => {
    const result = findAvailableSlot(
      subject({ type: 'theory' }),
      rooms,
      daySlots,
      new Set(['lec1-ts1']),
      new Set(),
      new Set(),
      {},
    );
    expect(result).toEqual({ roomId: 'lec1', timeSlotId: 'ts2' });
  });

  it('returns null when group conflict on all slots', () => {
    const result = findAvailableSlot(
      subject(),
      rooms,
      daySlots,
      new Set(),
      new Set(),
      new Set(['grp1-ts1', 'grp1-ts2']),
      {},
    );
    expect(result).toBeNull();
  });

  it('returns null when no compatible room type exists', () => {
    const labOnly: RoomInfo[] = [{ id: 'lab1', type: 'lab' }];
    const result = findAvailableSlot(
      subject({ type: 'theory' }),
      labOnly,
      daySlots,
      new Set(),
      new Set(),
      new Set(),
      {},
    );
    expect(result).toBeNull();
  });
});
