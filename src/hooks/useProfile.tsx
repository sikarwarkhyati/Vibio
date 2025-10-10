import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  preferences: any;
  notification_settings: any;
  created_at: string;
  updated_at: string;
}

interface UserRewards {
  id: string;
  user_id: string;
  points: number;
  total_events_attended: number;
  badges: any;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  id: string;
  user_id: string;
  card_last_four: string;
  card_type: string;
  expires_at: string;
  is_default: boolean;
  created_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (rewardsError && rewardsError.code !== 'PGRST116') {
        throw rewardsError;
      }

      // Fetch payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentError) {
        throw paymentError;
      }

      setProfile(profileData);
      setRewards(rewardsData);
      setPaymentMethods(paymentData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      });

      await fetchProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user.id,
          ...paymentMethod,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Payment Method Added',
        description: 'Your payment method has been added successfully.',
      });

      fetchProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment method';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Payment Method Removed',
        description: 'Your payment method has been removed successfully.',
      });

      fetchProfile();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove payment method';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    rewards,
    paymentMethods,
    loading,
    error,
    updateProfile,
    addPaymentMethod,
    removePaymentMethod,
    refetch: fetchProfile,
  };
};

export default useProfile;