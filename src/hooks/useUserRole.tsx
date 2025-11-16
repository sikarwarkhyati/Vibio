// src/hooks/useUserRole.tsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export type UserRole = 'user' | 'organizer' | 'admin' | 'superadmin' | 'vendor' | 'sponsor';

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

      const id = (user as any)?._id || (user as any)?.id;
      if (!id) {
        setUserRole('user');
        setLoading(false);
        return;
      }

      const res = await api.get(`/users/${id}/role`);
      setUserRole(res.data.role || 'user');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch user role';
      setError(errorMessage);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const hasRole = (role: UserRole | UserRole[]) => {
    if (Array.isArray(role)) {
      return role.includes(userRole ?? 'user');
    }
    return userRole === role;
  };
  const isOrganizer = () => hasRole('organizer');
  const isAdmin = () => hasRole(['admin', 'superadmin']);
  const isSuperadmin = () => hasRole('superadmin');
  const isUser = () => hasRole('user');
  const isVendor = () => hasRole('vendor');
  const isSponsor = () => hasRole('sponsor');

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return {
    userRole,
    loading,
    error,
    hasRole,
    isOrganizer,
    isAdmin,
    isSuperadmin,
    isUser,
    isVendor,
    isSponsor,
    refetch: fetchUserRole,
  };
};
