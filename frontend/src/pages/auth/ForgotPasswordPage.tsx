import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword, isLoading } = useAuthStore();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset email. Please try again.');
    }
  };

  if (emailSent) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Check your email
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
        </p>
        <div className="space-y-4">
          <Link
            to="/login"
            className="w-full btn btn-primary"
          >
            Back to Login
          </Link>
          <button
            onClick={() => setEmailSent(false)}
            className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Didn't receive the email? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="Enter your email"
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
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