import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/auth';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { resetPassword, isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // For reset tokens, we'll validate them when the user submits the form
    // This is more secure and avoids premature validation
    setIsValidToken(true);
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    try {
      await resetPassword(token, data.password);
      setPasswordReset(true);
      toast.success('Password reset successfully!');
    } catch (error) {
      console.error('Reset password error:', error);

      // Extract error message from API response
      let errorMessage = 'Failed to reset password. Please try again.';

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Handle specific error cases
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') ||
          errorMessage.includes('token') || errorMessage.includes('reset')) {
        setIsValidToken(false);
        toast.error('Reset link is invalid or has expired. Please request a new one.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (isValidToken === false) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-light dark:bg-error">
            <svg className="h-6 w-6 text-error dark:text-error-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
          Invalid Reset Link
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="btn btn-primary"
        >
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-light dark:bg-success">
            <svg className="h-6 w-6 text-success dark:text-success-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-4">
          Password Reset Successfully
        </h2>
        <Link
          to="/login"
          className="btn btn-primary"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (isValidToken === null) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground dark:text-muted-foreground">Validating reset token...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
          Reset your password
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={`input ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-error dark:text-error-light">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-1">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={`input ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-error dark:text-error-light">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Password strength indicator */}
        {password && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Password strength:</div>
            <div className="flex space-x-1">
              {[
                password.length >= 8,
                /[A-Z]/.test(password),
                /[a-z]/.test(password),
                /[0-9]/.test(password),
                /[^A-Za-z0-9]/.test(password)
              ].map((condition, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded ${
                    condition ? 'bg-success-light0' : 'bg-muted dark:bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
