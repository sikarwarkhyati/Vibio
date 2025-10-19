// src/components/EventsMap.tsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Settings } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';

interface Event {
  id: string;
  _id: string;
  title: string;
  event_type: string;
  location: string;
  venue?: string;
  date: string;
  price?: number;
  coordinates?: [number, number];
}

interface EventsMapProps {
  className?: string;
}

const EventsMap: React.FC<EventsMapProps> = ({ className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState(import.meta.env.VITE_MAPBOX_TOKEN || '');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // City coordinates
  const cityCoordinates: { [key: string]: [number, number] } = {
    'San Francisco': [-122.4194, 37.7749],
    'Austin': [-97.7431, 30.2672],
    'New York': [-74.006, 40.7128],
    'Los Angeles': [-118.2437, 34.0522],
    'Boston': [-71.0589, 42.3601],
    'Napa Valley': [-122.2654, 38.2975],
    'Mumbai': [72.8777, 19.076],
    'Delhi': [77.1025, 28.7041],
    'Bangalore': [77.5946, 12.9716],
    'Chennai': [80.2707, 13.0827],
    'Hyderabad': [78.4867, 17.385],
    'Pune': [73.8567, 18.5204],
  };

  // Event type colors
  const eventColors: { [key: string]: string } = {
    tech: '#3B82F6',
    concerts: '#EF4444',
    sports: '#10B981',
    workshops: '#F59E0B',
    festivals: '#8B5CF6',
  };

  // Helper to estimate coordinates
  const getCoordinatesForLocation = (location: string): [number, number] => {
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return coords;
      }
    }
    return cityCoordinates['San Francisco'];
  };

  // Fetch nearby events from backend
  const fetchNearbyEvents = async (lat?: number, lng?: number, days: number = 7) => {
    try {
      setLoading(true);
      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      const res = await api.get('/events', {
        params: { minDate: now.toISOString(), maxDate: endDate, limit: 50 },
      });

      const eventsData = res.data.events || res.data || [];

      if (eventsData.length === 0) {
        const dummyEvents: Event[] = [
          { id: 'map-event-1', title: 'Tech Innovation Summit', event_type: 'tech', location: 'San Francisco, CA', venue: 'Moscone Center', date: new Date(Date.now() + 7 * 86400000).toISOString(), price: 299, coordinates: cityCoordinates['San Francisco'], _id: 'map-event-1' },
          { id: 'map-event-2', title: 'Music Festival', event_type: 'festivals', location: 'Austin, TX', venue: 'Zilker Park', date: new Date(Date.now() + 14 * 86400000).toISOString(), price: 199, coordinates: cityCoordinates['Austin'], _id: 'map-event-2' },
          { id: 'map-event-3', title: 'Digital Marketing Workshop', event_type: 'workshops', location: 'New York, NY', venue: 'WeWork Times Square', date: new Date(Date.now() + 3 * 86400000).toISOString(), price: 149, coordinates: cityCoordinates['New York'], _id: 'map-event-3' },
          { id: 'map-event-4', title: 'Basketball Championship', event_type: 'sports', location: 'Los Angeles, CA', venue: 'Staples Center', date: new Date(Date.now() + 21 * 86400000).toISOString(), price: 250, coordinates: cityCoordinates['Los Angeles'], _id: 'map-event-4' },
          { id: 'map-event-5', title: 'Classical Concert', event_type: 'concerts', location: 'Boston, MA', venue: 'Symphony Hall', date: new Date(Date.now() + 10 * 86400000).toISOString(), price: 89, coordinates: cityCoordinates['Boston'], _id: 'map-event-5' },
        ];
        setEvents(dummyEvents);
      } else {
        const eventsWithCoordinates = eventsData.map((event: any) => ({
          ...event,
          id: event._id || event.id,
          coordinates: getCoordinatesForLocation(event.location),
        })) as Event[];
        setEvents(eventsWithCoordinates);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      toast({
        title: 'Error',
        description: (err as any).response?.data?.message || 'Failed to fetch nearby events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize map and add markers directly inside load event
  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      projection: 'mercator',
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers when the map is loaded
    map.current.on('load', () => {
      if (events.length > 0) addEventMarkers();
    });
  };

  const addEventMarkers = () => {
    if (!map.current || events.length === 0) return;

    const existingMarkers = document.querySelectorAll('.event-marker');
    existingMarkers.forEach(marker => marker.remove());

    events.forEach(event => {
      if (!event.coordinates) return;

      const markerElement = document.createElement('div');
      markerElement.className = 'event-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${eventColors[event.event_type] || '#6B7280'};
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: transform 0.2s;
      `;

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-semibold text-sm mb-1">${event.title}</h3>
          <p class="text-xs text-gray-600 mb-2">${event.venue || event.location}</p>
          <p class="text-xs text-gray-500 mb-2">${new Date(event.date).toLocaleDateString()}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs bg-gray-100 px-2 py-1 rounded">${event.event_type}</span>
            <span class="text-sm font-semibold">${event.price ? `₹${event.price}` : 'FREE'}</span>
          </div>
          <button 
            onclick="window.open('/event/${event.id}', '_blank')" 
            class="w-full mt-2 bg-blue-500 text-white text-xs py-1 px-2 rounded hover:bg-blue-600"
          >
            View Details
          </button>
        </div>
      `);

      new mapboxgl.Marker(markerElement)
        .setLngLat(event.coordinates!)
        .setPopup(popup)
        .addTo(map.current!);
    });
  };

  useEffect(() => {
    if (mapboxToken) fetchNearbyEvents();
  }, [mapboxToken]);

  useEffect(() => {
    if (mapboxToken && mapContainer.current) initializeMap(mapboxToken);
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current && events.length > 0) addEventMarkers();
  }, [events]);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken);
      fetchNearbyEvents();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Nearby Events Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!mapboxToken ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your Mapbox public token to view events on the map. Get your token from{' '}
              <a
                href="https://mapbox.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter Mapbox public token..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTokenSubmit}>
                <Settings className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {loading ? 'Loading events...' : `${events.length} events found`}
              </div>
              <div className="flex gap-2 text-xs">
                {Object.entries(eventColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={mapContainer}
              className="w-full h-96 rounded-lg shadow-sm"
              style={{ minHeight: '400px' }}
            />

            <div className="mt-4 text-xs text-muted-foreground">
              Click on markers to see event details. Different colors represent different event types.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsMap;
