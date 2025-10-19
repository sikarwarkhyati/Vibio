// src/hooks/usePastEvents.tsx
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export interface PastEventBooking {
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

      const res = await api.get(`/bookings/user/${user._id}?past=true`);
      setPastEvents(res.data.bookings || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch past events';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastEvents();
  }, [user]);

  return { pastEvents, loading, error, refetch: fetchPastEvents };
};

export default usePastEvents;
