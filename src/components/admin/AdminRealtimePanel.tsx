// File: src/components/admin/AdminRealtimePanel.tsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { useToast } from '../../hooks/use-toast';
import { Activity } from 'lucide-react';

const POLL_MS = 5000;

const AdminRealtimePanel: React.FC = () => {
  const [realtime, setRealtime] = useState<{ activeUsers: number; recentSignups: number; serverLoad?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetchRealtime();
    timerRef.current = window.setInterval(fetchRealtime, POLL_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const fetchRealtime = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/realtime');
      const payload = res.data ?? {};
      setRealtime({
        activeUsers: payload.activeUsers ?? payload.active_users ?? 0,
        recentSignups: payload.recentSignups ?? payload.recent_signups ?? 0,
        serverLoad: payload.serverLoad ?? payload.server_load ?? undefined,
      });
    } catch (err: any) {
      console.error('fetchRealtime error', err);
      // non-fatal; show toast once
      toast({ title: 'Realtime fetch error', description: err.message || 'Failed to fetch realtime data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Realtime <Activity className="h-4 w-4 text-muted-foreground" /></CardTitle>
      </CardHeader>
      <CardContent>
        {realtime ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Active Users</div>
              <div className="text-lg font-bold">{realtime.activeUsers}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Recent Signups (24h)</div>
              <div className="text-lg font-bold">{realtime.recentSignups}</div>
            </div>
            {typeof realtime.serverLoad !== 'undefined' && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Server Load</div>
                <div className="text-lg font-bold">{realtime.serverLoad}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No realtime data</div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRealtimePanel;