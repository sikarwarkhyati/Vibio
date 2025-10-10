import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, DollarSign, Users, Target, Star, Mail } from 'lucide-react';

interface Sponsor {
  id: string;
  company_name: string;
  business_type: string;
  description: string;
  logo_url: string;
  website: string;
  preferred_event_types: string[];
  location: string;
  sponsorship_tiers: any;
}

interface SponsorshipRequestsProps {
  eventId?: string;
  onRequestSent?: () => void;
}

const SponsorshipRequests: React.FC<SponsorshipRequestsProps> = ({ eventId, onRequestSent }) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [requestData, setRequestData] = useState({
    requested_amount: '',
    sponsorship_tier: '',
    event_description: '',
    expected_attendance: '',
    target_audience: '',
    benefits_offered: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('company_name');

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
      toast({
        title: "Error",
        description: "Failed to load sponsors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSponsors = sponsors.filter(sponsor =>
    sponsor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sponsor.business_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendRequest = async () => {
    if (!selectedSponsor || !eventId) return;

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sponsor_requests')
        .insert({
          event_id: eventId,
          sponsor_id: selectedSponsor.id,
          organizer_id: userData.user.id,
          requested_amount: parseFloat(requestData.requested_amount),
          sponsorship_tier: requestData.sponsorship_tier,
          event_description: requestData.event_description,
          expected_attendance: parseInt(requestData.expected_attendance),
          target_audience: requestData.target_audience,
          benefits_offered: requestData.benefits_offered
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your sponsorship request has been sent successfully"
      });

      setSelectedSponsor(null);
      setRequestData({
        requested_amount: '',
        sponsorship_tier: '',
        event_description: '',
        expected_attendance: '',
        target_audience: '',
        benefits_offered: ''
      });
      onRequestSent?.();
    } catch (error) {
      console.error('Error sending sponsorship request:', error);
      toast({
        title: "Error",
        description: "Failed to send sponsorship request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search sponsors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSponsors.map((sponsor) => (
          <Card key={sponsor.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {sponsor.logo_url ? (
                    <img 
                      src={sponsor.logo_url} 
                      alt={sponsor.company_name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{sponsor.company_name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {sponsor.business_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {sponsor.description}
              </p>
              
              {sponsor.preferred_event_types && sponsor.preferred_event_types.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Preferred Event Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {sponsor.preferred_event_types.slice(0, 3).map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                    {sponsor.preferred_event_types.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{sponsor.preferred_event_types.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {sponsor.website && (
                  <Button variant="outline" size="sm" className="flex-1">
                    <Star className="w-4 h-4 mr-1" />
                    Website
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedSponsor(sponsor)}
                      disabled={!eventId}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Request Sponsorship
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Request Sponsorship from {sponsor.company_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Requested Amount ($)</label>
                          <Input
                            type="number"
                            value={requestData.requested_amount}
                            onChange={(e) => setRequestData(prev => ({ ...prev, requested_amount: e.target.value }))}
                            placeholder="5000"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Expected Attendance</label>
                          <Input
                            type="number"
                            value={requestData.expected_attendance}
                            onChange={(e) => setRequestData(prev => ({ ...prev, expected_attendance: e.target.value }))}
                            placeholder="500"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Sponsorship Tier</label>
                        <Input
                          value={requestData.sponsorship_tier}
                          onChange={(e) => setRequestData(prev => ({ ...prev, sponsorship_tier: e.target.value }))}
                          placeholder="Gold, Silver, Bronze, etc."
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Event Description</label>
                        <Textarea
                          value={requestData.event_description}
                          onChange={(e) => setRequestData(prev => ({ ...prev, event_description: e.target.value }))}
                          placeholder="Describe your event..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Target Audience</label>
                        <Textarea
                          value={requestData.target_audience}
                          onChange={(e) => setRequestData(prev => ({ ...prev, target_audience: e.target.value }))}
                          placeholder="Describe your target audience demographics..."
                          className="mt-1"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Benefits Offered</label>
                        <Textarea
                          value={requestData.benefits_offered}
                          onChange={(e) => setRequestData(prev => ({ ...prev, benefits_offered: e.target.value }))}
                          placeholder="What benefits will you provide to the sponsor?"
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleSendRequest}
                        disabled={submitting || !requestData.event_description || !requestData.requested_amount}
                        className="w-full"
                      >
                        {submitting ? 'Sending...' : 'Send Sponsorship Request'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSponsors.length === 0 && (
        <div className="text-center py-8">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sponsors found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default SponsorshipRequests;