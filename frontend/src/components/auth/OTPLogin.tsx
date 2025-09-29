import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api';

interface OTPLoginProps {
  onSuccess: (user: any, tokens: any) => void;
  onBack: () => void;
}

export const OTPLogin: React.FC<OTPLoginProps> = ({ onSuccess, onBack }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [otpId, setOtpId] = useState('');

  // Timer for OTP expiration
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStep('email');
            setOtpCode('');
            toast.error('OTP expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerifyOTP();
    }
  }, [otpCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.sendOTP(email);

      if (data.success) {
        setOtpId(data.data.otpId);
        setStep('otp');
        setTimeRemaining(Math.floor((data.data.expiresAt - Date.now()) / 1000));
        toast.success('OTP sent to your email!');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.verifyOTP(email, otpCode);

      if (data.success) {
        toast.success('Login successful!');
        onSuccess(data.data.user, {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken
        });
      } else {
        toast.error(data.error || 'Invalid OTP code');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeRemaining > 0) {
      toast.error(`Please wait ${formatTime(timeRemaining)} before requesting a new code`);
      return;
    }
    await handleSendOTP(new Event('submit') as any);
  };

  const handleDigitChange = (index: number, value: string) => {
    const newOtpCode = otpCode.split('');
    newOtpCode[index] = value;
    const updatedCode = newOtpCode.join('');
    setOtpCode(updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      setOtpCode(pastedData);
      // Focus the last input after pasting
      const lastInput = document.getElementById(`otp-5`);
      lastInput?.focus();
    } else if (pastedData.length > 0) {
      // If partial paste, fill what we can
      const newOtpCode = otpCode.split('');
      for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
        newOtpCode[i] = pastedData[i];
      }
      setOtpCode(newOtpCode.join(''));
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = Math.min(pastedData.length, 5);
      const nextInput = document.getElementById(`otp-${nextEmptyIndex}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="space-y-6">

      {/* Email Step */}
      {step === 'email' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="Enter your email address"
              required
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Code'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to other options
          </button>
        </form>
      )}

      {/* OTP Step */}
      {step === 'otp' && (
        <div className="space-y-4">
          <div>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  value={otpCode[index] || ''}
                  onChange={(e) => handleDigitChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              You can paste the entire code at once
            </p>
          </div>

          {/* Timer */}
          {timeRemaining > 0 && (
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              <span>Code expires in {formatTime(timeRemaining)}</span>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              <span>Verifying...</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={timeRemaining > 0}
              className="btn btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtpCode('');
                setTimeRemaining(0);
              }}
              className="btn btn-secondary flex-1"
            >
              Change Email
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to other options
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Didn't receive the code? Check your spam folder or try resending.</p>
      </div>
    </div>
  );
};
