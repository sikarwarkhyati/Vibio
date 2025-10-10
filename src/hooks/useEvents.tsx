import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
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

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

      let query = supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString()); // Only future events

      // Apply sorting
      if (filters?.sortBy === 'popularity') {
        query = query.order('popularity_score', { ascending: false }).order('date', { ascending: true });
      } else {
        query = query.order('date', { ascending: true });
      }

      // Apply filters
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('event_type', filters.category);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Apply date filters
      if (filters?.dateFilter && filters.dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date, endDate: Date;

        switch (filters.dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'weekend':
            const dayOfWeek = now.getDay();
            const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 2);
            break;
          case 'next-week':
            const daysUntilNextMonday = (7 - dayOfWeek + 1) % 7 || 7;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextMonday);
            endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 7);
            break;
          default:
            startDate = now;
            endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        }

        query = query.gte('date', startDate.toISOString()).lt('date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const events = data || [];
      
      // If no events exist, show dummy events for better UX
      if (events.length === 0 && !filters?.search && !filters?.category && !filters?.location) {
        const dummyEvents = [
          {
            id: 'dummy-1',
            title: 'Tech Innovation Summit 2025',
            description: 'Join industry leaders to explore the latest in AI, blockchain, and emerging technologies.',
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
          {
            id: 'dummy-2', 
            title: 'Summer Music Festival',
            description: 'A weekend of incredible music featuring top artists from around the world.',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Austin, TX',
            venue: 'Zilker Park',
            event_type: 'festivals',
            price: 199,
            available_seats: 2000,
            organizer_id: 'dummy-organizer',
            created_at: new Date().toISOString(),
            popularity_score: 92,
            image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'
          },
          {
            id: 'dummy-3',
            title: 'Digital Marketing Workshop',
            description: 'Learn the latest digital marketing strategies and tools to grow your business.',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'New York, NY',
            venue: 'WeWork Times Square',
            event_type: 'workshops',
            price: 149,
            available_seats: 50,
            organizer_id: 'dummy-organizer',
            created_at: new Date().toISOString(),
            popularity_score: 78,
            image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500'
          },
          {
            id: 'dummy-4',
            title: 'NBA Championship Game',
            description: 'Experience the thrill of professional basketball at its finest.',
            date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Los Angeles, CA',
            venue: 'Staples Center',
            event_type: 'sports',
            price: 250,
            available_seats: 300,
            organizer_id: 'dummy-organizer',
            created_at: new Date().toISOString(),
            popularity_score: 88,
            image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500'
          },
          {
            id: 'dummy-5',
            title: 'Classical Concert Series',
            description: 'An evening of beautiful classical music performed by world-renowned musicians.',
            date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Boston, MA',
            venue: 'Boston Symphony Hall',
            event_type: 'concerts',
            price: 89,
            available_seats: 150,
            organizer_id: 'dummy-organizer',
            created_at: new Date().toISOString(),
            popularity_score: 75,
            image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500'
          },
          {
            id: 'dummy-6',
            title: 'Food & Wine Festival',
            description: 'Taste amazing dishes and wines from top chefs and wineries.',
            date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Napa Valley, CA',
            venue: 'Outdoor Pavilion',
            event_type: 'festivals',
            price: 125,
            available_seats: 800,
            organizer_id: 'dummy-organizer',
            created_at: new Date().toISOString(),
            popularity_score: 82,
            image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500'
          }
        ];
        setEvents(dummyEvents);
      } else {
        setEvents(events);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
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
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to book events',
          variant: 'destructive',
        });
        return;
      }

      // Check if already booked
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingBooking) {
        toast({
          title: 'Already Booked',
          description: 'You have already booked this event',
          variant: 'destructive',
        });
        return;
      }

      // Create booking (ticket_code will be auto-generated by trigger)
      const { error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          event_id: eventId,
          status: 'confirmed',
          ticket_code: '' // Will be auto-generated by database trigger
        }]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Booking Successful!',
        description: 'Your event booking has been confirmed. You will receive a confirmation email shortly.',
      });
      
      // Refresh events to update available seats
      fetchEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to book event';
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
    events,
    loading,
    error,
    fetchEvents,
    bookEvent,
    refetch: fetchEvents,
  };
};

export default useEvents;