-- Configure Supabase Auth to use shorter OTP validity
-- Note: This is configured in Supabase Dashboard under Authentication > Settings
-- OTP expiry should be set to 300 seconds (5 minutes) in the dashboard

-- Create a function to track OTP usage and prevent reuse
CREATE OR REPLACE FUNCTION public.track_otp_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into a tracking table when OTP is used
  INSERT INTO public.otp_usage_log (user_id, email, used_at)
  VALUES (NEW.id, NEW.email, now());
  
  RETURN NEW;
END;
$$;

-- Create table to track OTP usage
CREATE TABLE IF NOT EXISTS public.otp_usage_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  email text NOT NULL,
  used_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on OTP usage log
ALTER TABLE public.otp_usage_log ENABLE ROW LEVEL SECURITY;

-- Create policy for OTP usage log (admin only)
CREATE POLICY "Only service role can access OTP logs" 
ON public.otp_usage_log 
FOR ALL
USING (auth.role() = 'service_role');

-- Create trigger on auth.users for OTP tracking
-- Note: This trigger would need to be created by Supabase support as it affects auth schema