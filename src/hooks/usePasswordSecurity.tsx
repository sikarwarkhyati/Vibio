// src/hooks/usePasswordSecurity.tsx
import { useState } from 'react';
import { useToast } from './use-toast';

interface PasswordCheckResult {
  isBreached: boolean;
  breachCount?: number;
  isLoading: boolean;
  error?: string;
}

export const usePasswordSecurity = () => {
  const [checkResult, setCheckResult] = useState<PasswordCheckResult>({ isBreached: false, isLoading: false });
  const { toast } = useToast();

  const checkPasswordBreach = async (password: string): Promise<boolean> => {
    if (!password || password.length < 4) {
      return false;
    }

    setCheckResult({ isBreached: false, isLoading: true });

    try {
      // Create SHA-1 hash
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      // Get first 5 characters for k-anonymity
      const prefix = hashHex.slice(0, 5);
      const suffix = hashHex.slice(5);

      // Query HaveIBeenPwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      
      if (!response.ok) {
        throw new Error('Failed to check password security');
      }

      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          const breachCount = parseInt(count, 10);
          setCheckResult({ 
            isBreached: true, 
            breachCount, 
            isLoading: false 
          });
          
          toast({
            title: "Password Security Warning",
            description: `This password has been found in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`,
            variant: "destructive",
          });
          
          return true;
        }
      }

      setCheckResult({ isBreached: false, isLoading: false });
      return false;
    } catch (error) {
      console.error('Password breach check failed:', error);
      setCheckResult({ 
        isBreached: false, 
        isLoading: false, 
        error: 'Unable to verify password security' 
      });
      return false;
    }
  };

  const validatePasswordStrength = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isStrong = score >= 4;

    return {
      requirements,
      score,
      isStrong,
      feedback: getPasswordFeedback(requirements, score)
    };
  };

  const getPasswordFeedback = (requirements: any, score: number) => {
    if (score < 2) return "Very weak password";
    if (score < 3) return "Weak password";
    if (score < 4) return "Moderate password";
    if (score < 5) return "Strong password";
    return "Very strong password";
  };

  return {
    checkPasswordBreach,
    validatePasswordStrength,
    checkResult,
    isSecure: !checkResult.isBreached && !checkResult.isLoading
  };
};