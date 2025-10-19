// src/hooks/useProfile.tsx
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { PaymentMethod } from '../types/payment'; // Assuming this correctly contains 'id: string'

// Interface for data AS IT COMES FROM THE BACKEND (often uses _id)
export interface Profile {
  // NOTE: When fetching, the backend returns _id, but we transform it to id in the fetcher.
  id: string; 
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

export interface UserRewards {
  id: string;
  points: number;
  total_events_attended: number;
  badges: any;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  // The state should hold the transformed (frontend-ready) data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProfile = async () => {
    // Note: It's cleaner to check for user inside the effect to avoid unnecessary fetches
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/users/${user._id}/profile`);
      const { profile: backendProfile, rewards: backendRewards, paymentMethods: backendMethods } = res.data;

      // 1. Map Profile ID: Ensure the profile object itself has an 'id' field
      const transformedProfile = {
          ...backendProfile,
          id: backendProfile._id || backendProfile.id,
      }
      
      // 2. Map Payment Methods ID: CRITICAL FIX for the PaymentMethod error
      const transformedPaymentMethods = (backendMethods || []).map((method: any) => ({
          ...method,
          id: method._id || method.id, // Transform _id to id
      })) as PaymentMethod[];


      setProfile(transformedProfile);
      setRewards(backendRewards); // Assuming rewards already uses 'id' or doesn't need transformation
      setPaymentMethods(transformedPaymentMethods); // Use the transformed array

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    try {
      await api.patch(`/users/${user._id}/profile`, updates);
      toast({ title: 'Success', description: 'Profile updated successfully.' });
      fetchProfile();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      throw err;
    }
  };

  const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      await api.post(`/users/${user._id}/payment-methods`, paymentMethod);
      toast({ title: 'Payment Method Added', description: 'Your payment method has been added successfully.' });
      fetchProfile();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add payment method';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      // NOTE: Using a relative route assuming the payment method API handles auth/user context
      await api.delete(`/payment-methods/${paymentMethodId}`); 
      toast({ title: 'Payment Method Removed', description: 'Your payment method has been removed successfully.' });
      fetchProfile();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove payment method';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  useEffect(() => {
    // Fetch data only when user object (from AuthContext) changes/loads
    fetchProfile();
  }, [user]); // Depend on user state change

  return { profile, rewards, paymentMethods, loading, error, updateProfile, addPaymentMethod, removePaymentMethod, refetch: fetchProfile };
};

export default useProfile;