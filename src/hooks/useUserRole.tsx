// src/hooks/useUserRole.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export type UserRole = 'user' | 'organizer' | 'admin' | 'vendor' | 'sponsor';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/users/${user._id}/role`);
      setUserRole(res.data.role || 'user');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch user role';
      setError(errorMessage);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const hasRole = (role: UserRole) => userRole === role;
  const isOrganizer = () => hasRole('organizer');
  const isAdmin = () => hasRole('admin');
  const isUser = () => hasRole('user');
  const isVendor = () => hasRole('vendor');
  const isSponsor = () => hasRole('sponsor');

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return { userRole, loading, error, hasRole, isOrganizer, isAdmin, isUser, isVendor, isSponsor, refetch: fetchUserRole };
};
