import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, Loader2, DatabaseBackup } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TABLES_TO_BACKUP = [
  'rooms', 'professors', 'student_groups', 'subjects', 'time_slots',
  'schedule_entries', 'saved_schedules', 'professor_unavailability',
];

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup: Record<string, any[]> = {};
      
      for (const table of TABLES_TO_BACKUP) {
        const { data, error } = await supabase.from(table as any).select('*');
        if (error) throw new Error(`خطأ في تصدير ${table}: ${error.message}`);
        backup[table] = data || [];
      }

      const json = JSON.stringify({
        version: '1.0',
        created_at: new Date().toISOString(),
        tables: backup,
      }, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jadwala-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('تم تصدير النسخة الاحتياطية بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.tables) {
        throw new Error('ملف النسخة الاحتياطية غير صالح');
      }

      // Import in order (respect foreign keys)
      const importOrder = [
        'rooms', 'professors', 'student_groups', 'time_slots',
        'subjects', 'saved_schedules', 'schedule_entries', 'professor_unavailability',
      ];

      for (const table of importOrder) {
        const rows = backup.tables[table];
        if (!rows || rows.length === 0) continue;

        // Remove id and timestamps to let DB generate new ones
        const cleanRows = rows.map((row: any) => {
          const { id, created_at, updated_at, ...rest } = row;
          return rest;
        });

        const { error } = await supabase.from(table as any).insert(cleanRows as any);
        if (error) {
          console.warn(`تحذير: خطأ في استيراد ${table}: ${error.message}`);
        }
      }

      toast.success('تم استيراد النسخة الاحتياطية بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setIsImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <Card className="card-glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DatabaseBackup className="h-5 w-5 text-primary" />
          النسخ الاحتياطي والاستعادة
        </CardTitle>
        <CardDescription>
          قم بتصدير بياناتك أو استيرادها من نسخة احتياطية سابقة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-2xl gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تصدير نسخة احتياطية
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button
              variant="outline"
              className="rounded-2xl gap-2"
              disabled={isImporting}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              استيراد نسخة احتياطية
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ الاستيراد سيضيف البيانات إلى البيانات الحالية ولن يحذف البيانات الموجودة
        </p>
      </CardContent>
    </Card>
  );
}
