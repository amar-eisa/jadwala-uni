import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Wand2, Trash2, Filter, FileDown, GripVertical, AlertCircle, Calendar, BookOpen, DoorOpen, Clock, Users } from 'lucide-react';
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
import { useIsActiveSubscription } from '@/hooks/useSubscription';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';

const DAYS_ORDER: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

// Color palette for groups - using semantic tokens
const GROUP_COLORS = [
  { bg: 'bg-info/10', border: 'border-info/30', badge: 'bg-info text-info-foreground', text: 'text-info' },
  { bg: 'bg-success/10', border: 'border-success/30', badge: 'bg-success text-success-foreground', text: 'text-success' },
  { bg: 'bg-primary/10', border: 'border-primary/30', badge: 'bg-primary text-primary-foreground', text: 'text-primary' },
  { bg: 'bg-warning/10', border: 'border-warning/30', badge: 'bg-warning text-warning-foreground', text: 'text-warning' },
  { bg: 'bg-destructive/10', border: 'border-destructive/30', badge: 'bg-destructive text-destructive-foreground', text: 'text-destructive' },
  { bg: 'bg-secondary', border: 'border-secondary-foreground/30', badge: 'bg-secondary-foreground text-secondary', text: 'text-secondary-foreground' },
];

const DEFAULT_COLOR = GROUP_COLORS[0];

