import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroSearchBar from '../components/HeroSearchBar';
import EventGrid from '../components/EventGrid';
import TrendingEvents from '../components/TrendingEvents';
import EventFilters from '../components/EventFilters';
import EventsMap from '../components/EventsMap';
import { useEvents } from '../hooks/useEvents';
import { useAnalytics } from '../hooks/useAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import Footer from '../components/Footer';
import { useToast } from '../hooks/use-toast';
import { SearchParams } from '../components/SearchBar';
import { Clock } from 'lucide-react';

type FrontendEvent = {
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
};

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { events, loading: eventsLoading, fetchEvents, bookEvent } = useEvents();
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  // keep filteredEvents as an empty array by default to avoid nullable state
  const [filteredEvents, setFilteredEvents] = useState<FrontendEvent[]>([]);
  const [searchMeta, setSearchMeta] = useState<{ count: number; params: SearchParams } | null>(null);
  const { trackEventSearch } = useAnalytics();
  const { toast } = useToast();

  // normalizeEvents: always returns a non-null array of FrontendEvent
  const normalizeEvents = (items: unknown[]): FrontendEvent[] => {
    if (!Array.isArray(items)) return [];

    return items.reduce<FrontendEvent[]>((acc, raw) => {
      const event = raw as Record<string, unknown>;
      const identifier = (event.id as string | undefined) ?? (event._id as string | undefined);
      if (!identifier) return acc;

      const urlFromImages =
        (event["image_url"] as string | undefined) ??
        (Array.isArray(event["images"]) ? (event["images"][0] as string | undefined) : undefined);

      acc.push({
        id: String(identifier),
        title: (event.title as string) ?? "Untitled Event",
        description: (event.description as string) ?? undefined,
        date: (event.date as string) ?? new Date().toISOString(),
        location: (event.location as string) ?? (event.venue as string) ?? "To be announced",
        event_type: (event.event_type as string) ?? (event.category as string) ?? "general",
        image_url: urlFromImages,
        available_seats:
          (typeof event["available_seats"] === "number"
            ? (event["available_seats"] as number)
            : typeof event["availableSeats"] === "number"
            ? (event["availableSeats"] as number)
            : undefined) ?? undefined,
        price: typeof event.price === "number" ? (event.price as number) : undefined,
        venue: event.venue as string | undefined,
      });

      return acc;
    }, []);
  };

  // Move memoizations / derived hooks **before** early returns so hook order stays stable
  const baseEvents = useMemo<FrontendEvent[]>(
    () => normalizeEvents((events as unknown[]) ?? []),
    [events]
  );
  const hasActiveFilters = searchMeta !== null;
  const displayEvents = hasActiveFilters ? filteredEvents : baseEvents;

  const resultHeadline = useMemo(() => {
    if (!searchMeta) return null;
    const { count, params } = searchMeta;
    const appliedFilters = [params.q, params.category, params.location].filter(Boolean);
    if (appliedFilters.length === 0) return null;
    return `Showing ${count} result${count === 1 ? '' : 's'} for your search`;
  }, [searchMeta]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSearchResults = (results: unknown[], params: SearchParams) => {
    const normalized = normalizeEvents(results);
    setFilteredEvents(normalized);
    setActiveTab(params.category && params.category !== '' ? params.category : 'all');
    setLocationFilter(params.location ?? '');
    setSearchQuery(params.q ?? '');
    setSearchMeta({ count: normalized.length, params });

    if (params.q || params.category || params.location) {
      trackEventSearch(params.q ?? '', normalized.length, {
        category: params.category,
        location: params.location,
        dateFilter,
      });

      toast({
        title: `Showing ${normalized.length} result${normalized.length === 1 ? '' : 's'}`,
        description: normalized.length
          ? 'Refine filters to discover even more experiences.'
          : 'Try adjusting your search keywords or filters.',
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFilteredEvents([]);
    setSearchMeta(null);
    fetchEvents({
      search: searchQuery || undefined,
      category: value === 'all' ? undefined : value,
      location: locationFilter || undefined,
      dateFilter: dateFilter === 'all' ? undefined : (dateFilter as any),
    });
  };

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
    setFilteredEvents([]);
    setSearchMeta(null);
    fetchEvents({
      search: searchQuery || undefined,
      category: activeTab === 'all' ? undefined : activeTab,
      location: locationFilter || undefined,
      dateFilter: filter === 'all' ? undefined : (filter as any),
    });
  };

  const getActiveFilters = () => {
    const filters: string[] = [];
    if (searchQuery) filters.push(`Search: "${searchQuery}"`);
    if (activeTab !== 'all') filters.push(`Category: ${activeTab}`);
    if (locationFilter) filters.push(`Location: ${locationFilter}`);
    if (dateFilter !== 'all') filters.push(`Date: ${dateFilter.replace('-', ' ')}`);
    return filters;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setLocationFilter('');
    setDateFilter('all');
    setFilteredEvents([]);
    setSearchMeta(null);
    fetchEvents();
  };

  const handleBookEvent = (eventId: string) => {
    bookEvent(eventId);
  };

  // EARLY RETURNS (now safe because hooks/memos are above)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchResults={handleSearchResults} />

      <HeroSearchBar onResults={handleSearchResults} />

      <main className="container mx-auto px-4 py-8">
        <TrendingEvents onBookEvent={handleBookEvent} />

        <div className="mb-8">
          <div className="mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-primary to-primary-600"></div>
          </div>

          {resultHeadline && (
            <div className="mb-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              {resultHeadline}
            </div>
          )}

          <EventFilters
            dateFilter={dateFilter}
            onDateFilterChange={handleDateFilterChange}
            activeFilters={getActiveFilters()}
            onClearFilters={clearFilters}
          />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="concert">Concerts</TabsTrigger>
              <TabsTrigger value="tech">Tech</TabsTrigger>
              <TabsTrigger value="sports">Sports</TabsTrigger>
              <TabsTrigger value="workshop">Workshops</TabsTrigger>
              <TabsTrigger value="festival">Festivals</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-8">
              <EventGrid events={displayEvents} onBookEvent={handleBookEvent} loading={eventsLoading} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-16 mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary-600/10 p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-primary">{displayEvents.length}+</div>
            <div className="text-muted-foreground">Events Available</div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary-600/10 p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-primary">50K+</div>
            <div className="text-muted-foreground">Happy Customers</div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary-600/10 p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-primary">100+</div>
            <div className="text-muted-foreground">Cities Covered</div>
          </div>
        </div>

        <div className="mt-16 mb-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold">Explore Events Near You</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Discover events happening around your location with our interactive map
            </p>
          </div>
          <EventsMap />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
