import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 text-center" dir="rtl">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h1 className="text-2xl font-bold mb-3">حدث خطأ غير متوقع</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        نعتذر عن هذا الخطأ. تم تسجيل المشكلة تلقائياً وسيتم معالجتها في أقرب وقت.
      </p>
      <Button onClick={() => window.location.reload()} size="lg">
        إعادة المحاولة
      </Button>
    </div>
  );
}
