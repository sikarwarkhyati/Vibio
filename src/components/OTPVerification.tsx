// src/components/OTPVerification.tsx
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';
import { Clock, RefreshCw } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  type: 'signup' | 'recovery';
  onVerified: () => void;
  onCancel: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  type,
  onVerified,
  onCancel
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit verification code.',
        variant: 'destructive'
      });
      return;
    }

    if (isExpired) {
      toast({
        title: 'OTP Expired',
        description: 'This verification code has expired. Please request a new one.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // POST to backend verify endpoint - adjust route if your API differs
      const res = await api.post('/auth/verify-otp', {
        email,
        token: otp,
        type
      });

      // handle backend response - accept success flags or 200 status
      const success = res.data?.success ?? res.status === 200;
      if (success) {
        toast({
          title: 'Verification Successful',
          description: 'Your account has been verified successfully.'
        });
        onVerified();
      } else {
        // treat as failure if backend returns success=false
        setIsExpired(true);
        setTimeLeft(0);
        toast({
          title: 'Verification Failed',
          description: res.data?.message || 'Verification failed. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      // mark expired to prevent repeated attempts if desired
      setIsExpired(true);
      setTimeLeft(0);

      const msg = err.response?.data?.message || err.message || 'An unexpected error occurred during verification.';
      toast({
        title: 'Verification Failed',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      // POST to backend resend endpoint - adjust route if your API differs
      const res = await api.post('/auth/resend-otp', {
        email,
        type
      });

      const success = res.data?.success ?? res.status === 200;
      if (success) {
        setTimeLeft(300); // reset timer to 5 minutes
        setIsExpired(false);
        setOtp('');
        toast({
          title: 'OTP Resent',
          description: 'A new verification code has been sent to your email.'
        });
      } else {
        toast({
          title: 'Resend Failed',
          description: res.data?.message || 'Failed to resend OTP.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend verification code.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to<br />
          <strong>{email}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={isExpired}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {isExpired ? (
              <span className="text-destructive">Code expired</span>
            ) : (
              <span>Expires in {formatTime(timeLeft)}</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleVerifyOTP}
            className="w-full"
            disabled={isLoading || otp.length !== 6 || isExpired}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </Button>

          {isExpired && (
            <Button
              variant="outline"
              onClick={handleResendOTP}
              className="w-full"
              disabled={isResending}
            >
              {isResending ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Resending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Resend Code
                </div>
              )}
            </Button>
          )}

          <Button variant="ghost" onClick={onCancel} className="w-full">
            Back to Sign In
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Didn't receive the code? Check your spam folder or click resend after the timer expires.
        </div>
      </CardContent>
    </Card>
  );
};

export default OTPVerification;
