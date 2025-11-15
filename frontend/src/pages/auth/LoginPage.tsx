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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="/favicon_io/android-chrome-192x192.png" 
              alt="Ploracs Logo" 
              className="w-full h-full object-contain rounded-2xl shadow-sm"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Ploracs account</p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* OTP Login - Show when selected */}
          {loginMethod === 'otp' && (
            <OTPLogin
              onSuccess={handleOTPSuccess}
              onBack={() => setLoginMethod('google')}
            />
          )}

          {/* Primary Login Options - Hide when OTP or password is selected */}
          {loginMethod !== 'otp' && loginMethod !== 'password' && (
            <div className="space-y-6">
              {/* Google Sign In */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-card border border-border rounded-xl text-foreground hover:bg-card-hover transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email OTP Option */}
              <button
                onClick={() => setLoginMethod('otp')}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span>Continue with Email</span>
              </button>

              {/* Password Alternative */}
              <div className="text-center">
                <button
                  onClick={() => setLoginMethod('password')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Continue with password instead
                </button>
              </div>
            </div>
          )}

          {/* Password Login Form - Show when selected */}
          {loginMethod === 'password' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full px-4 pr-16 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:text-primary/80 transition-colors underline"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing in...
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('google')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Back to other options
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}