import { useMemo } from 'react';
import { DayOfWeek, DAY_LABELS } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RichTooltip } from '@/components/ui/rich-tooltip';
import { GraduationCap, MapPin, BookOpen } from 'lucide-react';

const DAYS_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

interface ScheduleEntry {
  id: string;
  room_id: string;
  time_slot_id: string;
  subject_id: string;
  room?: { name: string; type: string };
  time_slot?: { day: string; start_time: string; end_time: string };
  subject?: {
    name: string;
    type: string;
    professor?: { name: string };
    group?: { name: string };
  };
}

interface TimeSlot {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface Props {
  entries: ScheduleEntry[];
  timeSlots: TimeSlot[];
  groupName?: string;
}

export function StudentTimetableView({ entries, timeSlots, groupName }: Props) {
  const uniqueTimeSlots = useMemo(() => {
    const seen = new Set<string>();
    return timeSlots
      .filter((slot) => {
        const key = `${slot.start_time}-${slot.end_time}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timeSlots]);

  const getEntriesForSlot = (day: DayOfWeek, startTime: string, endTime: string) => {
    return entries.filter((entry) => {
      const slot = entry.time_slot;
      return (
        slot?.day === day &&
        slot?.start_time.slice(0, 5) === startTime.slice(0, 5) &&
        slot?.end_time.slice(0, 5) === endTime.slice(0, 5)
      );
    });
  };

  const formatTime = (time: string) => time.slice(0, 5);

  if (entries.length === 0) {
    return (
      <div className="card-glass p-12 text-center">
        <p className="text-muted-foreground text-lg">لا يوجد جدول نشط لهذه المجموعة حالياً</p>
        <p className="text-muted-foreground text-sm mt-2">سيظهر الجدول هنا عندما يتم تفعيله من قبل الإدارة</p>
      </div>
    );
  }

  return (
    <div className="card-glass overflow-hidden" id="student-timetable">
      {groupName && (
        <div className="px-6 py-4 border-b border-border/30 bg-primary/5">
          <h2 className="text-lg font-bold text-foreground">جدول مجموعة: {groupName}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-muted/30">
              <th className="p-3 text-sm font-bold text-foreground border-b border-border/30 w-28">
                الوقت
              </th>
              {DAYS_ORDER.map((day) => (
                <th key={day} className="p-3 text-sm font-bold text-foreground border-b border-border/30">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueTimeSlots.map((slot) => (
              <tr key={`${slot.start_time}-${slot.end_time}`} className="table-row-hover">
                <td className="p-3 text-center border-b border-border/20 bg-muted/10">
                  <div className="font-mono text-sm font-medium text-foreground">
                    {formatTime(slot.start_time)}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {formatTime(slot.end_time)}
                  </div>
                </td>
                {DAYS_ORDER.map((day) => {
                  const cellEntries = getEntriesForSlot(day, slot.start_time, slot.end_time);
                  return (
                    <td key={day} className="p-1 border-b border-border/20">
                      {cellEntries.map((entry) => {
                        const isLab = entry.subject?.type === 'practical';
                        return (
                          <RichTooltip
                            key={entry.id}
                            content={
                              <div className="space-y-3 text-sm" dir="rtl">
                                <div className="font-bold text-foreground text-base border-b border-border/30 pb-2">
                                  {entry.subject?.name}
                                </div>
                                <div className="space-y-2 text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{entry.subject?.professor?.name || 'غير محدد'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{entry.room?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <Badge variant="outline" className="text-[10px]">{isLab ? 'عملي' : 'نظري'}</Badge>
                                  </div>
                                </div>
                              </div>
                            }
                          >
                          <div
                            className={cn(
                              "rounded-2xl p-3 min-h-[90px] border-2 relative overflow-hidden cursor-default",
                              isLab
                                ? "bg-success/10 border-success/30"
                                : "bg-primary/10 border-primary/30"
                            )}
                          >
                            {/* Side color strip */}
                            <div className={cn(
                              "absolute top-0 right-0 w-1 h-full rounded-r-2xl",
                              isLab ? "bg-success" : "bg-primary"
                            )} />
                            <div className="font-bold text-sm text-center text-foreground mb-1">
                              {entry.subject?.name}
                            </div>
                            <div className={cn("text-xs text-center mb-2", isLab ? "text-success" : "text-primary")}>
                              {entry.subject?.professor?.name}
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {entry.room?.name}
                              </Badge>
                              <Badge className={cn("text-[10px]", isLab ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground")}>
                                {isLab ? 'عملي' : 'نظري'}
                              </Badge>
                            </div>
                          </div>
                          </RichTooltip>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
