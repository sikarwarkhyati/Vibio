-- Drop the overly permissive policy that exposes all organizer data
DROP POLICY IF EXISTS "Anyone can view organizer public info" ON public.organizers;

-- Policy 1: Only authenticated users can view organizer info (removes anonymous access)
CREATE POLICY "Authenticated users can view organizer info" 
ON public.organizers 
FOR SELECT 
TO authenticated
USING (true);

-- Policy 2: Organizers can view their own full profile (including sensitive data)
CREATE POLICY "Organizers can view their own full profile" 
ON public.organizers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- For public access to basic info, we'll create a database function
-- that returns only non-sensitive organizer information
CREATE OR REPLACE FUNCTION public.get_public_organizer_info(organizer_uuid uuid)
RETURNS TABLE (
  id uuid,
  org_name text,
  description text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.org_name,
    o.description,
    o.created_at
  FROM public.organizers o
  WHERE o.id = organizer_uuid;
$$;

-- Grant execute permission to anonymous users for the function
GRANT EXECUTE ON FUNCTION public.get_public_organizer_info(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_organizer_info(uuid) TO authenticated;