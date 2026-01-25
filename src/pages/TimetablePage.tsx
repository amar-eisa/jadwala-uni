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
import { Badge } from '@/components/ui/badge';

const DAYS_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

// Color palette for groups - matching reference image style
const GROUP_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  'CS-1': { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' },
  'CS-2': { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' },
  'CS-3': { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400 text-amber-900' },
  'IT-1': { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400 text-amber-900' },
  'IT-2': { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' },
};

const DEFAULT_COLOR = { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' };

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

  const getGroupColor = (groupName: string | undefined) => {
    if (!groupName) return DEFAULT_COLOR;
    return GROUP_COLORS[groupName] || DEFAULT_COLOR;
  };

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
              <div className="min-w-[900px]">
                {/* Header Row */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}>
                  <div className="p-3 bg-muted rounded-lg font-bold text-center text-sm">
                    الفترة
                  </div>
                  {DAYS_ORDER.map((day) => (
                    <div key={day} className="p-3 bg-muted rounded-lg font-bold text-center">
                      {DAY_LABELS[day]}
                    </div>
                  ))}
                </div>

                {/* Time Slot Rows */}
                {uniqueTimeSlots.map((slot, slotIndex) => (
                  <div 
                    key={`${slot.start_time}-${slot.end_time}`} 
                    className="grid gap-1 mb-1"
                    style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}
                  >
                    {/* Time Cell */}
                    <div className="p-2 bg-muted/50 rounded-lg text-center text-xs font-medium flex flex-col justify-center">
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
                          className="min-h-[100px] p-1 bg-muted/20 rounded-lg"
                        >
                          {entries.length === 0 ? (
                            <div className="h-full" />
                          ) : (
                            <div className="space-y-1">
                              {entries.map((entry) => {
                                const groupName = entry.subject?.group?.name;
                                const colors = getGroupColor(groupName);
                                
                                return (
                                  <div
                                    key={entry.id}
                                    className={cn(
                                      "p-3 rounded-lg border-2 min-h-[90px]",
                                      colors.bg,
                                      colors.border
                                    )}
                                  >
                                    {/* Subject Name */}
                                    <div className="font-bold text-base text-center text-foreground mb-1">
                                      {entry.subject?.name}
                                    </div>
                                    
                                    {/* Professor Name */}
                                    <div className="text-sm text-amber-700 text-center mb-3">
                                      {entry.subject?.professor?.name}
                                    </div>
                                    
                                    {/* Room & Group - Bottom aligned */}
                                    <div className="flex items-center justify-center gap-2">
                                      {groupName && (
                                        <Badge 
                                          className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                            colors.badge
                                          )}
                                        >
                                          {groupName}
                                        </Badge>
                                      )}
                                      <span className="text-sm text-muted-foreground">
                                        {entry.room?.name}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
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
