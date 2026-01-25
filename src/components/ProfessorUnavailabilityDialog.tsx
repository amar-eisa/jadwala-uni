import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Clock, CalendarOff } from 'lucide-react';
import { DayOfWeek, DAY_LABELS } from '@/types/database';
import { 
  useProfessorUnavailability, 
  useAddProfessorUnavailability, 
  useDeleteProfessorUnavailability 
} from '@/hooks/useProfessorUnavailability';
import { useTimeSlots } from '@/hooks/useTimeSlots';

const DAYS: DayOfWeek[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

interface Props {
  professor: { id: string; name: string } | null;
  onClose: () => void;
}

export function ProfessorUnavailabilityDialog({ professor, onClose }: Props) {
  const { data: unavailability, isLoading } = useProfessorUnavailability(professor?.id ?? null);
  const { data: timeSlots } = useTimeSlots();
  const addUnavailability = useAddProfessorUnavailability();
  const deleteUnavailability = useDeleteProfessorUnavailability();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('saturday');
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Get unique time ranges from time slots
  const uniqueTimeRanges = timeSlots
    ? [...new Set(timeSlots.map(ts => `${ts.start_time}-${ts.end_time}`))]
        .map(range => {
          const [start, end] = range.split('-');
          return { start, end };
        })
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];

  const handleAdd = async () => {
    if (!professor) return;
    
    if (!allDay && (!startTime || !endTime)) {
      return;
    }

    await addUnavailability.mutateAsync({
      professor_id: professor.id,
      day: selectedDay,
      start_time: allDay ? null : startTime,
      end_time: allDay ? null : endTime,
      all_day: allDay,
    });

    // Reset form
    setAllDay(false);
    setStartTime('');
    setEndTime('');
  };

  const handleDelete = async (id: string) => {
    if (!professor) return;
    await deleteUnavailability.mutateAsync({ id, professorId: professor.id });
  };

  const formatTime = (time: string | null) => time?.slice(0, 5) ?? '';

  return (
    <Dialog open={!!professor} onOpenChange={() => onClose()}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            أوقات عدم التوفر - {professor?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Unavailability List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">الأوقات المحددة حالياً</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">جاري التحميل...</p>
            ) : unavailability?.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد أوقات محددة</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unavailability?.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1.5"
                  >
                    <span>
                      {DAY_LABELS[item.day]}
                      {item.all_day ? ' (كامل اليوم)' : ` (${formatTime(item.start_time)} - ${formatTime(item.end_time)})`}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="mr-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Add New Unavailability */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">إضافة وقت جديد</Label>
            
            {/* Day Selection */}
            <div className="space-y-2">
              <Label htmlFor="day">اليوم</Label>
              <Select value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {DAY_LABELS[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* All Day Checkbox */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="all-day"
                checked={allDay}
                onCheckedChange={(checked) => {
                  setAllDay(checked === true);
                  if (checked) {
                    setStartTime('');
                    setEndTime('');
                  }
                }}
              />
              <Label htmlFor="all-day" className="text-sm cursor-pointer">
                غير متوفر طوال اليوم
              </Label>
            </div>

            {/* Time Selection */}
            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">من الساعة</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueTimeRanges.map(({ start }) => (
                        <SelectItem key={start} value={start}>
                          {start.slice(0, 5)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">إلى الساعة</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueTimeRanges.map(({ end }) => (
                        <SelectItem key={end} value={end}>
                          {end.slice(0, 5)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button 
              onClick={handleAdd} 
              disabled={addUnavailability.isPending || (!allDay && (!startTime || !endTime))}
              className="w-full"
            >
              <Clock className="h-4 w-4 ml-2" />
              {addUnavailability.isPending ? 'جاري الإضافة...' : 'إضافة وقت عدم التوفر'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
