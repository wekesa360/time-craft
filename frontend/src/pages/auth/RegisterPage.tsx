import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../../stores/auth';
import type { RegisterForm } from '../../types';

// Validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  isStudent: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});



export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      isStudent: false,
    },
  });

  const password = watch('password');

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      score,
      label: labels[Math.min(score - 1, 4)] || '',
      color: colors[Math.min(score - 1, 4)] || 'bg-gray-300',
    };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      toast.success('Account created successfully! Welcome!');
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the API client and toast is shown there
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('auth.createYourAccount')}
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            {t('auth.login')}
          </Link>
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.firstName')}
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={`input ${errors.firstName ? 'border-red-300 focus:ring-red-500' : ''}`}
              {...register('firstName')}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.lastName')}
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={`input ${errors.lastName ? 'border-red-300 focus:ring-red-500' : ''}`}
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
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

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>One uppercase letter</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>One lowercase letter</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${/\d/.test(password) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span>One number</span>
                </div>
              </div>
            </div>
          )}
          
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>


        {/* Student Checkbox */}
        <div className="flex items-center">
          <input
            id="isStudent"
            type="checkbox"
            className="h-3 w-3 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            {...register('isStudent')}
          />
          <label htmlFor="isStudent" className="ml-1.5 block text-sm text-gray-700 dark:text-gray-300">
            {t('auth.isStudent')}
          </label>
        </div>

        {/* Submit Button */}
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
            t('auth.createAccount')
          )}
        </button>
      </form>

      {/* Terms Notice */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        By creating an account, you agree to our{' '}
        <Link to="/terms" className="text-primary-600 hover:text-primary-500">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}