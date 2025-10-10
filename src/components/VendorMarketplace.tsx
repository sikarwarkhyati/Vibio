import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Camera, Utensils, Lightbulb, Building, Star, MapPin, Phone, Mail } from 'lucide-react';

interface Vendor {
  id: string;
  business_name: string;
  service_category: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  price_range: string;
  rating: number;
  total_reviews: number;
  availability: boolean;
}

const serviceCategoryIcons = {
  security: Shield,
  stage_setup: Building,
  lighting: Lightbulb,
  food_stalls: Utensils,
  photography: Camera,
  catering: Utensils,
  entertainment: Building,
  decoration: Building,
  transport: Building,
  other: Building
};

const serviceCategoryLabels = {
  security: 'Security Services',
  stage_setup: 'Stage Setup',
  lighting: 'Lighting',
  food_stalls: 'Food Stalls',
  photography: 'Photography',
  catering: 'Catering',
  entertainment: 'Entertainment',
  decoration: 'Decoration',
  transport: 'Transport',
  other: 'Other Services'
};

interface VendorMarketplaceProps {
  eventId?: string;
  onRequestSent?: () => void;
}

const VendorMarketplace: React.FC<VendorMarketplaceProps> = ({ eventId, onRequestSent }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [requestData, setRequestData] = useState({
    message: '',
    budget_range: '',
    event_date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('availability', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesCategory = selectedCategory === 'all' || vendor.service_category === selectedCategory;
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendRequest = async () => {
    if (!selectedVendor || !eventId) return;

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('vendor_requests')
        .insert({
          event_id: eventId,
          vendor_id: selectedVendor.id,
          organizer_id: userData.user.id,
          service_category: selectedVendor.service_category,
          message: requestData.message,
          budget_range: requestData.budget_range,
          event_date: requestData.event_date
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your vendor request has been sent successfully"
      });

      setSelectedVendor(null);
      setRequestData({ message: '', budget_range: '', event_date: '' });
      onRequestSent?.();
    } catch (error) {
      console.error('Error sending vendor request:', error);
      toast({
        title: "Error",
        description: "Failed to send vendor request",
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
          placeholder="Search vendors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(serviceCategoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => {
          const IconComponent = serviceCategoryIcons[vendor.service_category as keyof typeof serviceCategoryIcons];
          return (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{vendor.business_name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {serviceCategoryLabels[vendor.service_category as keyof typeof serviceCategoryLabels]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{vendor.rating}</span>
                    <span className="text-xs text-muted-foreground">({vendor.total_reviews})</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {vendor.description}
                </p>
                
                <div className="space-y-2">
                  {vendor.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {vendor.location}
                    </div>
                  )}
                  {vendor.price_range && (
                    <div className="text-sm font-medium text-primary">
                      {vendor.price_range}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {vendor.contact_phone && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedVendor(vendor)}
                        disabled={!eventId}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Request Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Service from {vendor.business_name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Message</label>
                          <Textarea
                            value={requestData.message}
                            onChange={(e) => setRequestData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Describe your requirements..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Budget Range</label>
                          <Input
                            value={requestData.budget_range}
                            onChange={(e) => setRequestData(prev => ({ ...prev, budget_range: e.target.value }))}
                            placeholder="e.g., $500-1000"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Event Date</label>
                          <Input
                            type="date"
                            value={requestData.event_date}
                            onChange={(e) => setRequestData(prev => ({ ...prev, event_date: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <Button 
                          onClick={handleSendRequest}
                          disabled={submitting || !requestData.message}
                          className="w-full"
                        >
                          {submitting ? 'Sending...' : 'Send Request'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-8">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No vendors found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or category filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorMarketplace;