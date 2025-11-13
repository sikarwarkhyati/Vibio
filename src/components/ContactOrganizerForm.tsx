// src/components/ContactOrganizerForm.tsx
import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Mail, MessageCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../lib/api';

interface ContactOrganizerFormProps {
  organizerId?: string;
  organizerName?: string;
  eventTitle: string;
}

const ContactOrganizerForm: React.FC<ContactOrganizerFormProps> = ({
  organizerId,
  organizerName,
  eventTitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // safer default so UI can still show even if we can't fetch contact info
  const [organizerData, setOrganizerData] = useState<{
    name: string;
    email: string;
  } | null>({ name: organizerName || 'Event Organizer', email: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

  // call backend to get organizer public info (if we have an organizerId)
  const fetchOrganizerData = async () => {
    if (!organizerId) return;
    try {
      const res = await api.get(`/organizers/${organizerId}/contact-info`);
      const data = res.data ?? {};
      setOrganizerData({
        name: data.name || data.org_name || organizerName || 'Event Organizer',
        email: data.contact_email || data.email || '',
      });
    } catch (error) {
      console.error('Error fetching organizer data:', error);
      toast({
        title: 'Note',
        description:
          "Couldn't load organizer contact info, but you can still send a message.",
      });
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && organizerData?.email === '' && organizerId) {
      // only fetch once if we think there's missing info
      fetchOrganizerData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      toast({
        title: 'CAPTCHA Required',
        description: 'Please complete the CAPTCHA verification.',
        variant: 'destructive',
      });
      return;
    }

    if (!organizerData) {
      toast({
        title: 'Error',
        description: 'Organizer information not loaded.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        organizerId: organizerId || null,
        organizerName: organizerData.name,
        organizerEmail: organizerData.email,
        eventTitle,
        senderName: formData.name,
        senderEmail: formData.email,
        subject: formData.subject,
        message: formData.message,
        captchaToken,
      };

      const response = await api.post('/contact/organizer', payload).catch((err) => {
        // swallow backend 404 etc and show nice toast
        throw err;
      });

      if (response?.data?.error) {
        throw new Error(
          response.data.error.message || 'Message failed to send on backend.'
        );
      }

      toast({
        title: 'Message Sent',
        description:
          'Your message has been sent to the organizer. They will respond directly to your email.',
      });

      // reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      {/* IMPORTANT: We no longer accept {children}. We define the trigger button here.
         This guarantees DialogTrigger gets EXACTLY ONE child.
      */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          Contact Organizer
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contact Organizer
          </DialogTitle>
          <DialogDescription>
            Send a message to{' '}
            {organizerData?.name || organizerName || 'the organizer'} about "
            {eventTitle}"
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your Name</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Your Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  type="text"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // test key
                  onChange={(token) => setCaptchaToken(token)}
                  theme="light"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !captchaToken}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Send Message
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ContactOrganizerForm;
