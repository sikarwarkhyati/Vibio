// src/components/CreateEventForm.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';

type SupportedMediaType = 'image' | 'video';

interface UploadedMediaItem {
  id: string;
  url: string | null;
  public_id?: string | null;
  type: SupportedMediaType;
  previewUrl: string;
  uploading?: boolean;
}

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
]);

const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024; // 6 MB
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

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
  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>([]);
  const [removedMediaPublicIds, setRemovedMediaPublicIds] = useState<string[]>([]);
  const previewUrlsRef = useRef(new Set<string>());
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

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

  useEffect(() => {
    if (!open) {
      return () => undefined;
    }

    const initialMedia: UploadedMediaItem[] = [];

    const appendMediaFromUrls = (urls: unknown, type: SupportedMediaType) => {
      if (!Array.isArray(urls)) return;
      urls.forEach((url) => {
        if (typeof url === 'string' && url.trim()) {
          initialMedia.push({
            id: `${type}-${url}`,
            url,
            public_id: null,
            type,
            previewUrl: url,
            uploading: false,
          });
        }
      });
    };

    appendMediaFromUrls(event?.images, 'image');
    appendMediaFromUrls(event?.videos, 'video');

    if (Array.isArray(event?.media)) {
      (event.media as Array<{ url?: unknown; public_id?: unknown; type?: unknown }>).forEach((item) => {
        if (!item) return;
        const url = typeof item.url === 'string' ? item.url : undefined;
        const publicId = typeof item.public_id === 'string' ? item.public_id : undefined;
        const type = item.type === 'video' ? 'video' : item.type === 'image' ? 'image' : undefined;
        if (url && type) {
          initialMedia.push({
            id: `${type}-${url}-${publicId ?? 'existing'}`,
            url,
            public_id: publicId ?? null,
            type,
            previewUrl: url,
            uploading: false,
          });
        }
      });
    }

    if (!initialMedia.length && event?.image_url) {
      initialMedia.push({
        id: `image-${event.image_url}`,
        url: event.image_url,
        public_id: null,
        type: 'image',
        previewUrl: event.image_url,
        uploading: false,
      });
    }

    const dedupedMedia = Array.from(
      initialMedia.reduce((acc, item) => {
        const key = item.url || item.id;
        if (!acc.has(key)) {
          acc.set(key, item);
        }
        return acc;
      }, new Map<string, UploadedMediaItem>()).values()
    );

    setMediaItems(dedupedMedia);
    setRemovedMediaPublicIds([]);

    return () => {
      previewUrlsRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      previewUrlsRef.current.clear();
    };
  }, [event, open]);

  const resetFileInput = (input: HTMLInputElement | null) => {
    if (input) {
      input.value = '';
    }
  };

  const validateFile = (file: File): { valid: boolean; type?: SupportedMediaType; errorMessage?: string } => {
    const mime = file.type;
    const size = file.size;

    if (IMAGE_MIME_TYPES.has(mime)) {
      if (size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, errorMessage: 'File too large. Images must be under 6MB.' };
      }
      return { valid: true, type: 'image' };
    }

    if (VIDEO_MIME_TYPES.has(mime)) {
      if (size > MAX_VIDEO_SIZE_BYTES) {
        return { valid: false, errorMessage: 'File too large. Videos must be under 20MB.' };
      }
      return { valid: true, type: 'video' };
    }

    return { valid: false, errorMessage: 'Invalid file type' };
  };

  const handleFileUpload = async (file: File, inputEl: HTMLInputElement | null) => {
    const validation = validateFile(file);
    if (!validation.valid || !validation.type) {
      toast({
        title: 'Upload failed',
        description: validation.errorMessage ?? 'Invalid file selected',
        variant: 'destructive',
      });
      resetFileInput(inputEl);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlsRef.current.add(previewUrl);

    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const optimisticItem: UploadedMediaItem = {
      id: tempId,
      url: null,
      public_id: null,
      type: validation.type,
      previewUrl,
      uploading: true,
    };

    setMediaItems((prev) => [...prev, optimisticItem]);
    setIsUploadingMedia(true);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const response = await api.post('/upload/file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url, public_id, type } = response.data ?? {};

      if (!url) {
        throw new Error('Upload did not return a URL');
      }

      setMediaItems((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                url,
                public_id: public_id ?? null,
                type: type === 'video' ? 'video' : 'image',
                previewUrl: type === 'video' ? url : item.previewUrl || url,
                uploading: false,
              }
            : item
        )
      );

      toast({
        title: 'Upload complete',
        description: `${validation.type === 'video' ? 'Video' : 'Image'} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Upload failed',
        description: error?.response?.data?.message || error?.message || 'Unable to upload file.',
        variant: 'destructive',
      });

      setMediaItems((prev) => prev.filter((item) => item.id !== tempId));
      URL.revokeObjectURL(previewUrl);
      previewUrlsRef.current.delete(previewUrl);
    } finally {
      resetFileInput(inputEl);
      setIsUploadingMedia(false);
    }
  };

  const handleMediaInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      resetFileInput(event.target);
      return;
    }

    handleFileUpload(file, event.target);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === mediaId);

      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }

      if (target?.public_id) {
        setRemovedMediaPublicIds((current) =>
          current.includes(target.public_id as string)
            ? current
            : [...current, target.public_id as string]
        );
      }

      return prev.filter((item) => item.id !== mediaId);
    });
  };

  const hasUploadingMedia = useMemo(
    () => mediaItems.some((item) => item.uploading),
    [mediaItems]
  );

  const onSubmit = async (data: EventFormData) => {
    const currentUserId = organizerId ?? ((user as any)?._id ?? (user as any)?.id);
    if (!currentUserId) {
      toast({ title: 'Error', description: 'You must be logged in to create events', variant: 'destructive' });
      return;
    }

    if (hasUploadingMedia) {
      toast({
        title: 'Please wait',
        description: 'Media upload in progress. Please wait for uploads to finish before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const imageUrls = mediaItems
        .filter((item) => item.type === 'image' && item.url)
        .map((item) => item.url as string);

      const videoUrls = mediaItems
        .filter((item) => item.type === 'video' && item.url)
        .map((item) => item.url as string);

      const mediaPayload = mediaItems
        .filter((item) => item.url)
        .map((item) => ({
          url: item.url as string,
          public_id: item.public_id ?? undefined,
          type: item.type,
        }));

      // Combine date and time
      const eventDate = new Date(data.date);
      const [hours, minutes] = data.time.split(':').map((s) => parseInt(s, 10));
      if (!Number.isNaN(hours)) eventDate.setHours(hours, Number.isNaN(minutes) ? 0 : minutes);

      const organizationIdFromUser = (user as any)?.organizationId || (user as any)?.organization_id;

      if ((user as any)?.role === 'organizer' && !organizationIdFromUser) {
        toast({
          title: 'Organization missing',
          description: 'You must be assigned to an organization before creating events.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const payload = {
        title: data.title,
        description: data.description,
        date: eventDate.toISOString(),
        location: data.location,
        venue: data.venue,
        event_type: data.event_type,
        price: data.price ?? 0,
        available_seats: data.available_seats,
        organizer_id: currentUserId,
        popularity_score: event?.popularity_score ?? 0,
        images: imageUrls,
        videos: videoUrls,
        media: mediaPayload,
      };

      if (organizationIdFromUser) {
        (payload as any).organizationId = organizationIdFromUser;
      }

      if (event && mediaItems.length === 0) {
        payload.images = [];
        payload.videos = [];
      }

      if (event && removedMediaPublicIds.length) {
        (payload as any).removedMediaPublicIds = removedMediaPublicIds;
      }

      if (imageUrls.length > 0) {
        (payload as any).image_url = imageUrls[0];
      }

      if (event && event.id) {
        // update (use event.id which should be mapped to Mongo _id by frontend)
        await api.put(`/events/${event.id}`, payload);
      } else {
        await api.post('/events', payload);
      }

      toast({ title: 'Success!', description: `Event ${event ? 'updated' : 'created'} successfully` });
      onClose();
      form.reset();
      setMediaItems([]);
      setRemovedMediaPublicIds([]);
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrlsRef.current.clear();
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
              <Label>Event Media</Label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                    onChange={handleMediaInputChange}
                    disabled={isUploadingMedia}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                  />
                  <div className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP, GIF (max 6MB) or MP4 / WEBM (max 20MB)
                  </div>
                </div>

                {mediaItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-lg border overflow-hidden"
                      >
                        {item.type === 'video' ? (
                          // eslint-disable-next-line jsx-a11y/media-has-caption
                          <video
                            controls
                            className="w-full h-40 object-cover bg-black"
                            src={item.previewUrl}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.previewUrl}
                            alt="Event media preview"
                            className="w-full h-40 object-cover"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(item.id)}
                          className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-black/60 text-white p-1 hover:bg-black"
                          aria-label="Remove media"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {item.uploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>
                    ))}
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
