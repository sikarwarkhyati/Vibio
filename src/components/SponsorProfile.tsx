import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, Globe, MapPin } from 'lucide-react';

interface SponsorData {
  id: string;
  company_name: string;
  business_type: string;
  description: string;
  logo_url: string;
  website: string;
  preferred_event_types: string[];
  location: string;
}

const SponsorProfile = () => {
  const [sponsorData, setSponsorData] = useState<SponsorData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSponsorProfile();
  }, []);

  const fetchSponsorProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSponsorData(data);
    } catch (error) {
      console.error('Error fetching sponsor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sponsorData) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sponsors')
        .upsert({
          ...sponsorData,
          user_id: userData.user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving sponsor profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!sponsorData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Sponsor Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {
            setSponsorData({
              id: '',
              company_name: '',
              business_type: '',
              description: '',
              logo_url: '',
              website: '',
              preferred_event_types: [],
              location: ''
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Company Profile
        </CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Company Name</label>
            {isEditing ? (
              <Input
                value={sponsorData.company_name}
                onChange={(e) => setSponsorData(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                placeholder="Enter company name"
              />
            ) : (
              <p className="text-foreground">{sponsorData.company_name || 'Not specified'}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Business Type</label>
            {isEditing ? (
              <Input
                value={sponsorData.business_type}
                onChange={(e) => setSponsorData(prev => prev ? { ...prev, business_type: e.target.value } : null)}
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            ) : (
              <Badge variant="secondary">{sponsorData.business_type}</Badge>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </label>
            {isEditing ? (
              <Input
                value={sponsorData.website}
                onChange={(e) => setSponsorData(prev => prev ? { ...prev, website: e.target.value } : null)}
                placeholder="https://company.com"
              />
            ) : (
              <p className="text-foreground">{sponsorData.website || 'Not specified'}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            {isEditing ? (
              <Input
                value={sponsorData.location}
                onChange={(e) => setSponsorData(prev => prev ? { ...prev, location: e.target.value } : null)}
                placeholder="City, State"
              />
            ) : (
              <p className="text-foreground">{sponsorData.location || 'Not specified'}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Company Description</label>
          {isEditing ? (
            <Textarea
              value={sponsorData.description}
              onChange={(e) => setSponsorData(prev => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="Describe your company and sponsorship goals..."
              rows={4}
            />
          ) : (
            <p className="text-foreground">{sponsorData.description || 'No description provided'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SponsorProfile;