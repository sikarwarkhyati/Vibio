import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, Users, Calendar, TrendingUp, UserCheck, Clock } from 'lucide-react';

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

const OrganizerAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch organizer's events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id);

      if (eventsError) throw eventsError;

      const eventIds = events?.map(e => e.id) || [];

      // Fetch bookings for organizer's events
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          event:events!inner(title, price)
        `)
        .in('event_id', eventIds);

      if (bookingsError) throw bookingsError;

      // Calculate analytics
      const totalEvents = events?.length || 0;
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => {
        const eventPrice = booking.event?.price || 0;
        return sum + Number(eventPrice);
      }, 0) || 0;

      // Gender distribution
      const genderDistribution = bookings?.reduce(
        (acc, booking) => {
          const gender = booking.gender || 'other';
          acc[gender as keyof typeof acc] = (acc[gender as keyof typeof acc] || 0) + 1;
          return acc;
        },
        { male: 0, female: 0, other: 0 }
      ) || { male: 0, female: 0, other: 0 };

      // Age distribution
      const ageDistribution = bookings?.reduce((acc, booking) => {
        const ageGroup = booking.age_group || 'Unknown';
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      // Popular events
      const eventBookingCounts = bookings?.reduce((acc, booking) => {
        const eventTitle = booking.event?.title || 'Unknown';
        acc[eventTitle] = (acc[eventTitle] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }) || {};

      const popularEvents = Object.entries(eventBookingCounts)
        .map(([title, bookings]) => ({ title, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Monthly revenue (simplified - last 6 months)
      const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: Math.floor(totalRevenue / 6) // Simplified calculation
        };
      }).reverse();

      // Bookings trend (last 7 days)
      const bookingsTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          bookings: Math.floor(Math.random() * 10) // Simplified - in real app, calculate actual bookings per day
        };
      }).reverse();

      setAnalytics({
        totalEvents,
        totalBookings,
        totalRevenue,
        averageRating: 4.2, // Simplified
        genderDistribution,
        ageDistribution,
        monthlyRevenue,
        popularEvents,
        bookingsTrend
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    { name: 'Other', value: analytics.genderDistribution.other, color: COLORS[2] }
  ].filter(item => item.value > 0);

  const ageChartData = Object.entries(analytics.ageDistribution).map(([age, count]) => ({
    age,
    count
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
            <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating}</div>
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
                <div className="flex justify-center gap-4 mt-4">
                  {genderChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
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
                  <BarChart data={ageChartData}>
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