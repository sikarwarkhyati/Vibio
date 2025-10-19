// File: src/components/admin/AdminEventsOverview.tsx
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';

interface EventRow {
  id: string;
  title: string;
  date: string;
  organizer?: string;
  ticketsSold?: number;
}

const AdminEventsOverview: React.FC = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/events');
      const payload = res.data?.events ?? res.data ?? [];
      setEvents((payload as any[]).map(e => ({ id: e._id ?? e.id, title: e.title, date: e.date, organizer: e.organizer_name ?? e.organizer_id, ticketsSold: e.ticketsSold ?? e.tickets_sold ?? 0 })));
    } catch (err: any) {
      console.error('fetchEvents error', err);
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to load events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Delete event? This action cannot be undone.')) return;
    try {
      await api.delete(`/events/${eventId}`);
      toast({ title: 'Deleted', description: 'Event removed' });
      fetchEvents();
    } catch (err: any) {
      console.error('deleteEvent error', err);
      toast({ title: 'Error', description: err.response?.data?.message || err.message || 'Failed to delete event', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="py-2">Title</th>
                <th className="py-2">Date</th>
                <th className="py-2">Organizer</th>
                <th className="py-2">Tickets Sold</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="border-t">
                  <td className="py-3">{ev.title}</td>
                  <td className="py-3">{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</td>
                  <td className="py-3">{ev.organizer}</td>
                  <td className="py-3">{ev.ticketsSold}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => window.open(`/events/${ev.id}`, '_blank')}>View</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteEvent(ev.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminEventsOverview;