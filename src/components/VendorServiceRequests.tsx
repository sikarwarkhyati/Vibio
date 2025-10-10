import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, MessageSquare, Calendar, DollarSign } from 'lucide-react';

interface ServiceRequest {
  id: string;
  event_id: string;
  organizer_id: string;
  service_category: string;
  message: string;
  budget_range: string;
  event_date: string;
  status: string;
  vendor_response: string;
  created_at: string;
  events?: {
    title: string;
    location: string;
  };
}

const VendorServiceRequests = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // First get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!vendorData) return;

      const { data, error } = await supabase
        .from('vendor_requests')
        .select(`
          *,
          events (title, location)
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "Error",
        description: "Failed to load service requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string, vendorResponse?: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('vendor_requests')
        .update({
          status: newStatus,
          ...(vendorResponse && { vendor_response: vendorResponse })
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`
      });

      setSelectedRequest(null);
      setResponse('');
      fetchServiceRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'declined': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Service Requests</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
            {requests.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-700">
            {requests.filter(r => r.status === 'accepted').length} Accepted
          </Badge>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Service Requests</h3>
            <p className="text-muted-foreground text-center">
              You haven't received any service requests yet. Make sure your profile is complete and you're marked as available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">
                      {request.events?.title || 'Event Request'}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.event_date).toLocaleDateString()}
                      </span>
                      {request.budget_range && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {request.budget_range}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)} variant="outline">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Organizer</h4>
                    <p className="text-sm text-muted-foreground">
                      Organizer ID: {request.organizer_id}
                    </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Service Category</h4>
                  <Badge variant="secondary">{request.service_category}</Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Requirements</h4>
                  <p className="text-sm text-muted-foreground">{request.message}</p>
                </div>

                {request.events?.location && (
                  <div>
                    <h4 className="font-medium mb-1">Event Location</h4>
                    <p className="text-sm text-muted-foreground">{request.events.location}</p>
                  </div>
                )}

                {request.vendor_response && (
                  <div>
                    <h4 className="font-medium mb-1">Your Response</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      {request.vendor_response}
                    </p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Accept Service Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            You're about to accept this service request. You can include a message with your acceptance.
                          </p>
                          <div>
                            <label className="text-sm font-medium">Response Message</label>
                            <Textarea
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              placeholder="Thank you for choosing our services. We'll be happy to provide..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(null);
                                setResponse('');
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(request.id, 'accepted', response)}
                              disabled={submitting}
                              className="flex-1"
                            >
                              {submitting ? 'Processing...' : 'Accept Request'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedRequest(request);
                            setResponse('');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Decline Service Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Please provide a reason for declining this request. This helps organizers understand and potentially find alternative solutions.
                          </p>
                          <div>
                            <label className="text-sm font-medium">Reason for Declining</label>
                            <Textarea
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              placeholder="Unfortunately, we're not available for this date..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(null);
                                setResponse('');
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleStatusUpdate(request.id, 'declined', response)}
                              disabled={submitting || !response.trim()}
                              className="flex-1"
                            >
                              {submitting ? 'Processing...' : 'Decline Request'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {request.status === 'accepted' && (
                  <div className="pt-4">
                    <Button
                      onClick={() => handleStatusUpdate(request.id, 'completed')}
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? 'Processing...' : 'Mark as Completed'}
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

export default VendorServiceRequests;