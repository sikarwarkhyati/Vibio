-- Database MVP Schema Migration

-- First, add missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS venue text,
ADD COLUMN IF NOT EXISTS time time,
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS popularity_score integer DEFAULT 0;

-- Update existing events to separate venue from location and add time
UPDATE public.events 
SET venue = location,
    time = EXTRACT(TIME FROM date)::time
WHERE venue IS NULL OR time IS NULL;

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_code text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'confirmed',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, event_id)
);

-- Create organizers table
CREATE TABLE IF NOT EXISTS public.organizers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    org_name text NOT NULL,
    description text,
    contact_email text,
    contact_phone text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings table
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for organizers table
CREATE POLICY "Organizers can view their own profile" 
ON public.organizers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create organizer profile" 
ON public.organizers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update their own profile" 
ON public.organizers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Organizers can delete their own profile" 
ON public.organizers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow everyone to view organizer info for events
CREATE POLICY "Anyone can view organizer public info" 
ON public.organizers 
FOR SELECT 
USING (true);

-- Function to generate unique ticket codes
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS text AS $$
BEGIN
    RETURN 'TKT-' || UPPER(substring(md5(random()::text), 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket codes
CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS trigger AS $$
BEGIN
    IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
        NEW.ticket_code := generate_ticket_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_ticket_code
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_code();

-- Trigger for updated_at timestamps
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at
    BEFORE UPDATE ON public.organizers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update events table to link with organizers (optional - keep existing organizer_id for now)
-- ALTER TABLE public.events 
-- ADD COLUMN organizer_profile_id uuid REFERENCES public.organizers(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON public.bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON public.organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_events_popularity ON public.events(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_events_price ON public.events(price);
CREATE INDEX IF NOT EXISTS idx_events_venue ON public.events(venue);

-- Add some sample organizers
INSERT INTO public.organizers (user_id, org_name, description, contact_email) 
VALUES 
((SELECT id FROM auth.users LIMIT 1), 'Zevo Events', 'Professional event management company specializing in tech conferences and cultural events', 'contact@zevoevents.com')
ON CONFLICT (user_id) DO NOTHING;