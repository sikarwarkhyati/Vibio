-- Create analytics tracking table
CREATE TABLE public.event_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'search', 'book', 'share')),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on analytics table
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics
CREATE POLICY "Anyone can insert analytics data" 
ON public.event_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Organizers can view their event analytics" 
ON public.event_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_analytics.event_id 
    AND events.organizer_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_event_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX idx_event_analytics_action_type ON public.event_analytics(action_type);
CREATE INDEX idx_event_analytics_created_at ON public.event_analytics(created_at);
CREATE INDEX idx_event_analytics_user_id ON public.event_analytics(user_id);

-- Function to calculate popularity score
CREATE OR REPLACE FUNCTION public.calculate_event_popularity(event_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  view_count INTEGER := 0;
  booking_count INTEGER := 0;
  search_count INTEGER := 0;
  share_count INTEGER := 0;
  days_since_created INTEGER := 0;
  popularity_score INTEGER := 0;
BEGIN
  -- Get analytics counts for the last 30 days
  SELECT 
    COALESCE(SUM(CASE WHEN action_type = 'view' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN action_type = 'book' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN action_type = 'search' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN action_type = 'share' THEN 1 ELSE 0 END), 0)
  INTO view_count, booking_count, search_count, share_count
  FROM public.event_analytics 
  WHERE event_id = event_uuid 
  AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Get days since event was created
  SELECT EXTRACT(DAYS FROM (NOW() - created_at))
  INTO days_since_created
  FROM public.events 
  WHERE id = event_uuid;
  
  -- Calculate popularity score with weighted metrics
  -- Bookings are worth the most, then views, then searches, then shares
  -- Newer events get a small boost
  popularity_score := 
    (booking_count * 10) +  -- Bookings worth 10 points each
    (view_count * 2) +      -- Views worth 2 points each
    (search_count * 1) +    -- Searches worth 1 point each
    (share_count * 5) +     -- Shares worth 5 points each
    GREATEST(0, (30 - days_since_created)); -- Recency boost (max 30 points)
  
  RETURN popularity_score;
END;
$$;

-- Function to update all event popularity scores
CREATE OR REPLACE FUNCTION public.update_all_popularity_scores()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events 
  SET popularity_score = public.calculate_event_popularity(id)
  WHERE date >= NOW(); -- Only update future events
END;
$$;