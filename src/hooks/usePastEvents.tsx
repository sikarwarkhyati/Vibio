import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PastEventBooking {
  id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    description?: string;
    date: string;
    location: string;
    venue?: string;
    event_type: string;
    image_url?: string;
    price?: number;
  };
}

export const usePastEvents = () => {
  const [pastEvents, setPastEvents] = useState<PastEventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPastEvents = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          ticket_code,
          status,
          created_at,
          event:events!inner (
            id,
            title,
            description,
            date,
            location,
            venue,
            event_type,
            image_url,
            price
          )
        `)
        .eq('user_id', user.id)
        .lt('events.date', new Date().toISOString())
        .order('events.date', { ascending: false });

      if (error) {
        throw error;
      }

      setPastEvents(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch past events';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastEvents();
  }, [user]);

  return {
    pastEvents,
    loading,
    error,
    refetch: fetchPastEvents,
  };
};

export default usePastEvents;