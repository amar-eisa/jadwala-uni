
-- Update handle_new_user_role: first user gets admin, others get user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count integer;
BEGIN
  -- Count existing users (excluding the current one being created)
  SELECT count(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    -- First user gets admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'user');
  END IF;
  
  RETURN new;
END;
$function$;

-- Update handle_new_user_subscription: first user gets active, others get pending
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count integer;
BEGIN
  SELECT count(*) INTO user_count FROM public.subscriptions;
  
  IF user_count = 0 THEN
    -- First user gets active subscription immediately
    INSERT INTO public.subscriptions (user_id, plan_name, status, price)
    VALUES (new.id, 'premium', 'active', 0);
  ELSE
    -- All other users start as pending (need admin approval)
    INSERT INTO public.subscriptions (user_id, plan_name, status, price)
    VALUES (new.id, 'free', 'pending', 0);
  END IF;
  
  RETURN new;
END;
$function$;
