// src/pages/OrganizerDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';
import CreateEventForm from '../components/CreateEventForm';
import MyEventsGrid from '../components/MyEventsGrid';
import QRTicketScanner from '../components/QRTicketScanner';
import OrganizerAnalyticsDashboard from '../components/OrganizerAnalyticsDashboard';
import { Plus, BarChart3, Calendar, Users, QrCode } from 'lucide-react';

type EventSummary = {
  id: string;
  title: string;
  date: string;
  venue?: string;
  available_seats?: number;
  price?: number;
  attendeesCount?: number;
};

type OrgStats = {
  totalEvents: number;
  totalBookings: number;
  revenue: number;
  avgRating: number;
};

const OrganizerDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(true);

  const [stats, setStats] = useState<OrgStats>({
    totalEvents: 0,
    totalBookings: 0,
    revenue: 0,
    avgRating: 0,
  });
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Basic role check — allow access only to organisers (accept both spellings)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user) {
      // If your user object stores role in a different place (e.g. user.role or profile.role),
      // adjust the checks below accordingly. We accept both 'organizer' and 'organiser'.
      const role = (user as any).role || (user as any).user_role || (user as any).roleName;
      const isOrganizer = role === 'organizer' || role === 'organiser' || (user as any)?.isOrganizer;
      if (!isOrganizer) {
        // If the user is not an organizer, redirect to user dashboard (or show forbidden)
        navigate('/user-dashboard');
      }
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrganiserEvents();
      fetchOrganizerStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrganiserEvents = async () => {
    if (!user) return;
    setEventsLoading(true);
    try {
      const organizerId = (user as any)._id || (user as any).id;
      const res = await api.get('/events', { params: { organizerId } });
      const data = res.data?.events ?? res.data ?? [];

      // Map Mongo _id -> id for frontend consistency
      const mapped: EventSummary[] = (data as any[]).map((e) => ({
        id: e._id ?? e.id,
        title: e.title,
        date: e.date,
        venue: e.venue,
        available_seats: e.available_seats,
        price: e.price,
        attendeesCount: e.attendeesCount ?? e.attendees_count ?? 0,
      }));

      setEvents(mapped);
    } catch (err: any) {
      console.error('fetchOrganiserEvents error', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to fetch events',
        variant: 'destructive',
      });
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchOrganizerStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const organizerId = (user as any)._id || (user as any).id;
      let res = await api.get(`/organizers/${organizerId}/stats`).catch(() =>
        api.get('/organizers/stats', { params: { organizerId } })
      );

      const payload = res.data ?? {};
      setStats({
        totalEvents: payload.totalEvents ?? payload.total_events ?? payload.totalEventsCount ?? (events?.length ?? 0),
        totalBookings: payload.totalBookings ?? payload.total_bookings ?? 0,
        revenue: payload.revenue ?? payload.totalRevenue ?? 0,
        avgRating: payload.avgRating ?? payload.averageRating ?? payload.avg_rating ?? 0,
      });
    } catch (err: any) {
      console.error('fetchOrganizerStats error', err);
      toast({
        title: 'Stats unavailable',
        description: err.response?.data?.message || err.message || 'Failed to fetch organizer stats',
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Compute a safe organizerId string for children that require it
  // (we fall back to an empty string if somehow user is missing, but the page redirects earlier)
  const organizerId = (user as any)?._id ?? (user as any)?.id ?? '';

  // If auth is still loading, show spinner
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Organizer Dashboard</h1>
              <p className="text-muted-foreground">Manage your events and track performance</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQRScanner(true)}
                className="flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Scan Tickets
              </Button>

              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                My Events
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsLoading ? '—' : stats.totalEvents}</div>
                    <p className="text-xs text-muted-foreground">+0% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsLoading ? '—' : stats.totalBookings}</div>
                    <p className="text-xs text-muted-foreground">+0% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{statsLoading ? '—' : stats.revenue}</div>
                    <p className="text-xs text-muted-foreground">+0% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statsLoading ? '—' : stats.avgRating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Based on reviews</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Manage events and bookings</h3>
                    <p className="text-muted-foreground mb-4">Create events, scan tickets, and monitor analytics.</p>
                    <Button onClick={() => setShowCreateForm(true)} className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                      <Plus className="w-4 h-4 mr-2" /> Create Your First Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <MyEventsGrid
                onCreateEvent={() => setShowCreateForm(true)}
                organizerId={organizerId}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <OrganizerAnalyticsDashboard organizerId={organizerId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create Event Modal/Form */}
      {showCreateForm && (
        <CreateEventForm
          open={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            fetchOrganiserEvents(); // refresh after create
            fetchOrganizerStats();
          }}
          organizerId={organizerId}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRTicketScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          eventId={undefined} // you can pass a specific eventId here if scanning for a particular event
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;
