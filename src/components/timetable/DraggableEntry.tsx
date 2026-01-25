import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScheduleEntry } from '@/types/database';
import { GripVertical } from 'lucide-react';

interface Props {
  entry: ScheduleEntry;
  colors: { bg: string; border: string; badge: string };
}

export function DraggableEntry({ entry, colors }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: entry.id,
    data: {
      entry,
      type: 'schedule-entry',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const groupName = entry.subject?.group?.name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-lg border-2 min-h-[90px] transition-all cursor-grab active:cursor-grabbing",
        colors.bg,
        colors.border,
        isDragging && "opacity-50 shadow-lg scale-105 z-50"
      )}
      {...listeners}
      {...attributes}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-between mb-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">اسحب للنقل</span>
      </div>
      
      {/* Subject Name */}
      <div className="font-bold text-base text-center text-foreground mb-1">
        {entry.subject?.name}
      </div>
      
      {/* Professor Name */}
      <div className="text-sm text-amber-700 text-center mb-3">
        {entry.subject?.professor?.name}
      </div>
      
      {/* Room & Group */}
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
}
