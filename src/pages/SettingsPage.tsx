import { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSettings, useUpdateUserSettings, useUploadUniversityLogo } from '@/hooks/useUserSettings';
import { Settings, Upload, Building2, Loader2, ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const uploadLogo = useUploadUniversityLogo();
  
  const [universityName, setUniversityName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setUniversityName(settings.university_name || '');
      setPreviewUrl(settings.university_logo_url);
    }
  }, [settings]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    const url = await uploadLogo.mutateAsync(file);
    if (url) {
      await updateSettings.mutateAsync({ university_logo_url: url });
    }
  };

  const handleSave = async () => {
    await updateSettings.mutateAsync({ university_name: universityName });
  };

  const isSaving = updateSettings.isPending || uploadLogo.isPending;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-muted-foreground">إعدادات المؤسسة والنظام</p>
          </div>
        </div>

        {/* University Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              بيانات المؤسسة
            </CardTitle>
            <CardDescription>
              قم بتخصيص بيانات مؤسستك التي ستظهر في النظام والتقارير
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* University Name */}
            <div className="space-y-2">
              <Label htmlFor="university-name">اسم الجامعة / المؤسسة</Label>
              <Input
                id="university-name"
                placeholder="أدخل اسم الجامعة أو المؤسسة"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* University Logo */}
            <div className="space-y-3">
              <Label>شعار المؤسسة</Label>
              <div className="flex items-start gap-6">
                {/* Preview */}
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/30 overflow-hidden">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="شعار المؤسسة" 
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
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
            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={isSaving}>
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
      </div>
    </Layout>
  );
}
