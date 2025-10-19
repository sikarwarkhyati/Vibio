import React, { useEffect, useState } from 'react';
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
import { Button } from '../components/ui/button';
import { Filter, Clock } from 'lucide-react';
import Footer from '../components/Footer';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { events, loading: eventsLoading, fetchEvents, bookEvent } = useEvents();
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const { trackEventSearch } = useAnalytics();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSearch = (query: string, category: string, location: string) => {
    setSearchQuery(query);
    setActiveTab(category);
    setLocationFilter(location);
    
    const filters = {
      search: query,
      category: category === 'all' ? undefined : category,
      location: location || undefined,
      dateFilter: dateFilter === 'all' ? undefined : dateFilter as any,
    };
    
    fetchEvents(filters);
    
    // Track search analytics
    if (query) {
      trackEventSearch(query, events.length, { category, location, dateFilter });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchEvents({
      search: searchQuery || undefined,
      category: value === 'all' ? undefined : value,
      location: locationFilter || undefined,
      dateFilter: dateFilter === 'all' ? undefined : dateFilter as any,
    });
  };

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
    fetchEvents({
      search: searchQuery || undefined,
      category: activeTab === 'all' ? undefined : activeTab,
      location: locationFilter || undefined,
      dateFilter: filter === 'all' ? undefined : filter as any,
    });
  };

  const getActiveFilters = () => {
    const filters = [];
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
    fetchEvents();
  };

  const handleBookEvent = (eventId: string) => {
    bookEvent(eventId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={(query) => handleSearch(query, activeTab, '')} />
      
      {/* Hero Section with Search */}
      <HeroSearchBar onSearch={handleSearch} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Trending Events Carousel */}
        <TrendingEvents onBookEvent={handleBookEvent} />
        
        {/* Upcoming Events Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary-glow rounded-full"></div>
          </div>
          
          {/* Enhanced Filters */}
          <EventFilters
            dateFilter={dateFilter}
            onDateFilterChange={handleDateFilterChange}
            activeFilters={getActiveFilters()}
            onClearFilters={clearFilters}
          />
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="concerts">Concerts</TabsTrigger>
              <TabsTrigger value="tech">Tech</TabsTrigger>
              <TabsTrigger value="sports">Sports</TabsTrigger>
              <TabsTrigger value="workshops">Workshops</TabsTrigger>
              <TabsTrigger value="festivals">Festivals</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-8">
              <EventGrid 
                events={events} 
                onBookEvent={handleBookEvent}
                loading={eventsLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 mb-8">
          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-xl">
            <div className="text-3xl font-bold text-primary mb-2">
              {events.length}+
            </div>
            <div className="text-muted-foreground">Events Available</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-xl">
            <div className="text-3xl font-bold text-primary mb-2">50K+</div>
            <div className="text-muted-foreground">Happy Customers</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-xl">
            <div className="text-3xl font-bold text-primary mb-2">100+</div>
            <div className="text-muted-foreground">Cities Covered</div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Explore Events Near You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
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
