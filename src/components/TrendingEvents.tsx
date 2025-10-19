import React, { useEffect, useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import EventCard from './EventCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { TrendingUp } from 'lucide-react';

interface TrendingEventsProps {
  onBookEvent: (eventId: string) => void;
}

const TrendingEvents: React.FC<TrendingEventsProps> = ({ onBookEvent }) => {
  const { events, loading, fetchEvents } = useEvents();
  const [trendingEvents, setTrendingEvents] = useState<any[]>([]);

  useEffect(() => {
    // Fetch events sorted by popularity
    fetchEvents({ sortBy: 'popularity' });
  }, []);

  useEffect(() => {
    // Get top 8 trending events
    setTrendingEvents(events.slice(0, 8));
  }, [events]);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Events</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg animate-pulse">
              <div className="h-48 bg-muted"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trendingEvents.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Trending Events</h2>
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary-glow rounded-full"></div>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {trendingEvents.map((event) => (
            <CarouselItem key={event.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <EventCard
                id={event.id}
                title={event.title}
                description={event.description}
                date={event.date}
                location={event.location}
                eventType={event.event_type}
                imageUrl={event.image_url}
                availableSeats={event.available_seats}
                price={event.price}
                venue={event.venue}
                onBookNow={onBookEvent}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};

export default TrendingEvents;