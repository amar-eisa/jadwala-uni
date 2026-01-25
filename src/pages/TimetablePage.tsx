import { useState, useMemo, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useScheduleEntries, useGenerateSchedule, useClearSchedule, useMoveScheduleEntry } from '@/hooks/useSchedule';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { DayOfWeek, DAY_LABELS, ScheduleEntry, Room } from '@/types/database';
import { Wand2, Trash2, Filter, FileDown, GripVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { usePdfExport } from '@/hooks/usePdfExport';
import { toast } from '@/hooks/use-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';

const DAYS_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

// Color palette for groups
const GROUP_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  'CS-1': { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' },
  'CS-2': { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' },
  'CS-3': { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400 text-amber-900' },
  'IT-1': { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400 text-amber-900' },
  'IT-2': { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' },
};

const DEFAULT_COLOR = { bg: 'bg-stone-50', border: 'border-stone-200', badge: 'bg-amber-400 text-amber-900' };

// Draggable Entry Component
function DraggableEntry({ 
  entry, 
  colors 
}: { 
  entry: ScheduleEntry; 
  colors: { bg: string; border: string; badge: string };
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    data: { entry },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const groupName = entry.subject?.group?.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-lg border-2 min-h-[90px] transition-shadow cursor-grab active:cursor-grabbing",
        colors.bg,
        colors.border,
        isDragging && "opacity-50 shadow-xl ring-2 ring-primary"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
        <GripVertical className="h-3 w-3" />
        <span className="text-[10px]">اسحب للنقل</span>
      </div>
      
      <div className="font-bold text-base text-center text-foreground mb-1">
        {entry.subject?.name}
      </div>
      
      <div className="text-sm text-amber-700 text-center mb-2">
        {entry.subject?.professor?.name}
      </div>
      
      <div className="flex items-center justify-center gap-2">
        {groupName && (
          <Badge className={cn("text-xs font-medium px-2 py-0.5 rounded-full", colors.badge)}>
            {groupName}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">{entry.room?.name}</span>
      </div>
    </div>
  );
}

// Droppable Slot Component
function DroppableSlot({ 
  id, 
  children, 
  isEmpty 
}: { 
  id: string; 
  children: React.ReactNode; 
  isEmpty: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-1 rounded-lg transition-all duration-200",
        isEmpty ? "bg-muted/20" : "bg-muted/20",
        isOver && "bg-primary/20 border-2 border-dashed border-primary scale-[1.02]"
      )}
    >
      {isEmpty && isOver && (
        <div className="h-full flex items-center justify-center text-primary text-sm font-medium">
          أفلت هنا
        </div>
      )}
      {children}
    </div>
  );
}

export default function TimetablePage() {
  const { data: scheduleEntries, isLoading } = useScheduleEntries();
  const { data: timeSlots } = useTimeSlots();
  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const generateSchedule = useGenerateSchedule();
  const clearSchedule = useClearSchedule();
  const moveEntry = useMoveScheduleEntry();
  const { exportToPdf, isExporting } = usePdfExport();

  const [filterType, setFilterType] = useState<'all' | 'room' | 'professor' | 'group'>('all');
  const [filterId, setFilterId] = useState<string>('');
  const [activeEntry, setActiveEntry] = useState<ScheduleEntry | null>(null);
  
  // Room selection dialog state
  const [roomSelectDialog, setRoomSelectDialog] = useState<{
    open: boolean;
    entryId: string;
    newTimeSlotId: string;
    availableRooms: Room[];
    subjectType: 'theory' | 'practical';
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  // Find time slot ID for a given day and time range
  const findTimeSlotId = useCallback((day: string, startTime: string, endTime: string): string | null => {
    if (!timeSlots) return null;
    const slot = timeSlots.find(s => 
      s.day === day && 
      s.start_time.slice(0, 5) === startTime.slice(0, 5) &&
      s.end_time.slice(0, 5) === endTime.slice(0, 5)
    );
    return slot?.id || null;
  }, [timeSlots]);

  // Check for conflicts
  const checkConflicts = useCallback((
    entryId: string,
    newTimeSlotId: string,
    professorId: string,
    groupId: string
  ): { hasConflict: boolean; message: string } => {
    if (!scheduleEntries) return { hasConflict: false, message: '' };

    for (const entry of scheduleEntries) {
      if (entry.id === entryId) continue;
      if (entry.time_slot_id !== newTimeSlotId) continue;

      // Check professor conflict
      if (entry.subject?.professor_id === professorId) {
        return { 
          hasConflict: true, 
          message: `الدكتور ${entry.subject?.professor?.name} لديه محاضرة أخرى في هذا الوقت` 
        };
      }

      // Check group conflict
      if (entry.subject?.group_id === groupId) {
        return { 
          hasConflict: true, 
          message: `المجموعة ${entry.subject?.group?.name} لديها محاضرة أخرى في هذا الوقت` 
        };
      }
    }

    return { hasConflict: false, message: '' };
  }, [scheduleEntries]);

  // Get available rooms for a time slot
  const getAvailableRooms = useCallback((
    timeSlotId: string,
    subjectType: 'theory' | 'practical',
    excludeEntryId: string
  ): Room[] => {
    if (!rooms || !scheduleEntries) return [];

    const requiredType = subjectType === 'theory' ? 'lecture' : 'lab';
    const occupiedRoomIds = new Set(
      scheduleEntries
        .filter(e => e.time_slot_id === timeSlotId && e.id !== excludeEntryId)
        .map(e => e.room_id)
    );

    return rooms.filter(room => 
      room.type === requiredType && !occupiedRoomIds.has(room.id)
    );
  }, [rooms, scheduleEntries]);

  const handleDragStart = (event: DragStartEvent) => {
    const entry = (event.active.data.current as any)?.entry as ScheduleEntry;
    setActiveEntry(entry);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveEntry(null);
    
    const { active, over } = event;
    if (!over) return;

    const entry = (active.data.current as any)?.entry as ScheduleEntry;
    if (!entry) return;

    // Parse drop target (format: "day-startTime-endTime")
    const [day, startTime, endTime] = (over.id as string).split('|');
    if (!day || !startTime || !endTime) return;

    // Find the time slot ID
    const newTimeSlotId = findTimeSlotId(day, startTime, endTime);
    if (!newTimeSlotId) {
      toast({ title: 'خطأ', description: 'لم يتم العثور على الفترة الزمنية', variant: 'destructive' });
      return;
    }

    // Don't do anything if dropped in same slot
    if (newTimeSlotId === entry.time_slot_id) return;

    // Check for conflicts
    const conflict = checkConflicts(
      entry.id,
      newTimeSlotId,
      entry.subject?.professor_id || '',
      entry.subject?.group_id || ''
    );

    if (conflict.hasConflict) {
      toast({ 
        title: 'تعارض في الجدول', 
        description: conflict.message, 
        variant: 'destructive' 
      });
      return;
    }

    // Get available rooms
    const subjectType = entry.subject?.type || 'theory';
    const availableRooms = getAvailableRooms(newTimeSlotId, subjectType, entry.id);

    if (availableRooms.length === 0) {
      toast({ 
        title: 'لا توجد قاعات متاحة', 
        description: `لا توجد ${subjectType === 'theory' ? 'قاعات محاضرات' : 'معامل'} متاحة في هذا الوقت`, 
        variant: 'destructive' 
      });
      return;
    }

    // If only one room available, move directly
    if (availableRooms.length === 1) {
      await moveEntry.mutateAsync({
        entryId: entry.id,
        newTimeSlotId,
        newRoomId: availableRooms[0].id,
      });
    } else {
      // Show room selection dialog
      setRoomSelectDialog({
        open: true,
        entryId: entry.id,
        newTimeSlotId,
        availableRooms,
        subjectType,
      });
    }
  };

  const handleRoomSelect = async (roomId: string) => {
    if (!roomSelectDialog) return;

    await moveEntry.mutateAsync({
      entryId: roomSelectDialog.entryId,
      newTimeSlotId: roomSelectDialog.newTimeSlotId,
      newRoomId: roomId,
    });

    setRoomSelectDialog(null);
  };

  const handleGenerate = async () => {
    await generateSchedule.mutateAsync();
  };

  const handleClear = async () => {
    if (confirm('هل أنت متأكد من مسح الجدول؟')) {
      await clearSchedule.mutateAsync();
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportToPdf('timetable-grid', {
        filename: 'university-timetable',
        title: 'الجدول الأسبوعي للمحاضرات',
        orientation: 'landscape',
      });
      toast({ title: 'تم تصدير الجدول بنجاح' });
    } catch (error) {
      toast({ 
        title: 'خطأ في تصدير الجدول', 
        description: 'حدث خطأ أثناء تصدير الجدول',
        variant: 'destructive' 
      });
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
            <p className="text-muted-foreground mt-1">اسحب المحاضرات لتعديل مواعيدها</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={isExporting || !scheduleEntries?.length}
            >
              <FileDown className="h-4 w-4 ml-2" />
              {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
            </Button>
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

        {/* Timetable Grid with Drag and Drop */}
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {isLoading ? (
              <p className="text-center py-8">جاري التحميل...</p>
            ) : uniqueTimeSlots.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                لا توجد فترات زمنية محددة
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div id="timetable-grid" className="min-w-[900px] bg-background p-4">
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
                  {uniqueTimeSlots.map((slot) => (
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
                        const slotId = `${day}|${formatTime(slot.start_time)}|${formatTime(slot.end_time)}`;
                        
                        return (
                          <DroppableSlot key={day} id={slotId} isEmpty={entries.length === 0}>
                            {entries.length > 0 && (
                              <div className="space-y-1">
                                {entries.map((entry) => {
                                  const groupName = entry.subject?.group?.name;
                                  const colors = getGroupColor(groupName);
                                  
                                  return (
                                    <DraggableEntry
                                      key={entry.id}
                                      entry={entry}
                                      colors={colors}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </DroppableSlot>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                  {activeEntry && (
                    <div className={cn(
                      "p-3 rounded-lg border-2 min-h-[90px] shadow-2xl opacity-90",
                      getGroupColor(activeEntry.subject?.group?.name).bg,
                      getGroupColor(activeEntry.subject?.group?.name).border
                    )}>
                      <div className="font-bold text-base text-center text-foreground mb-1">
                        {activeEntry.subject?.name}
                      </div>
                      <div className="text-sm text-amber-700 text-center mb-2">
                        {activeEntry.subject?.professor?.name}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Badge className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          getGroupColor(activeEntry.subject?.group?.name).badge
                        )}>
                          {activeEntry.subject?.group?.name}
                        </Badge>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
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

      {/* Room Selection Dialog */}
      <Dialog 
        open={roomSelectDialog?.open || false} 
        onOpenChange={(open) => !open && setRoomSelectDialog(null)}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              اختر القاعة
            </DialogTitle>
            <DialogDescription>
              يوجد أكثر من {roomSelectDialog?.subjectType === 'theory' ? 'قاعة محاضرات' : 'معمل'} متاح. اختر القاعة المناسبة:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {roomSelectDialog?.availableRooms.map((room) => (
              <Button
                key={room.id}
                variant="outline"
                className="justify-start text-right"
                onClick={() => handleRoomSelect(room.id)}
              >
                {room.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
