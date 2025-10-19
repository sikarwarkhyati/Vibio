import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBookings } from '../hooks/useBookings';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import Navbar from '../components/Navbar';
import TicketQRCode from '../components/TicketQRCode';
import { Calendar, MapPin, Ticket, Clock, DollarSign, QrCode, Download } from 'lucide-react';
import { format } from 'date-fns';

const MyTickets: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { bookings, loading, cancelBooking } = useBookings();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatEventDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatEventTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Tickets</h1>
            <p className="text-muted-foreground">Manage your event bookings and tickets</p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-muted rounded-lg"></div>
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
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-2xl font-semibold mb-2">No tickets yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start exploring events and book your first ticket!
                </p>
                <Button onClick={() => window.location.href = '/'}>
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Event Image */}
                      <div className="w-full md:w-48 h-48 md:h-auto bg-muted flex items-center justify-center">
                        {booking.event.image_url ? (
                          <img 
                            src={booking.event.image_url} 
                            alt={booking.event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-6xl">🎭</div>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">{booking.event.title}</h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                          
                          {/* QR Code Section */}
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center text-sm text-muted-foreground mb-1">
                                <Ticket className="w-4 h-4 mr-1" />
                                Ticket Code
                              </div>
                              <div className="font-mono font-semibold text-lg">
                                {booking.ticket_code}
                              </div>
                            </div>
                            
                            {booking.status === 'confirmed' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                                    <QrCode className="w-4 h-4" />
                                    QR Code
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-sm">
                                  <DialogHeader>
                                    <DialogTitle>Your Ticket QR Code</DialogTitle>
                                  </DialogHeader>
                                  <div className="flex flex-col items-center space-y-4 py-4">
                                    <TicketQRCode
                                      ticketCode={booking.ticket_code}
                                      eventTitle={booking.event.title}
                                      eventDate={booking.event.date}
                                      eventId={booking.event.id}
                                      userId={booking.user_id}
                                      size="lg"
                                    />
                                    <div className="text-center text-sm text-muted-foreground">
                                      Show this QR code at the event entrance for quick check-in
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{formatEventDate(booking.event.date)}</span>
                            <Clock className="w-4 h-4 ml-4 mr-2" />
                            <span>{formatEventTime(booking.event.date)}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{booking.event.venue || booking.event.location}</span>
                          </div>
                          {booking.event.price && (
                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span>${booking.event.price}</span>
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {booking.event.event_type}
                            </Badge>
                          </div>
                        </div>

                        {booking.event.description && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {booking.event.description}
                          </p>
                        )}

                        <Separator className="my-4" />

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Booked on {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                          </div>
                          {booking.status === 'confirmed' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => cancelBooking(booking.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Cancel Booking
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyTickets;