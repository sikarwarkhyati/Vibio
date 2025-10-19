// src/pages/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../lib/api';
import { useToast } from '../hooks/use-toast';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminRealtimePanel from '../components/admin/AdminRealtimePanel';
import AdminUsersTable from '../components/admin/AdminUsersTable';
import AdminEventsOverview from '../components/admin/AdminEventsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

type AdminStats = {
  totalUsers: number;
  activeUsersLast5Min: number;
  totalEvents: number;
  totalBookings: number;
  revenue: number;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      // backend may return object at res.data or nested under res.data.stats
      const payload = res.data?.stats ?? res.data ?? null;
      if (payload) {
        setStats({
          totalUsers: payload.totalUsers ?? payload.total_users ?? 0,
          activeUsersLast5Min: payload.activeUsersLast5Min ?? payload.active_users_last_5_min ?? 0,
          totalEvents: payload.totalEvents ?? payload.total_events ?? 0,
          totalBookings: payload.totalBookings ?? payload.total_bookings ?? 0,
          revenue: payload.revenue ?? payload.totalRevenue ?? 0,
        });
      } else {
        setStats(null);
      }
    } catch (err: any) {
      console.error('Failed to load admin stats', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to load stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview & management tools</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchStats} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.totalUsers : '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active (last 5m)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.activeUsersLast5Min : '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.totalEvents : '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.totalBookings : '—'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats ? stats.revenue : '—'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Analytics */}
          <div className="lg:col-span-2">
            {/** If AdminAnalytics component exists, pass what it needs. Otherwise render fallback. */}
            {AdminAnalytics ? (
              <AdminAnalytics stats={stats} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Analytics component not available.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Realtime + quick actions */}
          <div className="space-y-6">
            {AdminRealtimePanel ? (
              <AdminRealtimePanel />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Realtime</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Realtime panel not available.</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={() => window.open('/admin/events', '_self')}>Manage Events</Button>
                  <Button onClick={() => window.open('/admin/users', '_self')}>Manage Users</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Users table & Events overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {AdminUsersTable ? (
            <AdminUsersTable />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Users table not available.</p>
              </CardContent>
            </Card>
          )}

          {AdminEventsOverview ? (
            <AdminEventsOverview />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Events Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Events overview not available.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
