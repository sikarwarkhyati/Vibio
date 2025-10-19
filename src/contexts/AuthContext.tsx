// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface UserType {
  _id: string;
  email: string;
  fullName?: string;
  role?: string;
  orgName?: string;
  businessName?: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    role?: string,
    orgName?: string,
    businessName?: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from backend if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // Sign Up
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    role?: string,
    orgName?: string,
    businessName?: string
  ) => {
    try {
      const res = await api.post('/auth/signup', {
        email,
        password,
        fullName,
        role,
        orgName,
        businessName,
      });
      return { error: null };
    } catch (err: any) {
      console.error('Signup error:', err.response?.data || err.message);
      return { error: err.response?.data || err.message };
    }
  };

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      // Store token and update state
      localStorage.setItem('token', token);
      setUser(user);

      // Navigate based on role
      const role = user.role || 'user';
      const redirectPath =
        role === 'organizer'
          ? '/dashboard'
          : role === 'user'
          ? '/user-dashboard'
          : '/';
      navigate(redirectPath, { replace: true });

      return { error: null };
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      return { error: err.response?.data || err.message };
    }
  };

  // Sign Out
  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/role-auth', { replace: true });
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
