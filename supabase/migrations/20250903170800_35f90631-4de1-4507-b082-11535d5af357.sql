-- Create proper role-based authentication system

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('user', 'organizer', 'admin');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Update the handle_new_user_profile function to assign roles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Create rewards record
  INSERT INTO public.user_rewards (user_id)
  VALUES (NEW.id);
  
  -- Assign role based on metadata or default to 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role, 
      'user'::app_role
    )
  );
  
  -- If role is organizer, create organizer profile
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'::app_role) = 'organizer' THEN
    INSERT INTO public.organizers (
      user_id, 
      org_name, 
      contact_email,
      description
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'org_name', NEW.raw_user_meta_data->>'full_name', 'Organization'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'description', '')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;