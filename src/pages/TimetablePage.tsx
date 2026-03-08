import { useState, useMemo, useCallback, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useScheduleEntries, useGenerateSchedule, useClearSchedule, useMoveScheduleEntry } from '@/hooks/useSchedule';
import { ScheduleReportDialog, ScheduleReport } from '@/components/ScheduleReportDialog';
import { useSavedSchedules, useSaveSchedule, useActivateSchedule, useDeleteSavedSchedule, useDuplicateSchedule } from '@/hooks/useSavedSchedules';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useRooms } from '@/hooks/useRooms';
import { useProfessors } from '@/hooks/useProfessors';
import { useStudentGroups } from '@/hooks/useStudentGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { DayOfWeek, DAY_LABELS, ScheduleEntry, Room } from '@/types/database';
import { Wand2, Trash2, Filter, FileDown, GripVertical, Clock, Users, Save, AlertCircle, Sparkles, RefreshCw, FileText, DoorOpen, FolderOpen, BookOpen, GraduationCap, MapPin, FileSpreadsheet, History } from 'lucide-react';
import { RichTooltip } from '@/components/ui/rich-tooltip';
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
import { SaveScheduleDialog } from '@/components/SaveScheduleDialog';
import { SavedSchedulesList } from '@/components/SavedSchedulesList';
import { useUserSettings } from '@/hooks/useUserSettings';
import { exportToCSV, exportToExcel } from '@/hooks/useExport';
import { useActivityLogs, logActivity } from '@/hooks/useActivityLog';
import { ActivityLogPanel } from '@/components/ActivityLogPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const isLab = entry.subject?.type === 'practical';

  const tooltipContent = (
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
          <span>{entry.room?.name} ({entry.room?.type === 'lab' ? 'معمل' : 'قاعة'})</span>
        </div>
        {groupName && (
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{groupName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
          <Badge variant="outline" className="text-[10px]">{isLab ? 'عملي' : 'نظري'}</Badge>
        </div>
      </div>
    </div>
  );

  return (
    <RichTooltip content={tooltipContent} side="top">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "lecture-card p-3 min-h-[100px] cursor-grab active:cursor-grabbing relative overflow-hidden",
          colors.bg,
          colors.border,
          isDragging && "opacity-50 shadow-xl ring-2 ring-primary"
        )}
        {...listeners}
        {...attributes}
      >
        {/* Side color strip */}
        <div className={cn(
          "absolute top-0 right-0 w-1 h-full rounded-r-2xl",
          isLab ? "bg-success" : "bg-primary"
        )} />
        
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
    </RichTooltip>
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
  
  // Get ALL saved schedules (not filtered by group)
  const { data: savedSchedules, isLoading: isLoadingSaved } = useSavedSchedules();
  
  // Group selection for generation
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  
  // Track if we have a draft (unsaved generated schedule)
  const [hasDraft, setHasDraft] = useState(false);
  
  // Track if we're viewing a specific saved schedule (to bypass group filtering)
  const [viewingScheduleId, setViewingScheduleId] = useState<string | null>(null);
  
  // Determine active schedule based on context
  const activeSchedule = useMemo(() => {
    if (!savedSchedules) return null;
    
    // First, find any active schedule
    const anyActive = savedSchedules.find(s => s.is_active);
    if (!anyActive) return null;
    
    // If viewing a specific group:
    if (selectedGroupId !== 'all') {
      // Prefer a group-specific active schedule
      const groupActive = savedSchedules.find(
        s => s.is_active && s.group_id === selectedGroupId
      );
      if (groupActive) return groupActive;
      
      // Fall back to global active schedule (group_id = null)
      const globalActive = savedSchedules.find(
        s => s.is_active && s.group_id === null
      );
      if (globalActive) return globalActive;
    }
    
    // If viewing all groups, use global active or any active
    if (selectedGroupId === 'all') {
      const globalActive = savedSchedules.find(
        s => s.is_active && s.group_id === null
      );
      if (globalActive) return globalActive;
    }
    
    // Fallback to any active schedule
    return anyActive;
  }, [savedSchedules, selectedGroupId]);
  
  // Fetch schedule entries based on active schedule
  const { data: scheduleEntries, isLoading } = useScheduleEntries(activeSchedule?.id);
  const { data: timeSlots } = useTimeSlots();
  const { data: rooms } = useRooms();
  const { data: professors } = useProfessors();
  const { data: groups } = useStudentGroups();
  const { data: subjects } = useSubjects();
  const generateSchedule = useGenerateSchedule();
  const clearSchedule = useClearSchedule();
  const moveEntry = useMoveScheduleEntry();
  const { exportToPdf, isExporting } = usePdfExport();
  const { data: userSettings } = useUserSettings();
  
  // Saved schedules hooks
  const saveSchedule = useSaveSchedule();
  const activateSchedule = useActivateSchedule();
  const deleteSavedSchedule = useDeleteSavedSchedule();
  const duplicateSchedule = useDuplicateSchedule();
  const { data: activityLogs = [], isLoading: isLoadingLogs } = useActivityLogs({ entityType: undefined, limit: 50 });

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  
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

  // Auto-switch to the group when activating a group-specific schedule
  const handleActivateSchedule = useCallback((scheduleId: string) => {
    // Set viewing mode to the saved schedule
    setViewingScheduleId(scheduleId);
    setHasDraft(false);
    activateSchedule.mutate(scheduleId);
  }, [savedSchedules, activateSchedule]);

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
    
    // Only filter by selected group when NOT viewing a saved schedule
    // When viewing a saved schedule, show all its entries without group filtering
    if (!viewingScheduleId && selectedGroupId && selectedGroupId !== 'all') {
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
  }, [scheduleEntries, selectedGroupId, filterType, filterId, viewingScheduleId]);

  // Check if active schedule is empty (for showing helpful message)
  const isActiveScheduleEmpty = activeSchedule && scheduleEntries?.length === 0;

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
    // Exit viewing mode when generating new schedule
    setViewingScheduleId(null);
    const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
    await generateSchedule.mutateAsync({ 
      groupId, 
      scheduleId: activeSchedule?.id 
    });
    setHasDraft(true);
    toast({
      title: 'تم إنشاء جدول جديد',
      description: 'يمكنك حفظه كإصدار جديد أو توليد جدول مختلف',
    });
  };

  const handleClearSchedule = async () => {
    // Exit viewing mode when clearing
    setViewingScheduleId(null);
    const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
    const groupName = selectedGroupId === 'all' 
      ? 'جميع الجداول' 
      : groups?.find(g => g.id === selectedGroupId)?.name || 'الجدول';
    
    if (confirm(`هل تريد مسح ${groupName}؟`)) {
      await clearSchedule.mutateAsync({ 
        groupId, 
        scheduleId: activeSchedule?.id 
      });
      setHasDraft(false);
    }
  };

  const getExportTitle = () => {
    const groupName = selectedGroupId === 'all' 
      ? undefined 
      : groups?.find(g => g.id === selectedGroupId)?.name;
    return groupName ? `جدول-${groupName}` : 'الجدول-الدراسي';
  };

  const handleExportPdf = async () => {
    const groupName = selectedGroupId === 'all' 
      ? undefined 
      : groups?.find(g => g.id === selectedGroupId)?.name;
    
    await exportToPdf('timetable-grid', { 
      filename: getExportTitle(),
      groupName,
      orientation: 'landscape',
      universityLogoUrl: userSettings?.university_logo_url,
      universityName: userSettings?.university_name
    });
  };

  const handleExportCSV = () => {
    exportToCSV({ entries: filteredEntries, timeSlots: uniqueTimeSlots, title: getExportTitle() });
  };

  const handleExportExcel = () => {
    exportToExcel({ entries: filteredEntries, timeSlots: uniqueTimeSlots, title: getExportTitle() });
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

  // Get viewing schedule details
  const viewingSchedule = useMemo(() => {
    if (!viewingScheduleId || !savedSchedules) return null;
    return savedSchedules.find(s => s.id === viewingScheduleId) || null;
  }, [viewingScheduleId, savedSchedules]);

  // Get selected group name for display (only when not viewing saved schedule)
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
            <p className="text-muted-foreground mt-1">اختر الدفعة ثم قم بتوليد جدول جديد أو اختر من الجداول المحفوظة</p>
          </div>
        </div>

        {/* Top Section: Generator + Saved Schedules side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Generator Card - takes 1 column */}
          <Card className="border-0 shadow-card lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                توليد جدول جديد
              </CardTitle>
              <CardDescription>
                اختر الدفعة ثم اضغط توليد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Group Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">اختر الدفعة</label>
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
              
              {/* Generate Button */}
              <Button 
                onClick={handleGenerateSchedule} 
                disabled={generateSchedule.isPending || !canGenerate || !isActiveSubscription} 
                className="w-full gap-2 shadow-lg shadow-primary/25"
                size="lg"
              >
                {generateSchedule.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    توليد جدول جديد
                  </>
                )}
              </Button>
              
              {/* Info text */}
              <p className="text-xs text-muted-foreground text-center">
                💡 كل ضغطة ستنتج جدولاً مختلفاً
              </p>
              
              {/* Draft indicator */}
              {hasDraft && (
                <Alert className="border-warning/50 bg-warning/10">
                  <FileText className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-sm">مسودة غير محفوظة</AlertTitle>
                  <AlertDescription className="text-xs">
                    تم توليد جدول جديد. احفظه كإصدار جديد أو جرب توليد جدول مختلف.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Saved Schedules - takes 2 columns */}
          <div className="lg:col-span-2">
            <SavedSchedulesList
              schedules={savedSchedules || []}
              groups={groups || []}
              isLoading={isLoadingSaved}
              onActivate={handleActivateSchedule}
              onDelete={(id) => deleteSavedSchedule.mutate(id)}
              onExportCsv={() => handleExportCSV()}
              onExportExcel={() => handleExportExcel()}
              onDuplicate={(id, name) => duplicateSchedule.mutate({ scheduleId: id, newName: name })}
              disabled={!isActiveSubscription}
            />
          </div>
        </div>

        {/* Empty Schedule Alert */}
        {isActiveScheduleEmpty && !hasDraft && (
          <div className="card-soft rounded-3xl p-10 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-lg font-bold">الجدول المحفوظ فارغ</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              هذا الجدول لا يحتوي على محاضرات. يمكنك إعادة توليد الجدول وحفظه كنسخة جديدة.
            </p>
            <Button asChild className="gap-2 rounded-2xl">
              <Link to="#" onClick={(e) => { e.preventDefault(); handleGenerateSchedule(); }}>
                <Wand2 className="h-4 w-4" />
                إعادة توليد الجدول
              </Link>
            </Button>
          </div>
        )}

        {/* Actions Bar */}
        <Card className="border-0 shadow-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Left side: Current context info */}
              <div className="flex items-center gap-3">
                {viewingScheduleId && viewingSchedule ? (
                  // Viewing a saved schedule
                  <Badge variant="default" className="gap-1 bg-primary text-primary-foreground">
                    <FolderOpen className="h-3 w-3" />
                    جدول محفوظ: {viewingSchedule.name}
                  </Badge>
                ) : (
                  // In generation mode
                  <>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {selectedGroupName}
                    </Badge>
                    {hasDraft && (
                      <Badge variant="secondary" className="gap-1 bg-warning/20 text-warning border-warning/30">
                        <FileText className="h-3 w-3" />
                        مسودة
                      </Badge>
                    )}
                  </>
                )}
                {filteredEntries.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {filteredEntries.length} محاضرة
                  </span>
                )}
              </div>
              
              {/* Right side: Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={() => setSaveDialogOpen(true)} 
                  disabled={!filteredEntries?.length || !isActiveSubscription} 
                  className="gap-2"
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">حفظ كإصدار جديد</span>
                  <span className="sm:hidden">حفظ</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={isExporting || !filteredEntries?.length} 
                      className="gap-2"
                      size="sm"
                    >
                      <FileDown className="h-4 w-4" />
                      <span className="hidden sm:inline">تصدير</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                    <DropdownMenuItem onClick={handleExportPdf}>
                      <FileText className="h-4 w-4 ml-2" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="h-4 w-4 ml-2" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileDown className="h-4 w-4 ml-2" />
                      CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  variant="outline" 
                  onClick={handleClearSchedule} 
                  disabled={clearSchedule.isPending || !filteredEntries?.length || !isActiveSubscription} 
                  className="gap-2"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">مسح</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              تصفية الجدول
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
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">جاري تحميل الجدول...</p>
                </div>
              </div>
            ) : uniqueTimeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">لا توجد فترات زمنية</h3>
                <p className="text-sm text-muted-foreground max-w-sm text-center">
                  أضف فترات زمنية أولاً لعرض الجدول الأسبوعي
                </p>
                <Button asChild variant="outline" className="gap-2 rounded-2xl">
                  <Link to="/time-slots">
                    <Clock className="h-4 w-4" />
                    إضافة فترات زمنية
                  </Link>
                </Button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div id="timetable-grid" className="min-w-[900px] p-4 bg-white">
                  {/* Header row with group name for PDF */}
                  {viewingScheduleId && viewingSchedule ? (
                    <div className="text-center mb-4 pb-2 border-b">
                      <h2 className="text-xl font-bold text-foreground">{viewingSchedule.name}</h2>
                    </div>
                  ) : selectedGroupId !== 'all' && (
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

        {/* Activity Log */}
        <ActivityLogPanel logs={activityLogs} isLoading={isLoadingLogs} />

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

        {/* Save Schedule Dialog */}
        <SaveScheduleDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={(name) => {
            const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
            saveSchedule.mutate({ name, groupId }, {
              onSuccess: () => {
                setSaveDialogOpen(false);
                setHasDraft(false);
              },
            });
          }}
          isPending={saveSchedule.isPending}
          groupName={selectedGroupId !== 'all' ? selectedGroupName : undefined}
        />
      </div>
    </Layout>
  );
}
