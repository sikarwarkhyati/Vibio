import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageCircle } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

import { supabase } from '@/integrations/supabase/client';

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
  const [organizerData, setOrganizerData] = useState<any>(null);
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
      const { data, error } = await supabase
        .from('organizers')
        .select('org_name, contact_email')
        .eq('id', organizerId)
        .single();

      if (error) {
        throw error;
      }

      setOrganizerData(data);
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
      const response = await supabase.functions.invoke('contact-organizer', {
        body: {
          organizerId,
          organizerName: organizerName || organizerData.org_name,
          organizerEmail: organizerData.contact_email,
          eventTitle,
          senderName: formData.name,
          senderEmail: formData.email,
          subject: formData.subject,
          message: formData.message
        }
      });

      if (response.error) {
        throw response.error;
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
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
            Send a message to {organizerName || organizerData?.org_name || 'the organizer'} about "{eventTitle}"
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