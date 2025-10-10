import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Star, Award } from 'lucide-react';

interface AnalyticsData {
  totalRequests: number;
  acceptedRequests: number;
  completedRequests: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  monthlyRequests: Array<{ month: string; requests: number }>;
  serviceBreakdown: Array<{ service: string; count: number }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const VendorAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRequests: 0,
    acceptedRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlyRequests: [],
    serviceBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, rating, total_reviews')
        .eq('user_id', userData.user.id)
        .single();

      if (!vendorData) return;

      // Get service requests
      const { data: requests } = await supabase
        .from('vendor_requests')
        .select('*')
        .eq('vendor_id', vendorData.id);

      if (requests) {
        const totalRequests = requests.length;
        const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
        const completedRequests = requests.filter(r => r.status === 'completed').length;

        // Mock revenue calculation (in real app, you'd have actual pricing data)
        const totalRevenue = completedRequests * 1500; // Average $1500 per completed service

        // Group requests by month
        const monthlyData = requests.reduce((acc: any, request) => {
          const date = new Date(request.created_at);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          acc[monthKey] = (acc[monthKey] || 0) + 1;
          return acc;
        }, {});

        const monthlyRequests = Object.entries(monthlyData).map(([month, count]) => ({
          month,
          requests: count as number
        }));

        // Group by service category
        const serviceData = requests.reduce((acc: any, request) => {
          acc[request.service_category] = (acc[request.service_category] || 0) + 1;
          return acc;
        }, {});

        const serviceBreakdown = Object.entries(serviceData).map(([service, count]) => ({
          service: service.replace('_', ' ').toUpperCase(),
          count: count as number
        }));

        setAnalytics({
          totalRequests,
          acceptedRequests,
          completedRequests,
          totalRevenue,
          averageRating: vendorData.rating || 0,
          totalReviews: vendorData.total_reviews || 0,
          monthlyRequests,
          serviceBreakdown
        });
      }
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

  const acceptanceRate = analytics.totalRequests > 0 
    ? Math.round((analytics.acceptedRequests / analytics.totalRequests) * 100) 
    : 0;

  const completionRate = analytics.acceptedRequests > 0 
    ? Math.round((analytics.completedRequests / analytics.acceptedRequests) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.acceptedRequests} accepted ({acceptanceRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Services</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Estimated from completed services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Based on {analytics.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Request Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.monthlyRequests.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.monthlyRequests}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.serviceBreakdown.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ service, percent }) => `${service} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analytics.serviceBreakdown.map((item, index) => (
                    <div key={item.service} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm capitalize">{item.service}</span>
                      </div>
                      <Badge variant="outline">{item.count} requests</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No service requests yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{acceptanceRate}%</div>
              <p className="text-sm text-muted-foreground">Request Acceptance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{completionRate}%</div>
              <p className="text-sm text-muted-foreground">Service Completion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                ${analytics.totalRevenue > 0 ? Math.round(analytics.totalRevenue / analytics.completedRequests || 0) : 0}
              </div>
              <p className="text-sm text-muted-foreground">Average Revenue per Service</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalytics;