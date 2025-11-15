import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../../stores/auth';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

const verifyEmailSchema = z.object({
  otpCode: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
});

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification, isLoading } = useAuthStore();
  
  // Get email from location state or query params
  const email = (location.state?.email as string) || new URLSearchParams(location.search).get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema)
  });

  const otpCode = watch('otpCode');

  // Auto-format OTP input (6 digits)
  useEffect(() => {
    if (otpCode && otpCode.length > 6) {
      setValue('otpCode', otpCode.slice(0, 6));
    }
  }, [otpCode, setValue]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/auth/register');
    }
  }, [email, navigate]);

  const onSubmit = async (data: VerifyEmailForm) => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    try {
      await verifyEmail(email, data.otpCode);
      setIsVerified(true);
      toast.success('Email verified successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to verify email';
      toast.error(errorMessage);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    try {
      setIsResending(true);
      const response = await resendVerification(email);
      
      if (response) {
        toast.success('Verification email sent! Please check your inbox.');
        // Set countdown timer (15 minutes)
        setTimeRemaining(15 * 60);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to resend verification email';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-success/20 p-4">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Email Verified!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your email has been successfully verified. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          to="/auth/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        {/* Main content */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/20 p-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Verify Your Email
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-center mb-2">
            We've sent a verification code to
          </p>
          <p className="text-foreground font-medium text-center mb-6">
            {email}
          </p>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Please check your inbox and enter the 6-digit code below to verify your email address.
          </p>

          {/* Verification Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="otpCode" className="block text-sm font-medium text-foreground mb-2">
                Verification Code
              </label>
              <input
                id="otpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                className={`w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground text-center text-2xl tracking-widest font-mono ${
                  errors.otpCode ? 'border-error focus:ring-error' : ''
                }`}
                {...register('otpCode')}
              />
              {errors.otpCode && (
                <p className="mt-2 text-sm text-error">
                  {errors.otpCode.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          {/* Resend section */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending || timeRemaining > 0}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : timeRemaining > 0 ? (
                `Resend in ${formatTime(timeRemaining)}`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>
          </div>

          {/* Help text */}
          <p className="mt-6 text-xs text-muted-foreground text-center">
            Make sure to check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
    </div>
  );
}

