import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, Phone, Mail, MapPin, DollarSign, Star } from 'lucide-react';

interface VendorData {
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
  portfolio_images: any;
}

const serviceCategoryOptions = [
  { value: 'security', label: 'Security Services' },
  { value: 'stage_setup', label: 'Stage Setup' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'food_stalls', label: 'Food Stalls' },
  { value: 'photography', label: 'Photography' },
  { value: 'catering', label: 'Catering' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other Services' }
];

const VendorProfile = () => {
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setVendorData(data);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!vendorData) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('vendors')
        .upsert({
          ...vendorData,
          user_id: userData.user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving vendor profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof VendorData, value: any) => {
    setVendorData(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Vendor Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You haven't set up your vendor profile yet. Complete your profile to start receiving service requests.
          </p>
        <Button onClick={async () => {
          const { data: userData } = await supabase.auth.getUser();
          setVendorData({
            id: '',
            business_name: '',
            service_category: 'other',
            description: '',
            contact_email: '',
            contact_phone: '',
            location: '',
            price_range: '',
            rating: 0,
            total_reviews: 0,
            availability: true,
            portfolio_images: []
          });
          setIsEditing(true);
        }}>
            Set Up Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Profile
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {vendorData.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{vendorData.rating}</span>
                <span className="text-sm text-muted-foreground">({vendorData.total_reviews} reviews)</span>
              </div>
            )}
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Business Name</label>
              {isEditing ? (
                <Input
                  value={vendorData.business_name}
                  onChange={(e) => updateField('business_name', e.target.value)}
                  placeholder="Enter business name"
                />
              ) : (
                <p className="text-foreground">{vendorData.business_name || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Service Category</label>
              {isEditing ? (
                <Select value={vendorData.service_category} onValueChange={(value) => updateField('service_category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary">
                  {serviceCategoryOptions.find(opt => opt.value === vendorData.service_category)?.label || vendorData.service_category}
                </Badge>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Email
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={vendorData.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  placeholder="business@example.com"
                />
              ) : (
                <p className="text-foreground">{vendorData.contact_email || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Phone
              </label>
              {isEditing ? (
                <Input
                  value={vendorData.contact_phone}
                  onChange={(e) => updateField('contact_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-foreground">{vendorData.contact_phone || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              {isEditing ? (
                <Input
                  value={vendorData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, State"
                />
              ) : (
                <p className="text-foreground">{vendorData.location || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Range
              </label>
              {isEditing ? (
                <Input
                  value={vendorData.price_range}
                  onChange={(e) => updateField('price_range', e.target.value)}
                  placeholder="$500 - $2000"
                />
              ) : (
                <p className="text-foreground">{vendorData.price_range || 'Contact for quote'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Business Description</label>
            {isEditing ? (
              <Textarea
                value={vendorData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe your services, experience, and what makes your business unique..."
                rows={4}
              />
            ) : (
              <p className="text-foreground">{vendorData.description || 'No description provided'}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Availability Status</h4>
              <p className="text-sm text-muted-foreground">
                {vendorData.availability ? 'Currently accepting new requests' : 'Not accepting requests'}
              </p>
            </div>
            {isEditing && (
              <Button
                variant={vendorData.availability ? "default" : "outline"}
                onClick={() => updateField('availability', !vendorData.availability)}
              >
                {vendorData.availability ? 'Available' : 'Unavailable'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorProfile;