import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CompleteProfileDialogProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

export function CompleteProfileDialog({ open, userId, onComplete }: CompleteProfileDialogProps) {
  const [phone, setPhone] = useState('+249');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone has at least some digits after code
    const numberPart = phone.replace(/^\+\d{1,3}/, '');
    if (numberPart.length < 6) {
      toast({ title: 'يرجى إدخال رقم هاتف صحيح', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone } as any)
      .eq('id', userId);
    
    setLoading(false);

    if (error) {
      toast({ title: 'حدث خطأ أثناء حفظ رقم الهاتف', variant: 'destructive' });
      return;
    }

    toast({ title: 'تم حفظ رقم الهاتف بنجاح' });
    onComplete();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>أكمل بياناتك</DialogTitle>
          <DialogDescription>يرجى إدخال رقم هاتفك لإكمال التسجيل</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <PhoneInput value={phone} onChange={setPhone} />
          <Button type="submit" className="w-full rounded-2xl h-12" disabled={loading}>
            {loading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري الحفظ...</> : 'حفظ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
