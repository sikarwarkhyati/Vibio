// src/hooks/useAnalytics.tsx
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type AnalyticsAction = 'view' | 'search' | 'book' | 'share';

interface AnalyticsData {
  eventId: string;
  action: AnalyticsAction;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async ({ eventId, action, metadata = {}, sessionId }: AnalyticsData) => {
    try {
      if (eventId.startsWith('dummy-') || eventId === 'search') return;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!uuidRegex.test(eventId) && !mongoIdRegex.test(eventId)) {
        console.warn('Skipping analytics event with unsupported identifier format:', eventId);
        return;
      }

      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = sessionStorage.getItem('analytics_session_id') || crypto.randomUUID();
        sessionStorage.setItem('analytics_session_id', currentSessionId);
      }

      const analyticsPayload = {
        event_id: eventId,
        user_id: user?._id || null,
        action_type: action,
        session_id: currentSessionId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        metadata: {
          ...metadata,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          viewport: { width: window.innerWidth, height: window.innerHeight },
        },
      };

      await api.post('/analytics', analyticsPayload);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        console.debug('Analytics endpoint not found (404) — skipping analytics.');
        return;
      }

      const message = error?.message ?? error;
      console.warn('Analytics tracking failed:', message);
    }
  }, [user]);

  const trackEventView = useCallback((eventId: string, metadata?: Record<string, any>) => {
    trackEvent({ eventId, action: 'view', metadata });
  }, [trackEvent]);

  const trackEventSearch = useCallback((searchQuery: string, results: number, metadata?: Record<string, any>) => {
    trackEvent({
      eventId: 'search',
      action: 'search',
      metadata: { ...metadata, query: searchQuery, resultCount: results },
    });
  }, [trackEvent]);

  const trackEventBooking = useCallback((eventId: string, metadata?: Record<string, any>) => {
    trackEvent({ eventId, action: 'book', metadata });
  }, [trackEvent]);

  const trackEventShare = useCallback((eventId: string, shareMethod: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventId,
      action: 'share',
      metadata: { ...metadata, shareMethod },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackEventView,
    trackEventSearch,
    trackEventBooking,
    trackEventShare,
  };
};

export default useAnalytics;
