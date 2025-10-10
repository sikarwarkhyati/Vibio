import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Users, Calendar, DollarSign } from 'lucide-react';

interface SponsorshipRequest {
  id: string;
  event_id: string;
  organizer_id: string;
  requested_amount: number;
  sponsorship_tier: string;
  event_description: string;
  expected_attendance: number;
  target_audience: string;
  benefits_offered: string;
  status: string;
  created_at: string;
  events?: {
    title: string;
    location: string;
    date: string;
  };
}

const SponsorshipOffers = () => {
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSponsorshipRequests();
  }, []);

  const fetchSponsorshipRequests = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: sponsorData } = await supabase
        .from('sponsors')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!sponsorData) return;

      const { data, error } = await supabase
        .from('sponsor_requests')
        .select(`
          *,
          events (title, location, date)
        `)
        .eq('sponsor_id', sponsorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching sponsorship requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sponsor_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`
      });

      fetchSponsorshipRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sponsorship Requests</h2>
      
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sponsorship Requests</h3>
            <p className="text-muted-foreground text-center">
              You haven't received any sponsorship requests yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{request.events?.title || 'Event Sponsorship'}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {request.events?.date ? new Date(request.events.date).toLocaleDateString() : 'TBD'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {request.expected_attendance} expected
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${request.requested_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant={request.status === 'pending' ? 'default' : request.status === 'approved' ? 'secondary' : 'destructive'}>
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Sponsorship Tier</h4>
                  <Badge variant="outline">{request.sponsorship_tier}</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Event Description</h4>
                  <p className="text-sm text-muted-foreground">{request.event_description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Target Audience</h4>
                  <p className="text-sm text-muted-foreground">{request.target_audience}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Benefits Offered</h4>
                  <p className="text-sm text-muted-foreground">{request.benefits_offered}</p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleStatusUpdate(request.id, 'approved')}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleStatusUpdate(request.id, 'declined')}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
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

export default SponsorshipOffers;