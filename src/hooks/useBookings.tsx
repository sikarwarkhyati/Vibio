// src/hooks/useBookings.tsx
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export interface BookingWithEvent {
  id: string; // transformed from _id
  ticket_code: string;
  status: string;
  created_at: string;
  user_id: string;
  event: {
    id: string; // transformed from _id
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

export const useBookings = () => {
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/bookings/user/${user._id}`);
      const fetched = res.data.bookings || [];

      // ✅ Transform _id → id (for both booking and nested event)
      const transformed = fetched.map((b: any) => ({
        ...b,
        id: b._id,
        event: {
          ...b.event,
          id: b.event?._id,
        },
      }));

      setBookings(transformed);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch bookings';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!user) return;

    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast({ title: 'Booking Cancelled', description: 'Your booking has been cancelled successfully.' });
      fetchBookings();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel booking';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  return { bookings, loading, error, fetchBookings, cancelBooking, refetch: fetchBookings };
};

export default useBookings;
