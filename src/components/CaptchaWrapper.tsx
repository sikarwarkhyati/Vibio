import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaWrapperProps {
  onVerify: (token: string | null) => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

export interface CaptchaWrapperRef {
  reset: () => void;
  execute: () => void;
}

const CaptchaWrapper = forwardRef<CaptchaWrapperRef, CaptchaWrapperProps>(
  ({ onVerify, theme = 'light', size = 'normal' }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    
    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      execute: () => {
        recaptchaRef.current?.execute();
      }
    }));

    return (
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - replace with real key
        onChange={onVerify}
        theme={theme}
        size={size}
      />
    );
  }
);

CaptchaWrapper.displayName = 'CaptchaWrapper';

export default CaptchaWrapper;