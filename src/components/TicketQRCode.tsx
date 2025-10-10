import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, QrCode, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TicketQRCodeProps {
  ticketCode: string;
  eventTitle: string;
  eventDate: string;
  eventId: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
}

const TicketQRCode: React.FC<TicketQRCodeProps> = ({
  ticketCode,
  eventTitle,
  eventDate,
  eventId,
  userId,
  size = 'md'
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();

  const sizeMap = {
    sm: 120,
    md: 200,
    lg: 300
  };

  const qrSize = sizeMap[size];

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create a JSON object with ticket information
        const ticketData = {
          ticketCode,
          eventId,
          eventTitle,
          eventDate,
          userId,
          type: 'ticket',
          timestamp: Date.now()
        };

        const qrData = JSON.stringify(ticketData);
        const url = await QRCode.toDataURL(qrData, {
          width: qrSize,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [ticketCode, eventId, eventTitle, eventDate, userId, qrSize]);

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = `ticket-${ticketCode}.png`;
      link.href = qrCodeUrl;
      link.click();
      
      toast({
        title: 'QR Code Downloaded',
        description: 'Your ticket QR code has been saved to your device.',
      });
    }
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCodeUrl) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `ticket-${ticketCode}.png`, { type: 'image/png' });

        await navigator.share({
          title: `Ticket for ${eventTitle}`,
          text: `My ticket QR code for ${eventTitle}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        // Fallback to copying ticket code
        navigator.clipboard.writeText(ticketCode);
        toast({
          title: 'Ticket Code Copied',
          description: 'Ticket code copied to clipboard for sharing.',
        });
      }
    } else {
      // Fallback: copy ticket code to clipboard
      navigator.clipboard.writeText(ticketCode);
      toast({
        title: 'Ticket Code Copied',
        description: 'Ticket code copied to clipboard.',
      });
    }
  };

  if (!qrCodeUrl) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg animate-pulse"
        style={{ width: qrSize, height: qrSize }}
      >
        <QrCode className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <img 
          src={qrCodeUrl} 
          alt={`QR Code for ticket ${ticketCode}`}
          className="rounded-lg border shadow-sm"
          style={{ width: qrSize, height: qrSize }}
        />
      </div>
      
      {size !== 'sm' && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadQRCode}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shareQRCode}
            className="flex items-center gap-1"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketQRCode;