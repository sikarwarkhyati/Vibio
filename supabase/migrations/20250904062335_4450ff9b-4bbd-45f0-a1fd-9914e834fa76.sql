-- Extend app_role enum to include vendor and sponsor
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vendor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sponsor';

-- Add demographics to profiles for analytics
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS age_group text CHECK (age_group IN ('18-24', '25-34', '35-44', '45-54', '55-64', '65+'));

-- Add demographics to bookings for analytics tracking  
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS age_group text;

-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  service_category text NOT NULL CHECK (service_category IN ('security', 'stage_setup', 'lighting', 'food_stalls', 'photography', 'catering', 'entertainment', 'decoration', 'transport', 'other')),
  description text,
  contact_email text,
  contact_phone text,
  location text,
  price_range text,
  portfolio_images jsonb DEFAULT '[]'::jsonb,
  rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  availability boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies for vendors table
CREATE POLICY "Vendors can view all vendor profiles" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can create their own profile" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Vendors can update their own profile" ON public.vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can delete their own profile" ON public.vendors FOR DELETE USING (auth.uid() = user_id);

-- Create vendor_requests table
CREATE TABLE IF NOT EXISTS public.vendor_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  service_category text NOT NULL,
  message text,
  budget_range text,
  event_date timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  vendor_response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_requests
ALTER TABLE public.vendor_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_requests
CREATE POLICY "Organizers can create vendor requests" ON public.vendor_requests FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can view their own requests" ON public.vendor_requests FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "Vendors can view requests for them" ON public.vendor_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vendor_requests.vendor_id AND vendors.user_id = auth.uid()));
CREATE POLICY "Vendors can update their requests" ON public.vendor_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vendor_requests.vendor_id AND vendors.user_id = auth.uid()));
CREATE POLICY "Organizers can update their own requests" ON public.vendor_requests FOR UPDATE USING (auth.uid() = organizer_id);

-- Create sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  business_type text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  logo_url text,
  description text,
  sponsorship_tiers jsonb DEFAULT '[]'::jsonb,
  preferred_event_types text[] DEFAULT '{}',
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sponsors
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Create policies for sponsors table
CREATE POLICY "Anyone can view sponsor profiles" ON public.sponsors FOR SELECT USING (true);
CREATE POLICY "Sponsors can create their own profile" ON public.sponsors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sponsors can update their own profile" ON public.sponsors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sponsors can delete their own profile" ON public.sponsors FOR DELETE USING (auth.uid() = user_id);

-- Create sponsor_requests table
CREATE TABLE IF NOT EXISTS public.sponsor_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES public.sponsors(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  requested_amount numeric(10,2),
  sponsorship_tier text,
  event_description text,
  expected_attendance integer,
  target_audience text,
  benefits_offered text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  sponsor_response text,
  approved_amount numeric(10,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sponsor_requests
ALTER TABLE public.sponsor_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for sponsor_requests
CREATE POLICY "Organizers can create sponsor requests" ON public.sponsor_requests FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can view their own requests" ON public.sponsor_requests FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "Sponsors can view requests for them" ON public.sponsor_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.sponsors WHERE sponsors.id = sponsor_requests.sponsor_id AND sponsors.user_id = auth.uid()));
CREATE POLICY "Sponsors can update their requests" ON public.sponsor_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.sponsors WHERE sponsors.id = sponsor_requests.sponsor_id AND sponsors.user_id = auth.uid()));
CREATE POLICY "Organizers can update their own requests" ON public.sponsor_requests FOR UPDATE USING (auth.uid() = organizer_id);

-- Add vendors and sponsors to events table for tracking relationships
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS assigned_vendors jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS event_sponsors jsonb DEFAULT '[]'::jsonb;

-- Create triggers for updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_requests_updated_at
  BEFORE UPDATE ON public.vendor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsor_requests_updated_at
  BEFORE UPDATE ON public.sponsor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();