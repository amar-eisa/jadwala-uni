import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Props {
  id: string;
  day: string;
  timeSlotId: string;
  children: ReactNode;
  isEmpty: boolean;
}

export function DroppableSlot({ id, day, timeSlotId, children, isEmpty }: Props) {
  const { isOver, setNodeRef, active } = useDroppable({
    id,
    data: {
      day,
      timeSlotId,
      type: 'slot',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-1 rounded-lg transition-all duration-200",
        isEmpty ? "bg-muted/20" : "bg-muted/20",
        isOver && active && "bg-primary/20 border-2 border-dashed border-primary",
        isOver && !active && "bg-muted/30"
      )}
    >
      {children}
    </div>
  );
}
