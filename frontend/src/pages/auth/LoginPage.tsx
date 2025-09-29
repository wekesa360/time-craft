import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../../stores/auth';
import { OTPLogin } from '../../components/auth/OTPLogin';
import { apiClient } from '../../lib/api';
import type { LoginForm } from '../../types';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'password' | 'otp'>('google');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      console.log('Starting login process...');
      await login(data);
      console.log('Login successful, navigating to dashboard...');

      // Check authentication state after login
      const { isAuthenticated, user } = useAuthStore.getState();
      console.log('Auth state after login:', { isAuthenticated, user: user?.email });

      toast.success(t('auth.login') + ' successful!');

      // Navigation will be handled by the PublicRoute component
      // when isAuthenticated becomes true
    } catch (error) {
      console.error('Login failed:', error);
      // Extract error message from API response
      let errorMessage = 'Login failed. Please check your credentials.';

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

      toast.error(errorMessage);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google login failed:', error);
      // Extract error message from API response
      let errorMessage = 'Google login failed. Please try again.';

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

      toast.error(errorMessage);
    }
  };

  const handleOTPSuccess = async (user: any, tokens: any) => {
    try {
      console.log('OTP login success - user:', user);
      console.log('OTP login success - tokens:', tokens);
      
      // Update auth store (this will properly set tokens and update API client)
      useAuthStore.getState().setUser(user);
      useAuthStore.getState().setTokens(tokens);
      
      // Manually ensure tokens are persisted as backup (similar to regular login)
      try {
        const authState = {
          state: {
            user: user,
            tokens: tokens,
            isAuthenticated: true,
            isLoading: false,
          },
          version: 0,
        };
        localStorage.setItem('timecraft-auth', JSON.stringify(authState));
        console.log('Manually saved auth state to localStorage');
      } catch (error) {
        console.error('Failed to manually save auth state:', error);
      }
      
      // Check if store was updated
      const authState = useAuthStore.getState();
      console.log('Auth state after OTP login:', {
        user: authState.user,
        tokens: authState.tokens,
        isAuthenticated: authState.isAuthenticated
      });
      
      // Check localStorage
      const authData = localStorage.getItem('timecraft-auth');
      console.log('localStorage after OTP login:', authData);
      
      // Connect to SSE after successful login
      apiClient.connectSSE();
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('OTP login success handler failed:', error);
      toast.error('Login successful but failed to save session. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('auth.signInToContinue')}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('auth.dontHaveAccount')}{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            {t('auth.register')}
          </Link>
        </p>
      </div>

      {/* OTP Login - Show when selected */}
      {loginMethod === 'otp' && (
        <OTPLogin
          onSuccess={handleOTPSuccess}
          onBack={() => setLoginMethod('google')}
        />
      )}

      {/* Primary Login Options - Hide when OTP or password is selected */}
      {loginMethod !== 'otp' && loginMethod !== 'password' && (
        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
            </div>
          </div>

          {/* Email OTP Option */}
          <button
            onClick={() => setLoginMethod('otp')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Continue with Email
          </button>

          {/* Password Alternative */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <span>Continue with </span>
            <button
              onClick={() => setLoginMethod('password')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline"
            >
              password
            </button>
            <span> instead!</span>
          </div>
        </div>
      )}

      {/* Password Login Form - Show when selected */}
      {loginMethod === 'password' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`btn btn-primary w-full flex items-center justify-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('common.loading')}
            </>
          ) : (
                t('auth.login')
          )}
        </button>

        <button
          type="button"
          onClick={() => setLoginMethod('google')}
          className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center justify-center gap-2 mt-4"
        >
          ← Back to other options
        </button>
      </form>
      )}
    </div>
  );
}