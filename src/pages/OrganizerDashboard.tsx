import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import CreateEventForm from '@/components/CreateEventForm';
import MyEventsGrid from '@/components/MyEventsGrid';
import QRTicketScanner from '@/components/QRTicketScanner';
import OrganizerAnalyticsDashboard from '@/components/OrganizerAnalyticsDashboard';
import VendorMarketplace from '@/components/VendorMarketplace';
import SponsorshipRequests from '@/components/SponsorshipRequests';
import { Plus, BarChart3, Calendar, Users, QrCode, Building, DollarSign } from 'lucide-react';

const OrganizerDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                My Events
              </TabsTrigger>
              <TabsTrigger value="vendors" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Vendors
              </TabsTrigger>
              <TabsTrigger value="sponsors" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Sponsors
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
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      +0% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground">
                      +0% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$0</div>
                    <p className="text-xs text-muted-foreground">
                      +0% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0.0</div>
                    <p className="text-xs text-muted-foreground">
                      Based on 0 reviews
                    </p>
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
                    <h3 className="text-lg font-medium mb-2">No events yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by creating your first event to begin managing bookings and tracking performance.
                    </p>
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <MyEventsGrid onCreateEvent={() => setShowCreateForm(true)} />
            </TabsContent>

            <TabsContent value="vendors">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Marketplace</CardTitle>
                  <p className="text-muted-foreground">Find and request services from vendors for your events</p>
                </CardHeader>
                <CardContent>
                  <VendorMarketplace />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sponsors">
              <Card>
                <CardHeader>
                  <CardTitle>Sponsorship Opportunities</CardTitle>
                  <p className="text-muted-foreground">Connect with sponsors to fund your events</p>
                </CardHeader>
                <CardContent>
                  <SponsorshipRequests />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <OrganizerAnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create Event Modal/Form */}
      {showCreateForm && (
        <CreateEventForm 
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRTicketScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;