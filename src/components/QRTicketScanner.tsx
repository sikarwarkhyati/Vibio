import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  eventId?: string;
}

interface ScannedTicket {
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  userId?: string;
  type: string;
  timestamp: number;
}

interface TicketValidation {
  isValid: boolean;
  ticket?: any;
  booking?: any;
  event?: any;
  error?: string;
}

const QRTicketScanner: React.FC<QRScannerProps> = ({ open, onClose, eventId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedTicket | null>(null);
  const [validationResult, setValidationResult] = useState<TicketValidation | null>(null);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && !scannerRef.current && videoRef.current) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [open]);

  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => handleScanResult(result.data),
        {
          onDecodeError: (err) => {
            // Silent error handling for continuous scanning
            console.log('Scan error:', err);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      scannerRef.current = scanner;
      await scanner.start();
      setIsScanning(true);
      setError('');
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Camera access denied or not available');
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const handleScanResult = async (data: string) => {
    try {
      const parsedData: ScannedTicket = JSON.parse(data);
      
      if (parsedData.type !== 'ticket') {
        setError('Invalid QR code. This is not a valid ticket.');
        return;
      }

      setScanResult(parsedData);
      setIsScanning(false);
      if (scannerRef.current) {
        scannerRef.current.stop();
      }

      // Validate the ticket
      await validateTicket(parsedData);
    } catch (err) {
      setError('Invalid QR code format');
      console.error('QR scan error:', err);
    }
  };

  const validateTicket = async (ticket: ScannedTicket) => {
    try {
      // Check if the ticket exists in the database
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          event:events (
            id,
            title,
            date,
            location,
            venue,
            organizer_id
          )
        `)
        .eq('ticket_code', ticket.ticketCode)
        .maybeSingle();

      if (bookingError) {
        throw bookingError;
      }

      if (!booking) {
        setValidationResult({
          isValid: false,
          error: 'Ticket not found in database'
        });
        return;
      }

      // Check if the event matches (if eventId is provided)
      if (eventId && booking.event.id !== eventId) {
        setValidationResult({
          isValid: false,
          error: 'This ticket is not valid for the current event'
        });
        return;
      }

      // Check ticket status
      if (booking.status === 'cancelled') {
        setValidationResult({
          isValid: false,
          error: 'This ticket has been cancelled'
        });
        return;
      }

      // Check if event date has passed (optional validation)
      const eventDate = new Date(booking.event.date);
      const now = new Date();
      if (eventDate < now) {
        // Event has passed, but ticket might still be valid for entry
        // You can customize this logic based on your requirements
      }

      setValidationResult({
        isValid: true,
        ticket,
        booking,
        event: booking.event
      });

      toast({
        title: 'Valid Ticket!',
        description: `Ticket verified for ${booking.event.title}`,
      });
    } catch (error) {
      console.error('Ticket validation error:', error);
      setValidationResult({
        isValid: false,
        error: 'Error validating ticket. Please try again.'
      });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setValidationResult(null);
    setError('');
    if (videoRef.current && !isScanning) {
      initializeScanner();
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanResult(null);
    setValidationResult(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Ticket QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          {!scanResult && (
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 object-cover rounded-lg bg-black"
                    style={{ transform: 'scaleX(-1)' }} // Mirror the video
                  />
                  {!isScanning && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <Button onClick={initializeScanner}>
                        <Camera className="h-4 w-4 mr-2" />
                        Start Scanning
                      </Button>
                    </div>
                  )}
                  {isScanning && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Scanning...
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Scan Result */}
          {scanResult && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Valid Ticket
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Invalid Ticket
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {validationResult.isValid && validationResult.booking ? (
                  <div className="space-y-2">
                    <div>
                      <strong>Event:</strong> {validationResult.event.title}
                    </div>
                    <div>
                      <strong>Date:</strong> {format(new Date(validationResult.event.date), 'PPP p')}
                    </div>
                    <div>
                      <strong>Location:</strong> {validationResult.event.venue || validationResult.event.location}
                    </div>
                    <div>
                      <strong>Ticket Code:</strong> {validationResult.booking.ticket_code}
                    </div>
                    <div>
                      <strong>Status:</strong> 
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                        {validationResult.booking.status}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validationResult.error || 'Unknown validation error'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={resetScanner} variant="outline" className="flex-1">
                    Scan Another
                  </Button>
                  <Button onClick={handleClose} className="flex-1">
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!scanResult && !error && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Position the QR code within the camera frame. The scanner will automatically detect and validate the ticket.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRTicketScanner;