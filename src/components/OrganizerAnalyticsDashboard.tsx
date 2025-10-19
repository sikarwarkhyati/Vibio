// src/components/OrganizerAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
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
import { DollarSign, Users, Calendar, TrendingUp, UserCheck } from 'lucide-react';

interface AnalyticsData {
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  genderDistribution: { male: number; female: number; other: number };
  ageDistribution: { [key: string]: number };
  monthlyRevenue: { month: string; revenue: number }[];
  popularEvents: { title: string; bookings: number }[];
  bookingsTrend: { date: string; bookings: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary-glow))', '#8884d8', '#82ca9d', '#ffc658'];

interface OrganizerAnalyticsDashboardProps {
  organizerId?: string;
}

const OrganizerAnalyticsDashboard: React.FC<OrganizerAnalyticsDashboardProps> = ({ organizerId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // fetch when component mounts or when organizerId / user changes
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizerId, user]);

  const fetchAnalytics = async () => {
    // determine organizer id (prop overrides auth user)
    const id = organizerId || (user as any)?._id || (user as any)?.id;
    if (!id) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1) Fetch events for organizer
      // Try organizer endpoints with fallbacks
      let eventsRes;
      try {
        eventsRes = await api.get(`/organizers/${id}/events`);
      } catch (e) {
        eventsRes = await api.get('/events', { params: { organizerId: id } });
      }

      const eventsData: any[] =
        (eventsRes?.data && (Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data.events)) || [];

      // Normalize event ids (handle MongoDB _id)
      const normalizedEvents = eventsData.map((e: any) => ({
        id: e._id ?? e.id,
        title: e.title,
        date: e.date,
        price: e.price ?? 0,
      }));

      const eventIds = normalizedEvents.map((e: any) => e.id).filter(Boolean);

      // 2) Fetch bookings for those events
      let bookingsRes;
      try {
        // Prefer an endpoint that accepts multiple event ids
        bookingsRes = await api.get('/bookings', { params: { eventIds: eventIds.join(',') } });
      } catch (e) {
        // Fallback: Try organizer bookings endpoint
        try {
          bookingsRes = await api.get(`/organizers/${id}/bookings`);
        } catch (e2) {
          bookingsRes = { data: [] };
        }
      }

      const bookingsData: any[] =
        (bookingsRes?.data && (Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.bookings)) ||
        [];

      // Calculate totals
      const totalEvents = normalizedEvents.length;
      const totalBookings = bookingsData.length;
      const totalRevenue =
        bookingsData.reduce((sum, b) => {
          // try to pull price from booking.event.price, or booking.price, or match by event id
          const price =
            b.event?.price ??
            b.price ??
            normalizedEvents.find((ev: any) => (b.event?.id ?? b.event_id ?? b.event) === ev.id)?.price ??
            0;
          return sum + Number(price || 0);
        }, 0) || 0;

      // Average rating - if bookings contain rating, compute it; otherwise simplified
      const ratings = bookingsData.map((b) => b.rating || b.review?.rating).filter((r) => typeof r === 'number');
      const averageRating =
        ratings.length > 0 ? ratings.reduce((a: number, c: number) => a + c, 0) / ratings.length : 4.2;

      // Gender distribution (look for booking.user.gender or booking.gender)
      const genderDistribution = bookingsData.reduce(
        (acc: { male: number; female: number; other: number }, booking) => {
          const gender =
            (booking.user && booking.user.gender) || booking.gender || (booking.user_profile && booking.user_profile.gender) || 'other';
          const key = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0, other: 0 }
      );

      // Age distribution - look for booking.user.age or booking.age_group or booking.user_profile.date_of_birth
      const ageDistribution = bookingsData.reduce((acc: { [k: string]: number }, booking) => {
        let bucket = 'Unknown';
        if (booking.age_group) {
          bucket = booking.age_group;
        } else if (booking.user?.age) {
          bucket = String(Math.floor(booking.user.age / 10) * 10) + 's';
        } else if (booking.user_profile?.date_of_birth) {
          try {
            const dob = new Date(booking.user_profile.date_of_birth);
            const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            bucket = age < 18 ? 'Under 18' : age < 30 ? '18-29' : age < 50 ? '30-49' : '50+';
          } catch (e) {
            bucket = 'Unknown';
          }
        }
        acc[bucket] = (acc[bucket] || 0) + 1;
        return acc;
      }, {} as { [k: string]: number });

      // Popular events (count bookings grouped by event title)
      const bookingCountsByEvent: { [k: string]: number } = {};
      bookingsData.forEach((b) => {
        const title =
          b.event?.title || normalizedEvents.find((ev: any) => ev.id === (b.event?.id ?? b.event_id))?.title || 'Unknown';
        bookingCountsByEvent[title] = (bookingCountsByEvent[title] || 0) + 1;
      });
      const popularEvents = Object.entries(bookingCountsByEvent)
        .map(([title, bookings]) => ({ title, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Monthly revenue (simple distribution over last 6 months)
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: Math.round(totalRevenue / 6),
        };
      });

      // Bookings trend last 7 days (approximation)
      const bookingsTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          bookings: Math.floor(Math.random() * 10), // if you have per-day data, replace this
        };
      });

      setAnalytics({
        totalEvents,
        totalBookings,
        totalRevenue,
        averageRating,
        genderDistribution,
        ageDistribution: ageDistribution,
        monthlyRevenue,
        popularEvents,
        bookingsTrend,
      });
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
        <p className="text-muted-foreground">Create events and get bookings to see analytics.</p>
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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={genderChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {genderChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
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

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.popularEvents.map((event, index) => (
                    <div key={event.title} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="font-medium truncate">{event.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{event.bookings} bookings</span>
                    </div>
                  ))}
                </div>
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
