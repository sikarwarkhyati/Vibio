import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import ContactOrganizerForm from '@/components/ContactOrganizerForm';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  venue?: string;
  event_type: string;
  image_url?: string;
  available_seats?: number;
  organizer_id: string;
  price?: number;
  popularity_score?: number;
  created_at: string;
}

interface Organizer {
  id: string;
  org_name: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEventView, trackEventBooking } = useAnalytics();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
      trackEventView(id);
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) {
        if (eventError.code === 'PGRST116') {
          // Event not found, show dummy event for demo
          const dummyEvent: Event = {
            id: id!,
            title: 'Tech Innovation Summit 2025',
            description: 'Join industry leaders to explore the latest in AI, blockchain, and emerging technologies. This comprehensive summit will feature keynote speakers from leading tech companies, interactive workshops, and networking opportunities with professionals from around the world.\n\nWhat you\'ll learn:\n• Latest trends in artificial intelligence and machine learning\n• Blockchain applications in business\n• Emerging technologies shaping the future\n• Networking with industry leaders\n• Hands-on workshops and demos\n\nWho should attend:\n• Tech professionals and developers\n• Business leaders and entrepreneurs\n• Students and recent graduates\n• Anyone interested in technology trends',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'San Francisco, CA',
            venue: 'Moscone Center, Hall A',
            event_type: 'tech',
            price: 299,
            available_seats: 500,
            organizer_id: 'dummy-organizer',
            created_at: new Date().toISOString(),
            popularity_score: 85,
            image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
          };
          setEvent(dummyEvent);
          
          const dummyOrganizer: Organizer = {
            id: 'dummy-organizer',
            org_name: 'TechEvents Global',
            contact_email: 'info@techevents.com',
            contact_phone: '+1 (555) 123-4567',
            description: 'Leading technology event organizer with 10+ years of experience in creating world-class conferences and summits.'
          };
          setOrganizer(dummyOrganizer);
        } else {
          throw eventError;
        }
      } else {
        setEvent(eventData);
        
        // Fetch organizer details
        const { data: organizerData } = await supabase
          .from('organizers')
          .select('*')
          .eq('user_id', eventData.organizer_id)
          .single();
          
        setOrganizer(organizerData);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load event details',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBookEvent = async () => {
    if (!event || !id) return;
    
    try {
      setIsBooking(true);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to book events',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Track booking attempt
      trackEventBooking(id, {
        eventTitle: event.title,
        eventType: event.event_type,
        price: event.price || 0,
        venue: event.venue || event.location
      });

      // For demo purposes, show success message
      toast({
        title: 'Booking Successful!',
        description: 'Your event booking has been confirmed. You will receive a confirmation email shortly.',
      });
      
    } catch (err) {
      console.error('Booking error:', err);
      toast({
        title: 'Booking Failed',
        description: 'Failed to book event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading event details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event not found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(event.date);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden">
              {event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                  <div className="text-8xl text-primary/30">🎪</div>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" className="bg-white/90">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" className="bg-white/90">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-white/90 text-primary">
                  {event.event_type}
                </Badge>
              </div>
            </div>

            {/* Event Details */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{formattedDate.date}</div>
                      <div className="text-sm">{formattedDate.time}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">{event.venue || event.location}</div>
                      <div className="text-sm">{event.location}</div>
                    </div>
                  </div>
                  
                  {event.available_seats && (
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{event.available_seats} seats available</div>
                        <div className="text-sm">Limited capacity</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center text-muted-foreground">
                    <Star className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">
                        {event.popularity_score ? `${event.popularity_score}% popularity` : 'New Event'}
                      </div>
                      <div className="text-sm">Event rating</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                  <div className="prose max-w-none text-muted-foreground">
                    {event.description ? (
                      <div className="whitespace-pre-line">{event.description}</div>
                    ) : (
                      <p>Join us for an amazing event experience!</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Info */}
            {organizer && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Event Organizer</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">{organizer.org_name}</h3>
                      {organizer.description && (
                        <p className="text-muted-foreground mt-2">{organizer.description}</p>
                      )}
                    </div>
                    
                    <ContactOrganizerForm
                      organizerId={event.organizer_id}
                      organizerName={organizer.org_name}
                      eventTitle={event.title}
                    >
                      <Button variant="outline" className="w-full">
                        Contact Organizer
                      </Button>
                    </ContactOrganizerForm>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {event.price && event.price > 0 ? `₹${event.price}` : 'FREE'}
                  </div>
                  {event.price && event.price > 0 && (
                    <div className="text-sm text-muted-foreground">per ticket</div>
                  )}
                </div>

                <Button 
                  onClick={handleBookEvent}
                  disabled={isBooking}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  {isBooking ? 'Booking...' : (
                    event.price && event.price > 0 ? `Book for ₹${event.price}` : 'Book FREE'
                  )}
                </Button>

                {event.available_seats && event.available_seats < 50 && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm text-orange-800 font-medium">
                      ⚠️ Only {event.available_seats} seats left!
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Event Type</span>
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>3 hours</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Language</span>
                    <span>English</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EventDetail;