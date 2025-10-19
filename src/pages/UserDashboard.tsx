// src/pages/UserDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useEvents from '../hooks/useEvents';
import useBookings from '../hooks/useBookings';
import useProfile from '../hooks/useProfile';
import EventGrid from '../components/EventGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';
import { Calendar, Ticket, User, Bell } from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('events');

  // Hooks that fetch data from your backend
  const { events, loading: eventsLoading, fetchEvents, bookEvent } = useEvents();
  const { bookings, loading: bookingsLoading, refetch: refetchBookings } = useBookings();
  const { profile, loading: profileLoading } = useProfile();

  useEffect(() => {
    // Refresh data when user becomes available
    if (user) {
      fetchEvents();
      // useBookings and useProfile will auto-fetch using user from useAuth
    }
  }, [user]);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Discover and manage your bookings</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 mb-8">
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                My Bookings
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Events tab: use your EventGrid component */}
            <TabsContent value="events" className="space-y-6">
              {eventsLoading ? (
                <div className="text-center py-8">Loading events…</div>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
                    <p className="text-muted-foreground mb-4">Check back later or try a different filter.</p>
                    <Button onClick={() => fetchEvents()}>Refresh</Button>
                  </CardContent>
                </Card>
              ) : (
                <EventGrid 
    events={events} 
    onBookEvent={bookEvent} // <--- FIX: Pass the required handler function
    loading={eventsLoading} 
/>
              )}
            </TabsContent>

            {/* Bookings tab */}
            <TabsContent value="bookings" className="space-y-6">
              {bookingsLoading ? (
                <div className="text-center py-8">Loading bookings…</div>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">Start exploring events and book tickets.</p>
                    <Button onClick={() => setActiveTab('events')}>Browse Events</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{b.event.title}</div>
                          <div className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Status: {b.status}</div>
                          <Button variant="ghost" size="sm" onClick={() => refetchBookings()}>
                            Refresh
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Profile tab */}
            <TabsContent value="profile" className="space-y-6">
              {profileLoading ? (
                <div className="text-center py-8">Loading profile…</div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-muted-foreground">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Display name</label>
                        <p className="text-muted-foreground">{profile?.display_name ?? '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <p className="text-muted-foreground">User</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Notifications tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">No notifications</h3>
                    <p className="text-muted-foreground">You'll see notifications about your bookings and events here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
