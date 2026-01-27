-- Drop the existing check constraint and recreate it with 'pending' status
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'inactive', 'expired', 'cancelled', 'pending'));