function DraggableEntry({ entry, colors }: { entry: ScheduleEntry; colors: typeof DEFAULT_COLOR }) {
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
        "lecture-card p-3 min-h-[100px] cursor-grab active:cursor-grabbing",
        colors.bg,
        colors.border,
        isDragging && "opacity-50 shadow-xl ring-2 ring-primary"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-center gap-1 mb-2 text-muted-foreground">
        <GripVertical className="h-3 w-3" />
        <span className="text-[10px]">اسحب للنقل</span>
      </div>
      
      <div className="font-bold text-sm text-center text-foreground mb-1 line-clamp-2">
        {entry.subject?.name}
      </div>
      
      <div className={cn("text-xs text-center mb-2", colors.text)}>
        {entry.subject?.professor?.name}
      </div>
      
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {groupName && (
          <Badge className={cn("text-[10px] font-medium px-2 py-0.5", colors.badge)}>
            {groupName}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">{entry.room?.name}</span>
      </div>
    </div>
  );
}

function DroppableSlot({ id, children, isEmpty }: { id: string; children: React.ReactNode; isEmpty: boolean }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[110px] p-1 rounded-xl transition-all duration-200 timetable-cell",
        isEmpty ? "bg-muted/30" : "bg-muted/20",
        isOver && "bg-primary/20 border-2 border-dashed border-primary scale-[1.02] shadow-lg"
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
  const { isActive: isActiveSubscription } = useIsActiveSubscription();
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

  // Group selection for generation
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  
  const [filterType, setFilterType] = useState<'all' | 'room' | 'professor' | 'group'>('all');
  const [filterId, setFilterId] = useState<string>('');
  const [activeEntry, setActiveEntry] = useState<ScheduleEntry | null>(null);
  const [roomSelectDialog, setRoomSelectDialog] = useState<{
    open: boolean;
    entryId: string;
    newTimeSlotId: string;
    availableRooms: Room[];
    subjectType: 'theory' | 'practical';
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Create group color map
  const groupColorMap = useMemo(() => {
    const map = new Map<string, typeof DEFAULT_COLOR>();
    groups?.forEach((group, index) => {
      map.set(group.id, GROUP_COLORS[index % GROUP_COLORS.length]);
    });
    return map;
  }, [groups]);

  const getGroupColor = useCallback((groupId: string | undefined) => {
    if (!groupId) return DEFAULT_COLOR;
    return groupColorMap.get(groupId) || DEFAULT_COLOR;
  }, [groupColorMap]);

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

  // Filter entries based on selected group for generation AND filter type
  const filteredEntries = useMemo(() => {
    if (!scheduleEntries) return [];
    
    let entries = scheduleEntries;
    
    // Filter by selected group for display (when a specific group is selected)
    if (selectedGroupId && selectedGroupId !== 'all') {
      entries = entries.filter((entry) => entry.subject?.group_id === selectedGroupId);
    }
    
    // Apply additional filters
    if (filterType !== 'all' && filterId) {
      entries = entries.filter((entry) => {
        if (filterType === 'room') return entry.room_id === filterId;
        if (filterType === 'professor') return entry.subject?.professor_id === filterId;
        if (filterType === 'group') return entry.subject?.group_id === filterId;
        return true;
      });
    }
    
    return entries;
  }, [scheduleEntries, selectedGroupId, filterType, filterId]);

  const getEntriesForSlot = (day: DayOfWeek, startTime: string, endTime: string): ScheduleEntry[] => {
    return filteredEntries.filter((entry) => {
      const slot = entry.time_slot;
      return slot?.day === day && 
             slot?.start_time.slice(0, 5) === startTime.slice(0, 5) &&
             slot?.end_time.slice(0, 5) === endTime.slice(0, 5);
    });
  };

  const findTimeSlotId = useCallback((day: string, startTime: string, endTime: string): string | null => {
    if (!timeSlots) return null;
    const slot = timeSlots.find(s => 
      s.day === day && 
      s.start_time.slice(0, 5) === startTime.slice(0, 5) &&
      s.end_time.slice(0, 5) === endTime.slice(0, 5)
    );
    return slot?.id || null;
  }, [timeSlots]);

  const checkConflicts = useCallback((entryId: string, newTimeSlotId: string, professorId: string, groupId: string) => {
    if (!scheduleEntries) return { hasConflict: false, message: '' };
    for (const entry of scheduleEntries) {
      if (entry.id === entryId || entry.time_slot_id !== newTimeSlotId) continue;
      if (entry.subject?.professor_id === professorId) {
        return { hasConflict: true, message: `الدكتور ${entry.subject?.professor?.name} لديه محاضرة أخرى` };
      }
      if (entry.subject?.group_id === groupId) {
        return { hasConflict: true, message: `المجموعة ${entry.subject?.group?.name} لديها محاضرة أخرى` };
      }
    }
    return { hasConflict: false, message: '' };
  }, [scheduleEntries]);

  const getAvailableRooms = useCallback((timeSlotId: string, subjectType: 'theory' | 'practical', excludeEntryId: string): Room[] => {
    if (!rooms || !scheduleEntries) return [];
    const requiredType = subjectType === 'theory' ? 'lecture' : 'lab';
    const occupiedRoomIds = new Set(
      scheduleEntries.filter(e => e.time_slot_id === timeSlotId && e.id !== excludeEntryId).map(e => e.room_id)
    );
    return rooms.filter(room => room.type === requiredType && !occupiedRoomIds.has(room.id));
  }, [rooms, scheduleEntries]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveEntry((event.active.data.current as any)?.entry as ScheduleEntry);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveEntry(null);
    const { active, over } = event;
    if (!over) return;
    const entry = (active.data.current as any)?.entry as ScheduleEntry;
    if (!entry) return;
    const [day, startTime, endTime] = (over.id as string).split('|');
    if (!day || !startTime || !endTime) return;
    const newTimeSlotId = findTimeSlotId(day, startTime, endTime);
    if (!newTimeSlotId || newTimeSlotId === entry.time_slot_id) return;
    const conflict = checkConflicts(entry.id, newTimeSlotId, entry.subject?.professor_id || '', entry.subject?.group_id || '');
    if (conflict.hasConflict) {
      toast({ title: 'تعارض', description: conflict.message, variant: 'destructive' });
      return;
    }
    const subjectType = entry.subject?.type || 'theory';
    const availableRooms = getAvailableRooms(newTimeSlotId, subjectType, entry.id);
    if (availableRooms.length === 0) {
      toast({ title: 'لا توجد قاعات', description: 'لا توجد قاعات متاحة', variant: 'destructive' });
      return;
    }
    if (availableRooms.length === 1) {
      await moveEntry.mutateAsync({ entryId: entry.id, newTimeSlotId, newRoomId: availableRooms[0].id });
    } else {
      setRoomSelectDialog({ open: true, entryId: entry.id, newTimeSlotId, availableRooms, subjectType });
    }
  };

  const handleRoomSelect = async (roomId: string) => {
    if (!roomSelectDialog) return;
    await moveEntry.mutateAsync({ entryId: roomSelectDialog.entryId, newTimeSlotId: roomSelectDialog.newTimeSlotId, newRoomId: roomId });
    setRoomSelectDialog(null);
  };

  const handleGenerateSchedule = async () => {
    const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
    await generateSchedule.mutateAsync(groupId);
  };

  const handleClearSchedule = async () => {
    const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
    const groupName = selectedGroupId === 'all' 
      ? 'جميع الجداول' 
      : groups?.find(g => g.id === selectedGroupId)?.name || 'الجدول';
    
    if (confirm(`هل تريد مسح ${groupName}؟`)) {
      await clearSchedule.mutateAsync(groupId);
    }
  };

  const handleExportPdf = async () => {
    const groupName = selectedGroupId === 'all' 
      ? undefined 
      : groups?.find(g => g.id === selectedGroupId)?.name;
    
    const filename = groupName 
      ? `جدول-${groupName}` 
      : 'الجدول-الدراسي';
    
    await exportToPdf('timetable-grid', { 
      filename,
      groupName,
      orientation: 'landscape'
    });
  };

  const formatTime = (time: string) => time.slice(0, 5);
  
  // Check if the selected group has subjects
  const selectedGroupHasSubjects = useMemo(() => {
    if (selectedGroupId === 'all') {
      return subjects && subjects.length > 0;
    }
    return subjects?.some(s => s.group_id === selectedGroupId);
  }, [subjects, selectedGroupId]);
  
  const canGenerate = rooms?.length && selectedGroupHasSubjects && timeSlots?.length;

  // Get selected group name for display
  const selectedGroupName = useMemo(() => {
    if (selectedGroupId === 'all') return 'جميع الدفعات';
    return groups?.find(g => g.id === selectedGroupId)?.name || '';
  }, [selectedGroupId, groups]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Subscription Banner */}
        <SubscriptionBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">الجدول الأسبوعي</h1>
            <p className="text-muted-foreground mt-1">اسحب المحاضرات لتعديل مواعيدها</p>
          </div>
        </div>

        {/* Group Selection and Actions */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              توليد جدول الدفعة
            </CardTitle>
            <CardDescription>
              اختر الدفعة ثم اضغط توليد لإنشاء جدول منفصل لها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Group Selector */}
              <div className="flex-1 w-full sm:max-w-[300px]">
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الدفعة..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="all">جميع الدفعات</SelectItem>
                    {groups?.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={handleExportPdf} 
                  disabled={isExporting || !filteredEntries?.length} 
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  تصدير PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClearSchedule} 
                  disabled={clearSchedule.isPending || !filteredEntries?.length || !isActiveSubscription} 
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  مسح {selectedGroupId !== 'all' ? 'جدول الدفعة' : 'الكل'}
                </Button>
                <Button 
                  onClick={handleGenerateSchedule} 
                  disabled={generateSchedule.isPending || !canGenerate || !isActiveSubscription} 
                  className="gap-2 shadow-lg shadow-primary/25"
                >
                  <Wand2 className="h-4 w-4" />
                  {generateSchedule.isPending ? 'جاري...' : `توليد ${selectedGroupId !== 'all' ? 'جدول الدفعة' : 'الكل'}`}
                </Button>
              </div>
            </div>
            
            {/* Selected Group Info */}
            {selectedGroupId !== 'all' && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">الدفعة المختارة:</span> {selectedGroupName}
                  {' • '}
                  <span className="font-medium text-foreground">المواد:</span> {subjects?.filter(s => s.group_id === selectedGroupId).length || 0} مادة
                  {' • '}
                  <span className="font-medium text-foreground">المحاضرات المجدولة:</span> {filteredEntries.length} محاضرة
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              تصفية إضافية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={filterType} onValueChange={(v: any) => { setFilterType(v); setFilterId(''); }}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">بدون تصفية إضافية</SelectItem>
                  <SelectItem value="room">حسب القاعة</SelectItem>
                  <SelectItem value="professor">حسب الدكتور</SelectItem>
                  <SelectItem value="group">حسب المجموعة</SelectItem>
                </SelectContent>
              </Select>
              {filterType !== 'all' && (
                <Select value={filterId} onValueChange={setFilterId}>
                  <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="اختر..." /></SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {filterType === 'room' && rooms?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    {filterType === 'professor' && professors?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    {filterType === 'group' && groups?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        <Card className="border-0 shadow-card">
          <CardContent className="pt-6 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><div className="animate-pulse">جاري التحميل...</div></div>
            ) : uniqueTimeSlots.length === 0 ? (
              <div className="empty-state py-12"><Clock className="h-10 w-10 mb-4" /><p>لا توجد فترات زمنية</p></div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div id="timetable-grid" className="min-w-[900px] p-4 bg-white">
                  {/* Header row with group name for PDF */}
                  {selectedGroupId !== 'all' && (
                    <div className="text-center mb-4 pb-2 border-b">
                      <h2 className="text-xl font-bold text-foreground">جدول محاضرات دفعة: {selectedGroupName}</h2>
                    </div>
                  )}
                  
                  <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: '90px repeat(6, 1fr)' }}>
                    <div className="p-3 bg-primary text-primary-foreground rounded-xl font-bold text-center text-sm">الفترة</div>
                    {DAYS_ORDER.map((day) => (
                      <div key={day} className="p-3 bg-primary text-primary-foreground rounded-xl font-bold text-center">{DAY_LABELS[day]}</div>
                    ))}
                  </div>
                  {uniqueTimeSlots.map((slot) => (
                    <div key={`${slot.start_time}-${slot.end_time}`} className="grid gap-2 mb-2" style={{ gridTemplateColumns: '90px repeat(6, 1fr)' }}>
                      <div className="p-2 bg-muted rounded-xl text-center text-xs font-medium flex flex-col justify-center">
                        <div className="font-bold">{formatTime(slot.start_time)}</div>
                        <div className="text-muted-foreground">-</div>
                        <div className="font-bold">{formatTime(slot.end_time)}</div>
                      </div>
                      {DAYS_ORDER.map((day) => {
                        const entries = getEntriesForSlot(day, slot.start_time, slot.end_time);
                        const slotId = `${day}|${formatTime(slot.start_time)}|${formatTime(slot.end_time)}`;
                        return (
                          <DroppableSlot key={day} id={slotId} isEmpty={entries.length === 0}>
                            {entries.length > 0 && (
                              <div className="space-y-1">
                                {entries.map((entry) => (
                                  <DraggableEntry key={entry.id} entry={entry} colors={getGroupColor(entry.subject?.group_id)} />
                                ))}
                              </div>
                            )}
                          </DroppableSlot>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <DragOverlay>
                  {activeEntry && (
                    <div className={cn("lecture-card p-3 min-h-[100px] shadow-2xl", getGroupColor(activeEntry.subject?.group_id).bg, getGroupColor(activeEntry.subject?.group_id).border)}>
                      <div className="font-bold text-sm text-center mb-1">{activeEntry.subject?.name}</div>
                      <div className="text-xs text-center mb-2">{activeEntry.subject?.professor?.name}</div>
                      <Badge className={getGroupColor(activeEntry.subject?.group_id).badge}>{activeEntry.subject?.group?.name}</Badge>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Room Selection Dialog */}
        <Dialog open={roomSelectDialog?.open || false} onOpenChange={(open) => !open && setRoomSelectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اختر القاعة</DialogTitle>
              <DialogDescription>
                {roomSelectDialog?.subjectType === 'practical' ? 'اختر المعمل المناسب' : 'اختر قاعة المحاضرات'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              {roomSelectDialog?.availableRooms.map((room) => (
                <Button key={room.id} variant="outline" onClick={() => handleRoomSelect(room.id)} className="justify-start gap-2">
                  <DoorOpen className="h-4 w-4" />
                  {room.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
