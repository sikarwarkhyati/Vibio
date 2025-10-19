// src/components/EventGrid.tsx
import React from 'react';
import EventCard from './EventCard';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  event_type: string;
  image_url?: string;
  available_seats?: number;
  price?: number;
  venue?: string;
}

interface EventGridProps {
  events: Event[];
  onBookEvent: (eventId: string) => void;
  loading?: boolean;
}

const EventGrid: React.FC<EventGridProps> = ({ events, onBookEvent, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-card rounded-lg overflow-hidden shadow-lg animate-pulse">
            <div className="h-48 bg-muted"></div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
              <div className="h-10 bg-muted rounded w-full mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎭</div>
        <h3 className="text-2xl font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or check back later for new events.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
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
      ))}
    </div>
  );
};

export default EventGrid;