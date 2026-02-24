
-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN phone text;

-- Update handle_new_user to copy phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  RETURN new;
END;
$function$;
