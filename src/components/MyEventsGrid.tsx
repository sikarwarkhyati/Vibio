import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import CreateEventForm from './CreateEventForm';
import { Calendar, MapPin, Users, DollarSign, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface MyEvent {
  id: string;
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
}

const MyEventsGrid: React.FC<MyEventsGridProps> = ({ onCreateEvent }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<MyEvent | null>(null);

  const fetchMyEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('organizer_id', user?.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });

      fetchMyEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, [user]);

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      concerts: 'bg-purple-100 text-purple-800 border-purple-200',
      tech: 'bg-blue-100 text-blue-800 border-blue-200',
      sports: 'bg-green-100 text-green-800 border-green-200',
      workshops: 'bg-orange-100 text-orange-800 border-orange-200',
      festivals: 'bg-pink-100 text-pink-800 border-pink-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-semibold mb-2">No events created yet</h3>
          <p className="text-muted-foreground mb-6">
            Start by creating your first event to manage bookings and track performance.
          </p>
          <Button 
            onClick={onCreateEvent}
            className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Event
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
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
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
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
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
                      {event.available_seats && (
                        <div className="flex items-center text-muted-foreground">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{event.available_seats} seats available</span>
                        </div>
                      )}
                      {event.price && (
                        <div className="flex items-center text-muted-foreground">
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span>${event.price}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 md:flex-col md:items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingEvent(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{event.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteEvent(event.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
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
                    <span>Popularity: {event.popularity_score || 0}</span>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
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
            fetchMyEvents(); // Refresh events after editing
          }}
          event={editingEvent}
        />
      )}
    </div>
  );
};

export default MyEventsGrid;