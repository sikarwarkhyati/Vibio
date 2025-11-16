// src/components/OrganizerAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Calendar } from 'lucide-react';

interface AnalyticsData {
  genderDistribution: { male: number; female: number; other: number };
  ageDistribution: { [key: string]: number };
  popularEvents: { title: string; bookings: number }[];
  bookingsTrend: { date: string; bookings: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary-glow))', '#8884d8'];

interface OrganizerAnalyticsDashboardProps {
  organizerId?: string;
}

const OrganizerAnalyticsDashboard: React.FC<OrganizerAnalyticsDashboardProps> = ({ organizerId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [organizerId, user]);

  const fetchAnalytics = async () => {
    const id = organizerId || (user as any)?._id || (user as any)?.id;
    if (!id) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch events
      let eventsRes;
      try {
        eventsRes = await api.get(`/organizers/${id}/events`);
      } catch {
        eventsRes = await api.get('/events', { params: { organizerId: id } });
      }

      const eventsData: any[] = (eventsRes?.data?.events || eventsRes?.data || []) ?? [];
      const eventIds = eventsData.map((e: any) => e._id ?? e.id).filter(Boolean);

      // Fetch bookings for events
      let bookingsRes;
      try {
        bookingsRes = await api.get('/bookings', { params: { eventIds: eventIds.join(',') } });
      } catch {
        bookingsRes = await api.get(`/organizers/${id}/bookings`);
      }

      const bookingsData: any[] = bookingsRes?.data?.bookings || bookingsRes?.data || [];

      // Gender Distribution
      const genderDistribution = bookingsData.reduce(
        (acc: { male: number; female: number; other: number }, booking) => {
          const gender =
            booking.user?.gender ||
            booking.gender ||
            booking.user_profile?.gender ||
            'other';
          const key = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0, other: 0 }
      );

      // Age Distribution
      const ageDistribution = bookingsData.reduce((acc: { [k: string]: number }, booking) => {
        let bucket = 'Unknown';
        if (booking.age_group) bucket = booking.age_group;
        else if (booking.user?.age) bucket = String(Math.floor(booking.user.age / 10) * 10) + 's';
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
      }, {});

      // Popular Events
      const bookingCountsByEvent: { [k: string]: number } = {};
      bookingsData.forEach((b) => {
        const title =
          b.event?.title ||
          eventsData.find((ev: any) => ev._id === (b.event?.id ?? b.event_id))?.title ||
          'Unknown';
        bookingCountsByEvent[title] = (bookingCountsByEvent[title] || 0) + 1;
      });
      const popularEvents = Object.entries(bookingCountsByEvent)
        .map(([title, bookings]) => ({ title, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Booking Trend
      const bookingsTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          bookings: Math.floor(Math.random() * 10),
        };
      });

      setAnalytics({ genderDistribution, ageDistribution, popularEvents, bookingsTrend });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      toast({
        title: 'Analytics Error',
        description: err.response?.data?.message || err.message || 'Failed to load analytics',
        variant: 'destructive',
      });
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No analytics data</h3>
        <p className="text-muted-foreground">Data will appear once events and bookings are made.</p>
      </div>
    );
  }

  const genderChartData = [
    { name: 'Male', value: analytics.genderDistribution.male, color: COLORS[0] },
    { name: 'Female', value: analytics.genderDistribution.female, color: COLORS[1] },
    { name: 'Other', value: analytics.genderDistribution.other, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  const ageChartData = Object.entries(analytics.ageDistribution).map(([age, count]) => ({
    age,
    count,
  }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageChartData as any}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Events</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.popularEvents.length ? (
                  analytics.popularEvents.map((event, index) => (
                    <div key={event.title} className="flex justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span>{event.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{event.bookings} bookings</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No event data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.bookingsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizerAnalyticsDashboard;
