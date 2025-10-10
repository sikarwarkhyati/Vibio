import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Eye, Users, Search, Share2, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventAnalytics {
  event_id: string;
  event_title: string;
  total_views: number;
  total_bookings: number;
  total_searches: number;
  total_shares: number;
  popularity_score: number;
  recent_activity: Array<{
    action_type: string;
    count: number;
    date: string;
  }>;
}

interface AnalyticsDashboardProps {
  eventId?: string; // If provided, show analytics for specific event
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ eventId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<EventAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days'>('30days');

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get date range
      const daysBack = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Query for organizer's events analytics
      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          popularity_score,
          created_at
        `)
        .eq('organizer_id', user.id);

      if (eventId) {
        query = query.eq('id', eventId);
      }

      const { data: events, error: eventsError } = await query;

      if (eventsError) {
        throw eventsError;
      }

      if (!events || events.length === 0) {
        setAnalytics([]);
        return;
      }

      // Get analytics data for each event
      const analyticsPromises = events.map(async (event) => {
        const { data: analyticsData, error: analyticsError } = await supabase
          .from('event_analytics')
          .select('action_type, created_at')
          .eq('event_id', event.id)
          .gte('created_at', startDate.toISOString());

        if (analyticsError) {
          console.error('Error fetching analytics for event:', event.id, analyticsError);
          return null;
        }

        // Process analytics data
        const views = analyticsData?.filter(a => a.action_type === 'view').length || 0;
        const bookings = analyticsData?.filter(a => a.action_type === 'book').length || 0;
        const searches = analyticsData?.filter(a => a.action_type === 'search').length || 0;
        const shares = analyticsData?.filter(a => a.action_type === 'share').length || 0;

        // Group by date for recent activity
        const activityByDate: Record<string, Record<string, number>> = {};
        analyticsData?.forEach(item => {
          const date = new Date(item.created_at).toISOString().split('T')[0];
          if (!activityByDate[date]) {
            activityByDate[date] = { view: 0, book: 0, search: 0, share: 0 };
          }
          activityByDate[date][item.action_type] = (activityByDate[date][item.action_type] || 0) + 1;
        });

        const recentActivity = Object.entries(activityByDate)
          .map(([date, actions]) => ({
            date,
            actions: Object.entries(actions).map(([action_type, count]) => ({
              action_type,
              count
            }))
          }))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 7) // Last 7 days
          .flatMap(day => day.actions);

        return {
          event_id: event.id,
          event_title: event.title,
          total_views: views,
          total_bookings: bookings,
          total_searches: searches,
          total_shares: shares,
          popularity_score: event.popularity_score || 0,
          recent_activity: recentActivity
        };
      });

      const results = await Promise.all(analyticsPromises);
      setAnalytics(results.filter(Boolean) as EventAnalytics[]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPopularityScores = async () => {
    try {
      setRefreshing(true);
      
      // Call the update function
      const { error } = await supabase.rpc('update_all_popularity_scores');
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Popularity scores updated successfully',
      });

      // Refresh the analytics data
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating popularity scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to update popularity scores',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, timeRange, eventId]);

  const totalViews = analytics.reduce((sum, event) => sum + event.total_views, 0);
  const totalBookings = analytics.reduce((sum, event) => sum + event.total_bookings, 0);
  const totalShares = analytics.reduce((sum, event) => sum + event.total_shares, 0);
  const avgPopularity = analytics.length > 0 
    ? Math.round(analytics.reduce((sum, event) => sum + event.popularity_score, 0) / analytics.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange === '7days' ? '7' : timeRange === '30days' ? '30' : '90'} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate: {totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares}</div>
            <p className="text-xs text-muted-foreground">
              Virality factor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Popularity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPopularity}</div>
            <p className="text-xs text-muted-foreground">
              Popularity score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range & Refresh Controls */}
      <div className="flex justify-between items-center">
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
          <TabsList>
            <TabsTrigger value="7days">7 Days</TabsTrigger>
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="90days">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button 
          onClick={refreshPopularityScores}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <TrendingUp className="h-4 w-4 mr-2" />
          )}
          Update Popularity Scores
        </Button>
      </div>

      {/* Event Analytics */}
      {analytics.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Analytics data will appear here once your events start receiving views and interactions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analytics.map((eventAnalytics) => (
            <Card key={eventAnalytics.event_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{eventAnalytics.event_title}</CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Score: {eventAnalytics.popularity_score}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Views: {eventAnalytics.total_views}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Bookings: {eventAnalytics.total_bookings}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Searches: {eventAnalytics.total_searches}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Shares: {eventAnalytics.total_shares}</span>
                  </div>
                </div>

                {eventAnalytics.total_views > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Conversion Rate</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (eventAnalytics.total_bookings / eventAnalytics.total_views) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((eventAnalytics.total_bookings / eventAnalytics.total_views) * 100).toFixed(1)}% conversion rate
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;