
-- Fix overly permissive INSERT policy on notifications
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;

-- Only allow users with active subscriptions or admins to insert notifications
CREATE POLICY "Active users can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  is_subscription_active(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
);
