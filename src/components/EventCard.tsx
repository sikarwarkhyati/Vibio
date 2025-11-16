// src/components/EventCard.tsx
import React, { useEffect } from 'react';
import { MapPin, Users, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter } from './ui/card';
import { useAnalytics } from '../hooks/useAnalytics';
import { useNavigate } from 'react-router-dom';
import ContactOrganizerForm from './ContactOrganizerForm';

interface EventCardProps {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  eventType: string;
  imageUrl?: string;
  availableSeats?: number;
  price?: number;
  venue?: string;
  organizerId?: string;
  onBookNow: (eventId: string) => void;
}

const FALLBACK_IMAGE_SRC = '/placeholder.svg';

const EventCard: React.FC<EventCardProps> = ({
  id,
  title,
  description,
  date,
  location,
  eventType,
  imageUrl,
  availableSeats,
  price = 0,
  venue,
  organizerId,
  onBookNow,
}) => {
  const { trackEventView, trackEventBooking } = useAnalytics();
  const navigate = useNavigate();

  useEffect(() => {
    trackEventView(id);
  }, [id, trackEventView]);

  const handleBooking = () => {
    trackEventBooking(id, {
      eventTitle: title,
      eventType,
      price,
      venue: venue || location,
    });
    onBookNow(id);
  };

  const formatDateParts = (dateString: string) => {
    const d = new Date(dateString);
    return {
      day: d.getDate().toString().padStart(2, '0'),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      time: d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const formatted = formatDateParts(date);

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border-0 shadow-lg cursor-pointer">
      <div
        className="relative overflow-hidden"
        onClick={() => navigate(`/event/${id}`)}
      >
        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              onError={(event) => {
                const target = event.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = '1';
                  target.src = FALLBACK_IMAGE_SRC;
                }
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-6xl text-primary/30">🎪</div>
          )}
        </div>

        <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md">
          <div className="text-2xl font-bold text-primary">{formatted.day}</div>
          <div className="text-sm text-muted-foreground uppercase">
            {formatted.month}
          </div>
        </div>

        <div className="absolute top-4 right-4">
          <Badge
            variant="secondary"
            className="bg-white/90 text-primary capitalize"
          >
            {eventType}
          </Badge>
        </div>

        {availableSeats !== undefined && availableSeats < 50 && (
          <div className="absolute bottom-4 right-4">
            <Badge variant="destructive" className="bg-orange-500">
              {availableSeats} seats left
            </Badge>
          </div>
        )}
      </div>

      <CardContent
        className="p-6"
        onClick={() => navigate(`/event/${id}`)}
      >
        <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            {formatted.time}
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            {venue || location}
          </div>

          {availableSeats !== undefined && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-2 text-primary" />
              {availableSeats} seats available
            </div>
          )}

          {/* Contact Organizer button: stop click bubbling so it doesn't navigate */}
          <div
            className="mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ContactOrganizerForm
              organizerId={organizerId || id}
              organizerName="Event Organizer"
              eventTitle={title}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="text-2xl font-bold text-primary">
            {price > 0 ? `₹${price}` : 'FREE'}
          </div>
          {price > 0 && (
            <div className="text-sm text-muted-foreground">per ticket</div>
          )}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleBooking();
          }}
          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
          size="lg"
        >
          {price > 0 ? `Book for ₹${price}` : 'Book FREE'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
