// src/components/CreateEventForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  date: z.date({
    required_error: 'Event date is required',
  }),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  venue: z.string().optional(),
  event_type: z.string().min(1, 'Event type is required'),
  price: z.number().min(0, 'Price must be 0 or greater').optional(),
  available_seats: z.number().min(1, 'At least 1 seat is required'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventFormProps {
  open: boolean;
  onClose: () => void;
  event?: any; // For editing existing events
  organizerId?: string; // optional prop if parent passes it
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ open, onClose, event, organizerId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      date: event?.date ? new Date(event.date) : undefined,
      time: event?.time || '',
      location: event?.location || '',
      venue: event?.venue || '',
      event_type: event?.event_type || '',
      price: event?.price || 0,
      available_seats: event?.available_seats || 50,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Expect { url: string } (adjust if your backend returns different shape)
      return res.data?.url ?? null;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  };

  const onSubmit = async (data: EventFormData) => {
    const currentUserId = organizerId ?? ((user as any)?._id ?? (user as any)?.id);
    if (!currentUserId) {
      toast({ title: 'Error', description: 'You must be logged in to create events', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let imageUrl = event?.image_url || '';

      // Upload image if a new one was selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      // Combine date and time
      const eventDate = new Date(data.date);
      const [hours, minutes] = data.time.split(':').map((s) => parseInt(s, 10));
      if (!Number.isNaN(hours)) eventDate.setHours(hours, Number.isNaN(minutes) ? 0 : minutes);

      const payload = {
        title: data.title,
        description: data.description,
        date: eventDate.toISOString(),
        location: data.location,
        venue: data.venue,
        event_type: data.event_type,
        price: data.price ?? 0,
        available_seats: data.available_seats,
        image_url: imageUrl,
        organizer_id: currentUserId,
        popularity_score: event?.popularity_score ?? 0,
      };

      if (event && event.id) {
        // update (use event.id which should be mapped to Mongo _id by frontend)
        await api.patch(`/events/${event.id}`, payload);
      } else {
        await api.post('/events', payload);
      }

      toast({ title: 'Success!', description: `Event ${event ? 'updated' : 'created'} successfully` });
      onClose();
      form.reset();
      setImageFile(null);
      setImagePreview('');
    } catch (err: any) {
      console.error('Error saving event:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || `Failed to ${event ? 'update' : 'create'} event.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Image Upload */}
            <div className="space-y-2">
              <Label>Event Cover Image</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                </div>
                {(imagePreview || event?.image_url) && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={imagePreview || event?.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* ... (rest of the form fields stay unchanged) ... */}
            {/* For brevity the rest of the same FormField blocks are kept as in your original file */}
            {/* Keep the original FormField blocks for title, description, date/time, location, event_type, price, available_seats */}
            {/* The submit buttons remain the same */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {event ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventForm;
