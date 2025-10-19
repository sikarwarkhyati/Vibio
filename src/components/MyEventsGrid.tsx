// src/components/MyEventsGrid.tsx
import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import CreateEventForm from './CreateEventForm';
import { Calendar, MapPin, Users, DollarSign, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

export interface MyEvent {
  _id?: string; // raw Mongo id (may be present)
  id: string; // frontend-consumed id (always present after transformation)
  title: string;
  description?: string;
  date: string;
  location: string;
  venue?: string;
  event_type: string;
  image_url?: string;
  price?: number;
  available_seats?: number;
  popularity_score?: number;
  created_at: string;
}

interface MyEventsGridProps {
  onCreateEvent: () => void;
  organizerId?: string;
  loading?: boolean;
  events?: MyEvent[]; // optional: parent can pass events (we'll prioritize local fetch)
}

const MyEventsGrid: React.FC<MyEventsGridProps> = ({ onCreateEvent, organizerId }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingEvent, setEditingEvent] = useState<MyEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyEvent | null>(null); // for dialog

  const fetchMyEvents = async () => {
    if (!user || !organizerId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Accept several backend shapes: /events?organizerId=... OR /events/organizer?organizerId=...
      const res = await api
        .get('/events', { params: { organizerId } })
        .catch(async (err) => {
          // fallback path if your backend exposes a different organizer endpoint
          return api.get('/events/organizer', { params: { organizerId } }).catch(() => ({ data: [] }));
        });

      const fetched = res.data?.events ?? res.data ?? [];

      // Map Mongo _id -> id (keep original _id as well if present)
      const transformed: MyEvent[] = (Array.isArray(fetched) ? fetched : []).map((ev: any) => ({
        ...ev,
        id: ev._id ?? ev.id ?? String(ev._id ?? ev.id ?? Math.random().toString(36).slice(2, 9)),
      }));

      setEvents(transformed);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to fetch your events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/events/${eventId}`);
      toast({ title: 'Success', description: 'Event deleted successfully' });
      // refresh
      fetchMyEvents();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  useEffect(() => {
    fetchMyEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, organizerId]);

  const formatEventDate = (dateString: string) => format(new Date(dateString), 'MMM dd, yyyy');
  const formatEventTime = (dateString: string) => format(new Date(dateString), 'h:mm a');

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      concerts: 'bg-purple-100 text-purple-800 border-purple-200',
      tech: 'bg-blue-100 text-blue-800 border-blue-200',
      sports: 'bg-green-100 text-green-800 border-green-200',
      workshops: 'bg-orange-100 text-orange-800 border-orange-200',
      festivals: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[type] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-muted rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!loading && events.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-semibold mb-2">No events created yet</h3>
          <p className="text-muted-foreground mb-6">Start by creating your first event to manage bookings and track performance.</p>
          <Button onClick={onCreateEvent} className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Create Your First Event
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Event Image */}
              <div className="w-full md:w-48 h-48 md:h-32 bg-muted flex items-center justify-center">
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl">🎭</div>
                )}
              </div>

              {/* Event Details */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      <Badge className={getEventTypeColor(event.event_type)}>{event.event_type}</Badge>
                    </div>

                    {event.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{event.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatEventDate(event.date)} at {formatEventTime(event.date)}</span>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{event.venue || event.location}</span>
                      </div>

                      {event.available_seats !== undefined && (
                        <div className="flex items-center text-muted-foreground">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{event.available_seats} seats available</span>
                        </div>
                      )}

                      {event.price !== undefined && (
                        <div className="flex items-center text-muted-foreground">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>₹{event.price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingEvent(event)}>
                      <Edit className="w-4 h-4" />
                    </Button>

                    <AlertDialog open={!!deleteTarget && deleteTarget.id === event.id} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(event)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{event.title}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Created {format(new Date(event.created_at), 'MMM dd, yyyy')}</span>
                  <div className="flex items-center gap-4">
                    <span>Popularity: {event.popularity_score ?? 0}</span>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" /> View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Event Modal */}
      {editingEvent && (
        <CreateEventForm
          open={!!editingEvent}
          onClose={() => {
            setEditingEvent(null);
            fetchMyEvents();
          }}
          event={editingEvent}
        />
      )}
    </div>
  );
};

export default MyEventsGrid;
