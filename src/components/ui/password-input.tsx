import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { usePasswordSecurity } from '../../hooks/usePasswordSecurity';
import { cn } from '../../lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrengthIndicator?: boolean;
  checkBreach?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = true, checkBreach = true, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const { checkPasswordBreach, validatePasswordStrength, checkResult } = usePasswordSecurity();

    const handlePasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPassword = e.target.value;
      setPassword(newPassword);
      
      if (checkBreach && newPassword.length >= 4) {
        // Debounce breach check
        setTimeout(() => {
          checkPasswordBreach(newPassword);
        }, 500);
      }
      
      if (onChange) {
        onChange(e);
      }
    };

    const strengthValidation = validatePasswordStrength(password);

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'pr-10',
              checkResult.isBreached && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            value={password}
            onChange={handlePasswordChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {showStrengthIndicator && password && (
          <div className="space-y-2">
            {/* Strength bar */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    level <= strengthValidation.score
                      ? level <= 2
                        ? 'bg-red-500'
                        : level <= 3
                        ? 'bg-yellow-500'
                        : level <= 4
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
            
            {/* Feedback */}
            <div className="flex items-center gap-2 text-xs">
              {checkResult.isBreached ? (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Found in {checkResult.breachCount?.toLocaleString()} breaches
                </div>
              ) : checkResult.isLoading ? (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  Checking security...
                </div>
              ) : strengthValidation.score >= 4 ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Shield className="h-3 w-3" />
                  Secure password
                </div>
              ) : (
                <span className={cn(
                  strengthValidation.score <= 2 ? 'text-red-500' : 'text-yellow-500'
                )}>
                  {strengthValidation.feedback}
                </span>
              )}
            </div>

            {/* Requirements */}
            {strengthValidation.score < 4 && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Password should include:</div>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  {!strengthValidation.requirements.minLength && (
                    <li>At least 8 characters</li>
                  )}
                  {!strengthValidation.requirements.hasUppercase && (
                    <li>One uppercase letter</li>
                  )}
                  {!strengthValidation.requirements.hasLowercase && (
                    <li>One lowercase letter</li>
                  )}
                  {!strengthValidation.requirements.hasNumbers && (
                    <li>One number</li>
                  )}
                  {!strengthValidation.requirements.hasSpecialChar && (
                    <li>One special character</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };