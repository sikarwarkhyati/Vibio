import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import Navbar from '../components/Navbar';
import useProfile from '../hooks/useProfile';
import usePastEvents from '../hooks/usePastEvents';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Settings, 
  CreditCard, 
  Trophy, 
  Star, 
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit,
  Shield
} from 'lucide-react';
import AddPaymentMethodDialog from '../components/AddPaymentMethodDialog';
import { format } from 'date-fns';

const Profile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, rewards, paymentMethods, loading: profileLoading, updateProfile, addPaymentMethod, removePaymentMethod } = useProfile();
  const { pastEvents, loading: eventsLoading } = usePastEvents();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    phone: '',
    date_of_birth: '',
  });

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking auth
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleEditClick = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
      date_of_birth: profile?.date_of_birth || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile(editForm);
    setIsEditing(false);
  };

  const handleNotificationToggle = async (setting: string, value: boolean) => {
    await updateProfile({
      notification_settings: {
        ...profile?.notification_settings,
        [setting]: value,
      },
    });
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'First Event':
        return 'bg-blue-500';
      case 'Event Explorer':
        return 'bg-green-500';
      case 'Event Master':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {profile?.display_name?.[0] || user?.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {profile?.display_name || 'Your Profile'}
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Past Events
              </TabsTrigger>
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isEditing ? handleSaveProfile : handleEditClick}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="display_name">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="display_name"
                          value={editForm.display_name}
                          onChange={(e) => setEditForm({...editForm, display_name: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile?.display_name || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile?.phone || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      {isEditing ? (
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={editForm.date_of_birth}
                          onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile?.date_of_birth ? format(new Date(profile.date_of_birth), 'MMM dd, yyyy') : 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {profile?.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Reward Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {rewards?.points || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total points earned</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Events Attended
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {rewards?.total_events_attended || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total events</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Badges Earned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {(Array.isArray(rewards?.badges) ? rewards.badges.length : 0) || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total badges</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Past Events Attended</CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : pastEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No past events</h3>
                      <p className="text-muted-foreground">
                        You haven't attended any events yet. Start exploring events to build your history!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastEvents.map((booking) => (
                        <div key={booking.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            {booking.event.image_url ? (
                              <img
                                src={booking.event.image_url}
                                alt={booking.event.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Calendar className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{booking.event.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(booking.event.date), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {booking.event.location}
                              </span>
                            </div>
                          </div>
                          <Badge variant={booking.status === 'checked-in' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Your Badges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rewards?.badges && Array.isArray(rewards.badges) && rewards.badges.length > 0 ? (
                      <div className="space-y-2">
                        {rewards.badges.map((badge: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getBadgeColor(badge)}`}></div>
                            <span className="font-medium">{badge}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Star className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No badges earned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>How to Earn Points</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Attend an event</span>
                      <Badge variant="outline">+10 points</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">First event badge</span>
                      <Badge variant="outline">1 event</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Event Explorer badge</span>
                      <Badge variant="outline">5 events</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Event Master badge</span>
                      <Badge variant="outline">10 events</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive event updates via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={profile?.notification_settings?.email || false}
                      onCheckedChange={(checked) => handleNotificationToggle('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={profile?.notification_settings?.push || false}
                      onCheckedChange={(checked) => handleNotificationToggle('push', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive important updates via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={profile?.notification_settings?.sms || false}
                      onCheckedChange={(checked) => handleNotificationToggle('sms', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payment Methods</CardTitle>
                  <AddPaymentMethodDialog onAdd={addPaymentMethod} />
                </CardHeader>
                <CardContent>
                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No payment methods</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add a payment method to make booking events easier and faster.
                      </p>
                      <AddPaymentMethodDialog onAdd={addPaymentMethod} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-6 bg-gradient-to-r from-primary to-primary-glow rounded flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">**** **** **** {method.card_last_four}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {method.card_type.replace('-', ' ')} • Expires {method.expires_at}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {method.is_default && (
                              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                                Default
                              </Badge>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this payment method? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => removePaymentMethod(method.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Change Password</Label>
                      <p className="text-sm text-muted-foreground">Update your password regularly for better security</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
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

export default Profile;