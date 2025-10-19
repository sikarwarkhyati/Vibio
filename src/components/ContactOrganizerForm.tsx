// src/components/ContactOrganizerForm.tsx
import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { useToast } from '../hooks/use-toast';
import { Mail, MessageCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

// DELETE: import { supabase } from '@/integrations/supabase/client';
// FIX 1: Import the central API helper
import api from '../lib/api'; 

interface ContactOrganizerFormProps {
  organizerId: string;
  organizerName?: string;
  eventTitle: string;
  children: React.ReactNode;
}

const ContactOrganizerForm: React.FC<ContactOrganizerFormProps> = ({
  organizerId,
  organizerName,
  eventTitle,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // FIX 2: Define organizerData with expected fields from your Node backend
  const [organizerData, setOrganizerData] = useState<{ name: string; email: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

  // Fetch organizer details when dialog opens
  const fetchOrganizerData = async () => {
    try {
      // FIX 3: Replace Supabase fetch with Axios call to Node backend
      // We assume a GET endpoint exists to fetch an organizer's public contact info by ID.
      const res = await api.get(`/organizer/${organizerId}/contact-info`); 
      const data = res.data; // Assuming data contains { name, email }

      // FIX 4: Map backend fields to the component's state fields
      setOrganizerData({ 
        name: data.name || data.org_name, // Use name or org_name
        email: data.contact_email || data.email,
      });
    } catch (error) {
      console.error('Error fetching organizer data:', error);
      toast({
        title: "Error",
        description: "Could not load organizer information.",
        variant: "destructive",
      });
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setIsOpen(open);
    // Only fetch data if the dialog is opening and data isn't loaded
    if (open && !organizerData) {
      fetchOrganizerData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }

    if (!organizerData) {
      toast({
        title: "Error",
        description: "Organizer information not loaded.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // FIX 5: Replace Supabase Functions invoke with Axios POST to your custom backend endpoint
      // We assume a POST endpoint exists at /contact to handle mail sending via Node.
      const payload = {
        organizerId,
        organizerName: organizerName || organizerData.name,
        organizerEmail: organizerData.email,
        eventTitle,
        senderName: formData.name,
        senderEmail: formData.email,
        subject: formData.subject,
        message: formData.message,
        captchaToken, // Include token for backend validation
      };

      // Target custom backend route (e.g., /contact or /email/contact)
      const response = await api.post('/contact/organizer', payload); 

      // Check for success (Axios throws on 4xx/5xx, so we only check for a custom error response)
      if (response.data.error) {
        throw new Error(response.data.error.message || "Message failed to send on backend.");
      }
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent to the organizer. They will respond directly to your email.",
      });
      
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Contact Organizer
          </DialogTitle>
          <DialogDescription>
            Send a message to {organizerName || organizerData?.name || 'the organizer'} about "{eventTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - replace with real key
                  onChange={handleCaptchaChange}
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