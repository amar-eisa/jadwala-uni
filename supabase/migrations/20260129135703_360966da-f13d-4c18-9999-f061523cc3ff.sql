-- Create user_settings table
CREATE TABLE public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    university_name text,
    university_logo_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for university logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('university-logos', 'university-logos', true);

-- Storage policies
CREATE POLICY "Anyone can view university logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'university-logos');

CREATE POLICY "Users can upload their own logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'university-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'university-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'university-logos' AND auth.uid()::text = (storage.foldername(name))[1]);