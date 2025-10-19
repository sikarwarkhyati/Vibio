// src/components/admin/AdminAnalytics.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { DollarSign, Users, Calendar, TrendingUp, UserCheck } from 'lucide-react';

interface AnalyticsPayload {
  monthlyRevenue: { month: string; revenue: number }[];
  bookingsTrend: { date: string; bookings: number }[];
  topEvents: { title: string; bookings: number }[];
}

const COLORS = ['#1f2937', '#0ea5a4', '#7c3aed', '#f97316', '#ef4444'];

const AdminAnalytics: React.FC<{ stats?: any }> = ({ stats }) => {
  const [data, setData] = useState<AnalyticsPayload>({
    monthlyRevenue: [],
    bookingsTrend: [],
    topEvents: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      const payload = res.data ?? {};

      setData({
        monthlyRevenue: payload.monthlyRevenue ?? payload.monthly_revenue ?? [],
        bookingsTrend: payload.bookingsTrend ?? payload.bookings_trend ?? [],
        topEvents: payload.topEvents ?? payload.top_events ?? [],
      });
    } catch (err: any) {
      console.error('AdminAnalytics error', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && data.monthlyRevenue.length === 0 && data.bookingsTrend.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue (recent months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bookings Trend (recent)</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bookingsTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEvents && data.topEvents.length ? (
                data.topEvents.map((e, i) => (
                  <div key={`${e.title}-${i}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-6 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="truncate">{e.title}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{e.bookings}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No event data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
