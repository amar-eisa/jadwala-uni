import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FloatingInput } from '@/components/ui/floating-input';
import { useUserSettings, useUpdateUserSettings, useUploadUniversityLogo } from '@/hooks/useUserSettings';
import { Settings, Upload, Building2, Loader2, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
};

export default function SettingsPage() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const uploadLogo = useUploadUniversityLogo();
  
  const [universityName, setUniversityName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setUniversityName(settings.university_name || '');
      setPreviewUrl(settings.university_logo_url);
    }
  }, [settings]);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const url = await uploadLogo.mutateAsync(file);
    if (url) {
      await updateSettings.mutateAsync({ university_logo_url: url });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleFile(file);
    }
  };

  const handleSave = async () => {
    await updateSettings.mutateAsync({ university_name: universityName });
  };

  const isSaving = updateSettings.isPending || uploadLogo.isPending;

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="skeleton-row">
            <div className="skeleton-circle w-12 h-12" />
            <div className="space-y-2 flex-1">
              <div className="skeleton-line w-32" />
              <div className="skeleton-line-medium" />
            </div>
          </div>
          <div className="card-glass rounded-3xl p-6 space-y-6">
            <div className="skeleton-line w-40 h-6" />
            <div className="skeleton-line-medium h-12" />
            <div className="flex gap-6">
              <div className="w-32 h-32 rounded-2xl bg-muted animate-pulse" />
              <div className="space-y-3">
                <div className="skeleton-line w-24 h-10" />
                <div className="skeleton-line-short" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">الإعدادات</h1>
            <p className="text-muted-foreground text-sm">إعدادات المؤسسة والنظام</p>
          </div>
        </motion.div>

        {/* University Settings Card */}
        <motion.div variants={item}>
          <Card className="card-glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                بيانات المؤسسة
              </CardTitle>
              <CardDescription>
                قم بتخصيص بيانات مؤسستك التي ستظهر في النظام والتقارير
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* University Name */}
              <div className="max-w-md">
                <FloatingInput
                  id="university-name"
                  label="اسم الجامعة / المؤسسة"
                  icon={<Building2 className="h-4 w-4" />}
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </div>

              {/* University Logo */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">شعار المؤسسة</Label>
                <div className="flex items-start gap-6">
                  {/* Upload Zone with drag & drop */}
                  <div
                    className={cn(
                      "upload-zone w-32 h-32 flex items-center justify-center cursor-pointer overflow-hidden",
                      isDragOver && "drag-over"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="شعار المؤسسة" 
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground/50">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-[10px]">اسحب الصورة هنا</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="rounded-2xl"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLogo.isPending}
                    >
                      {uploadLogo.isPending ? (
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 ml-2" />
                      )}
                      رفع شعار
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG أو WebP بحجم لا يتجاوز 1MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-border/30">
                <Button onClick={handleSave} disabled={isSaving} className="rounded-2xl shimmer-button">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ الإعدادات'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
