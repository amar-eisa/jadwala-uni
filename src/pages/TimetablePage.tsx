import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScheduleEntries, useGenerateSchedule, useClearSchedule } from '@/hooks/useSchedule';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { DayOfWeek, DAY_LABELS, ScheduleEntry, TimeSlot } from '@/types/database';
import { Wand2, Trash2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_ORDER: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

// Color palette for subjects
const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-red-100 border-red-300 text-red-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
];

export default function TimetablePage() {
  const { data: scheduleEntries, isLoading } = useScheduleEntries();
  const { data: timeSlots } = useTimeSlots();
  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const generateSchedule = useGenerateSchedule();
  const clearSchedule = useClearSchedule();

  const [filterType, setFilterType] = useState<'all' | 'room' | 'professor' | 'group'>('all');
  const [filterId, setFilterId] = useState<string>('');

  // Get unique time slots sorted by time
  const uniqueTimeSlots = useMemo(() => {
    if (!timeSlots) return [];
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

  // Get subject color
  const subjectColors = useMemo(() => {
    const colors: Record<string, string> = {};
    subjects?.forEach((subject, index) => {
      colors[subject.id] = COLORS[index % COLORS.length];
    });
    return colors;
  }, [subjects]);

  // Filter entries based on selection
  const filteredEntries = useMemo(() => {
    if (!scheduleEntries) return [];
    if (filterType === 'all' || !filterId) return scheduleEntries;
    
    return scheduleEntries.filter((entry) => {
      if (filterType === 'room') return entry.room_id === filterId;
      if (filterType === 'professor') return entry.subject?.professor_id === filterId;
      if (filterType === 'group') return entry.subject?.group_id === filterId;
      return true;
    });
  }, [scheduleEntries, filterType, filterId]);

  // Get entry for a specific day and time slot
  const getEntriesForSlot = (day: DayOfWeek, startTime: string, endTime: string): ScheduleEntry[] => {
    return filteredEntries.filter((entry) => {
      const slot = entry.time_slot;
      return slot?.day === day && 
             slot?.start_time.slice(0, 5) === startTime.slice(0, 5) &&
             slot?.end_time.slice(0, 5) === endTime.slice(0, 5);
    });
  };

  const handleGenerate = async () => {
    await generateSchedule.mutateAsync();
  };

  const handleClear = async () => {
    if (confirm('هل أنت متأكد من مسح الجدول؟')) {
      await clearSchedule.mutateAsync();
    }
  };

  const formatTime = (time: string) => time.slice(0, 5);

  const canGenerate = rooms?.length && subjects?.length && timeSlots?.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">الجدول الأسبوعي</h1>
            <p className="text-muted-foreground mt-1">عرض وتوليد جدول المحاضرات</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={clearSchedule.isPending || !scheduleEntries?.length}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              مسح الجدول
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateSchedule.isPending || !canGenerate}
            >
              <Wand2 className="h-4 w-4 ml-2" />
              {generateSchedule.isPending ? 'جاري التوليد...' : 'توليد الجدول'}
            </Button>
          </div>
        </div>

        {!canGenerate && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                يجب إضافة قاعات ومواد وفترات زمنية أولاً قبل توليد الجدول
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              تصفية العرض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={filterType}
                onValueChange={(value: 'all' | 'room' | 'professor' | 'group') => {
                  setFilterType(value);
                  setFilterId('');
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="نوع التصفية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">عرض الكل</SelectItem>
                  <SelectItem value="room">حسب القاعة</SelectItem>
                  <SelectItem value="professor">حسب الدكتور</SelectItem>
                  <SelectItem value="group">حسب المجموعة</SelectItem>
                </SelectContent>
              </Select>

              {filterType !== 'all' && (
                <Select value={filterId} onValueChange={setFilterId}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filterType === 'room' && rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                    ))}
                    {filterType === 'professor' && professors?.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
                    ))}
                    {filterType === 'group' && groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {isLoading ? (
              <p className="text-center py-8">جاري التحميل...</p>
            ) : uniqueTimeSlots.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                لا توجد فترات زمنية محددة
              </p>
            ) : (
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-1 mb-1">
                  <div className="p-3 bg-muted rounded-lg font-bold text-center">
                    الوقت
                  </div>
                  {DAYS_ORDER.map((day) => (
                    <div key={day} className="p-3 bg-muted rounded-lg font-bold text-center">
                      {DAY_LABELS[day]}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                {uniqueTimeSlots.map((slot) => (
                  <div key={`${slot.start_time}-${slot.end_time}`} className="grid grid-cols-6 gap-1 mb-1">
                    {/* Time Cell */}
                    <div className="p-3 bg-muted/50 rounded-lg text-center text-sm font-medium">
                      <div>{formatTime(slot.start_time)}</div>
                      <div className="text-muted-foreground">-</div>
                      <div>{formatTime(slot.end_time)}</div>
                    </div>

                    {/* Day Cells */}
                    {DAYS_ORDER.map((day) => {
                      const entries = getEntriesForSlot(day, slot.start_time, slot.end_time);
                      return (
                        <div
                          key={day}
                          className="min-h-[100px] p-1 bg-muted/30 rounded-lg"
                        >
                          {entries.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                              -
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {entries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className={cn(
                                    "p-2 rounded border text-xs",
                                    subjectColors[entry.subject_id] || COLORS[0]
                                  )}
                                >
                                  <div className="font-bold truncate">
                                    {entry.subject?.name}
                                  </div>
                                  <div className="truncate opacity-80">
                                    {entry.subject?.professor?.name}
                                  </div>
                                  <div className="truncate opacity-60">
                                    {entry.room?.name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {scheduleEntries && scheduleEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إحصائيات الجدول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{scheduleEntries.length}</div>
                  <div className="text-sm text-muted-foreground">محاضرة مجدولة</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{subjects?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">إجمالي المواد</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{rooms?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">قاعات مستخدمة</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{uniqueTimeSlots.length}</div>
                  <div className="text-sm text-muted-foreground">فترات زمنية</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
