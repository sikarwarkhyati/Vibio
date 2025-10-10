import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      // Skip analytics for dummy events or invalid UUIDs
      if (eventId.startsWith('dummy-') || eventId === 'search') {
        return;
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(eventId)) {
        console.warn('Invalid UUID format for analytics tracking:', eventId);
        return;
      }

      // Get session ID from sessionStorage or generate one
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = sessionStorage.getItem('analytics_session_id');
        if (!currentSessionId) {
          currentSessionId = crypto.randomUUID();
          sessionStorage.setItem('analytics_session_id', currentSessionId);
        }
      }

      // Collect additional metadata
      const analyticsPayload = {
        event_id: eventId,
        user_id: user?.id || null,
        action_type: action,
        session_id: currentSessionId,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        metadata: {
          ...metadata,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      // Insert analytics data
      const { error } = await supabase
        .from('event_analytics')
        .insert([analyticsPayload]);

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }, [user]);

  const trackEventView = useCallback((eventId: string, metadata?: Record<string, any>) => {
    trackEvent({ eventId, action: 'view', metadata });
  }, [trackEvent]);

  const trackEventSearch = useCallback((searchQuery: string, results: number, metadata?: Record<string, any>) => {
    // For search tracking, we can pass a general eventId or track without specific event
    trackEvent({ 
      eventId: 'search', // Special ID for search events
      action: 'search', 
      metadata: {
        ...metadata,
        query: searchQuery,
        resultCount: results
      }
    });
  }, [trackEvent]);

  const trackEventBooking = useCallback((eventId: string, metadata?: Record<string, any>) => {
    trackEvent({ eventId, action: 'book', metadata });
  }, [trackEvent]);

  const trackEventShare = useCallback((eventId: string, shareMethod: string, metadata?: Record<string, any>) => {
    trackEvent({ 
      eventId, 
      action: 'share', 
      metadata: {
        ...metadata,
        shareMethod
      }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackEventView,
    trackEventSearch,
    trackEventBooking,
    trackEventShare
  };
};

export default useAnalytics;