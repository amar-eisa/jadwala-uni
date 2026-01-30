import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface SaveScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  isPending: boolean;
  groupName?: string;
}

export function SaveScheduleDialog({
  open,
  onOpenChange,
  onSave,
  isPending,
  groupName,
}: SaveScheduleDialogProps) {
  const [scheduleName, setScheduleName] = useState('');

  const handleSave = () => {
    if (scheduleName.trim()) {
      onSave(scheduleName.trim());
      setScheduleName('');
    }
  };

  const defaultName = groupName 
    ? `جدول ${groupName} - ${new Date().toLocaleDateString('ar-EG')}`
    : `الجدول الدراسي - ${new Date().toLocaleDateString('ar-EG')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            حفظ الجدول
          </DialogTitle>
          <DialogDescription>
            أدخل اسماً للجدول لحفظه واسترجاعه لاحقاً
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="schedule-name">اسم الجدول</Label>
            <Input
              id="schedule-name"
              placeholder={defaultName}
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
          
          {groupName && (
            <p className="text-sm text-muted-foreground">
              سيتم حفظ جدول دفعة: <span className="font-medium text-foreground">{groupName}</span>
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isPending || !scheduleName.trim()}
          >
            {isPending ? 'جاري الحفظ...' : 'حفظ الجدول'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
