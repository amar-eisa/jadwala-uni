import { useMemo } from 'react';
import { useRooms } from './useRooms';
import { useProfessors } from './useProfessors';
import { useStudentGroups } from './useStudentGroups';
import { useSubjects } from './useSubjects';
import { useTimeSlots } from './useTimeSlots';
import { useScheduleEntries } from './useSchedule';

export interface ProfessorWorkload {
  name: string;
  totalHours: number;
  lectureCount: number;
  subjects: string[];
}

export interface RoomUtilization {
  name: string;
  type: string;
  usedSlots: number;
  totalSlots: number;
  percentage: number;
  freeSlots: number;
}

export interface SubjectAllocation {
  subjectName: string;
  groupName: string;
  professorName: string;
  requiredHours: number;
  allocatedHours: number;
  deficit: number;
  isFullyScheduled: boolean;
}

export interface Conflict {
  type: 'professor' | 'room';
  entityName: string;
  day: string;
  time: string;
  subjects: string[];
}

export interface Gap {
  groupName: string;
  day: string;
  gapSize: number;
  fromTime: string;
  toTime: string;
}

export function useReports() {
  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const { data: timeSlots } = useTimeSlots();
  const { data: scheduleEntries } = useScheduleEntries();

  const isLoading = !rooms || !professors || !groups || !subjects || !timeSlots || !scheduleEntries;

  const workloadData = useMemo<ProfessorWorkload[]>(() => {
    if (!professors || !subjects || !scheduleEntries) return [];

    return professors.map(prof => {
      const profSubjects = subjects.filter(s => s.professor_id === prof.id);
      const profEntries = scheduleEntries.filter(e => 
        profSubjects.some(s => s.id === e.subject_id)
      );
      const totalHours = profSubjects.reduce((sum, s) => sum + (s.weekly_hours || 0), 0);

      return {
        name: prof.name,
        totalHours,
        lectureCount: profEntries.length,
        subjects: profSubjects.map(s => s.name),
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [professors, subjects, scheduleEntries]);

  const utilizationData = useMemo<RoomUtilization[]>(() => {
    if (!rooms || !timeSlots || !scheduleEntries) return [];

    const totalSlots = timeSlots.length;

    return rooms.map(room => {
      const usedSlots = scheduleEntries.filter(e => e.room_id === room.id).length;
      const percentage = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

      return {
        name: room.name,
        type: room.type === 'lab' ? 'معمل' : 'قاعة',
        usedSlots,
        totalSlots,
        percentage,
        freeSlots: totalSlots - usedSlots,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [rooms, timeSlots, scheduleEntries]);

  const subjectAllocationData = useMemo<SubjectAllocation[]>(() => {
    if (!subjects || !scheduleEntries || !groups || !professors) return [];

    return subjects.map(sub => {
      const allocatedCount = scheduleEntries.filter(e => e.subject_id === sub.id).length;
      const group = groups.find(g => g.id === sub.group_id);
      const prof = professors.find(p => p.id === sub.professor_id);
      const requiredHours = sub.weekly_hours || 0;

      return {
        subjectName: sub.name,
        groupName: group?.name || '—',
        professorName: prof?.name || '—',
        requiredHours,
        allocatedHours: allocatedCount,
        deficit: requiredHours - allocatedCount,
        isFullyScheduled: allocatedCount >= requiredHours,
      };
    });
  }, [subjects, scheduleEntries, groups, professors]);

  const conflictsData = useMemo<Conflict[]>(() => {
    if (!scheduleEntries || !subjects || !professors || !rooms || !timeSlots) return [];

    const conflicts: Conflict[] = [];
    const entryMap = new Map<string, typeof scheduleEntries>();

    // Group entries by time_slot_id
    for (const entry of scheduleEntries) {
      const key = entry.time_slot_id;
      if (!entryMap.has(key)) entryMap.set(key, []);
      entryMap.get(key)!.push(entry);
    }

    for (const [slotId, entries] of entryMap) {
      if (entries.length < 2) continue;
      const slot = timeSlots.find(t => t.id === slotId);
      const timeLabel = slot ? `${slot.start_time} - ${slot.end_time}` : '';
      const dayLabel = slot?.day || '';

      // Check room conflicts
      const roomMap = new Map<string, typeof entries>();
      for (const e of entries) {
        if (!roomMap.has(e.room_id)) roomMap.set(e.room_id, []);
        roomMap.get(e.room_id)!.push(e);
      }
      for (const [roomId, roomEntries] of roomMap) {
        if (roomEntries.length > 1) {
          const room = rooms.find(r => r.id === roomId);
          conflicts.push({
            type: 'room',
            entityName: room?.name || '',
            day: dayLabel,
            time: timeLabel,
            subjects: roomEntries.map(e => subjects.find(s => s.id === e.subject_id)?.name || ''),
          });
        }
      }

      // Check professor conflicts
      const profMap = new Map<string, typeof entries>();
      for (const e of entries) {
        const sub = subjects.find(s => s.id === e.subject_id);
        if (!sub) continue;
        if (!profMap.has(sub.professor_id)) profMap.set(sub.professor_id, []);
        profMap.get(sub.professor_id)!.push(e);
      }
      for (const [profId, profEntries] of profMap) {
        if (profEntries.length > 1) {
          const prof = professors.find(p => p.id === profId);
          conflicts.push({
            type: 'professor',
            entityName: prof?.name || '',
            day: dayLabel,
            time: timeLabel,
            subjects: profEntries.map(e => subjects.find(s => s.id === e.subject_id)?.name || ''),
          });
        }
      }
    }

    return conflicts;
  }, [scheduleEntries, subjects, professors, rooms, timeSlots]);

  const gapsData = useMemo<Gap[]>(() => {
    if (!groups || !scheduleEntries || !subjects || !timeSlots) return [];

    const gaps: Gap[] = [];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

    for (const group of groups) {
      const groupSubjectIds = subjects.filter(s => s.group_id === group.id).map(s => s.id);
      const groupEntries = scheduleEntries.filter(e => groupSubjectIds.includes(e.subject_id));

      for (const day of days) {
        const daySlots = timeSlots
          .filter(t => t.day === day)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        if (daySlots.length < 2) continue;

        const occupiedSlotIds = new Set(
          groupEntries.filter(e => daySlots.some(s => s.id === e.time_slot_id)).map(e => e.time_slot_id)
        );

        // Find consecutive empty slots
        let gapStart = -1;
        let gapCount = 0;

        for (let i = 0; i < daySlots.length; i++) {
          if (!occupiedSlotIds.has(daySlots[i].id)) {
            if (gapStart === -1) gapStart = i;
            gapCount++;
          } else {
            if (gapCount > 2 && gapStart > 0) {
              gaps.push({
                groupName: group.name,
                day,
                gapSize: gapCount,
                fromTime: daySlots[gapStart].start_time,
                toTime: daySlots[gapStart + gapCount - 1].end_time,
              });
            }
            gapStart = -1;
            gapCount = 0;
          }
        }
      }
    }

    return gaps;
  }, [groups, scheduleEntries, subjects, timeSlots]);

  return {
    isLoading,
    workloadData,
    utilizationData,
    subjectAllocationData,
    conflictsData,
    gapsData,
  };
}
