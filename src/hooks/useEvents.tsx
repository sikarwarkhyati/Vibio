// src/hooks/useEvents.ts

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';

// 1. Interface for the data AS IT COMES FROM THE BACKEND (uses _id)
export interface Event {
  _id: string; 
  title: string;
  description?: string;
  date: string;
  location: string;
  event_type: string;
  image_url?: string;
  available_seats?: number;
  organizer_id: string;
  created_at: string;
  price?: number;
  venue?: string;
  popularity_score?: number;
}

// 2. Interface for the data AS IT IS USED BY THE FRONTEND (requires id)
// We merge Event with { id: string } and omit the unnecessary _id
type TransformedEvent = Omit<Event, '_id'> & { id: string };


export const useEvents = () => {
  // Use the transformed type for the state
  const [events, setEvents] = useState<TransformedEvent[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Minimal structure for dummy data 
  // NOTE: This dummy data must also be transformed to include 'id'
  const DUMMY_EVENTS: Event[] = [
    {
      _id: 'dummy-0001',
      title: 'Tech Innovation Summit 2025',
      description: 'Explore the latest in AI and emerging technologies.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'San Francisco, CA',
      venue: 'Moscone Center',
      event_type: 'tech',
      price: 299,
      available_seats: 500,
      organizer_id: 'dummy-organizer',
      created_at: new Date().toISOString(),
      popularity_score: 85,
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500'
    },
  ];

  const fetchEvents = async (filters?: {
    search?: string;
    category?: string;
    location?: string;
    dateFilter?: 'all' | 'today' | 'weekend' | 'next-week';
    sortBy?: 'date' | 'popularity';
  }) => {
    try {
      setLoading(true);
      setError(null);

      // Assuming your API returns { events: Event[], totalEvents: number }
      const res = await api.get('/events', { params: filters });
      const fetchedEvents: Event[] = res.data.events || [];

      let rawEvents: Event[] = [];

      if (!fetchedEvents || fetchedEvents.length === 0) {
        rawEvents = DUMMY_EVENTS;
      } else {
        rawEvents = fetchedEvents;
      }

      // CRITICAL FIX: Map the MongoDB '_id' field to 'id' for frontend components
      const transformedEvents: TransformedEvent[] = rawEvents.map(event => ({
        ...event,
        id: event._id, // Renames the database key to the frontend key
      }));
      
      setEvents(transformedEvents); // Sets state with the correct TransformedEvent[] type

    } catch (err) {
      const errorMessage = (err as any).response?.data?.message || (err as Error).message || 'Failed to fetch events';
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

  const bookEvent = async (eventId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to book events',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/bookings', { eventId });
      toast({
        title: 'Booking Successful!',
        description: 'Your event booking has been confirmed. You will receive a confirmation email shortly.',
      });
      fetchEvents(); // Refresh events for available seats
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to book event';
      toast({
        title: 'Booking Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events, // This is now TransformedEvent[]
    loading,
    error,
    fetchEvents,
    bookEvent,
    refetch: fetchEvents,
  };
};

export default useEvents;