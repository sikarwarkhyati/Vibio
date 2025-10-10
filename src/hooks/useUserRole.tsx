import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'user' | 'organizer' | 'admin' | 'vendor' | 'sponsor';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserRole = async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        throw roleError;
      }

      setUserRole(data?.role as UserRole || 'user');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user role';
      setError(errorMessage);
      setUserRole('user'); // Default to user role
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole) => {
    return userRole === role;
  };

  const isOrganizer = () => hasRole('organizer');
  const isAdmin = () => hasRole('admin');
  const isUser = () => hasRole('user');
  const isVendor = () => hasRole('vendor');
  const isSponsor = () => hasRole('sponsor');

  useEffect(() => {
    fetchUserRole();
  }, [user]);

  return {
    userRole,
    loading,
    error,
    hasRole,
    isOrganizer,
    isAdmin,
    isUser,
    isVendor,
    isSponsor,
    refetch: fetchUserRole
  };
};