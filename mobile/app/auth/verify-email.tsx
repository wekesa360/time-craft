import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon, ArrowPathIcon, CheckCircleIcon } from 'react-native-heroicons/outline';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../lib/toast';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';

const verifyEmailSchema = z.object({
  otpCode: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers')
});

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

export default function VerifyEmailScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifyEmail, resendVerification, isLoading } = useAuthStore();
  
  const email = params.email || '';
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const {
    control,
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
      router.replace('/auth/register');
    }
  }, [email]);

  const onSubmit = async (data: VerifyEmailForm) => {
    if (!email) {
      showToast.error('Email address is required', 'Error');
      return;
    }

    try {
      await verifyEmail(email, data.otpCode);
      setIsVerified(true);
      showToast.success('Email verified successfully!', 'Success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to verify email';
      showToast.error(errorMessage, 'Verification Failed');
    }
  };

  const handleResend = async () => {
    if (!email) {
      showToast.error('Email address is required', 'Error');
      return;
    }

    try {
      setIsResending(true);
      const response = await resendVerification(email);
      
      if (response) {
        showToast.success('Verification email sent! Please check your inbox.', 'Success');
        // Set countdown timer (15 minutes)
        setTimeRemaining(15 * 60);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to resend verification email';
      showToast.error(errorMessage, 'Error');
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
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
        <View className="flex-1 justify-center px-6 py-8">
          <View className="items-center">
            <View className="w-20 h-20 items-center justify-center mb-6" style={{ backgroundColor: theme.colors.primary + '20', borderRadius: 40 }}>
              <CheckCircleIcon size={48} color={theme.colors.primary} />
            </View>
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
              Email Verified!
            </Text>
            <Text className="text-center mb-8" style={{ color: theme.colors.muted }}>
              Your email has been successfully verified. Redirecting to dashboard...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8" style={{ minHeight: '100%' }}>
          {/* Back button */}
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="flex-row items-center mb-6">
              <ArrowLeftIcon size={20} color={theme.colors.muted} />
              <Text className="ml-2 text-sm" style={{ color: theme.colors.muted }}>Back to Sign In</Text>
            </TouchableOpacity>
          </Link>

          {/* Logo/Brand */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}>
              <Text className="text-3xl">✉️</Text>
            </View>
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
              Verify Your Email
            </Text>
            <Text className="text-center mb-2" style={{ color: theme.colors.muted }}>
              We've sent a verification code to
            </Text>
            <Text className="font-medium mb-6" style={{ color: theme.colors.foreground }}>
              {email}
            </Text>
            <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>
              Please check your inbox and enter the 6-digit code below to verify your email address.
            </Text>
          </View>

          {/* Verification Form */}
          <View className="space-y-6 mb-8">
            <View>
              <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                Verification Code
              </Text>
              <Controller
                control={control}
                name="otpCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="w-full px-4 py-4 text-center"
                    style={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: errors.otpCode ? '#ef4444' : theme.colors.border,
                      color: theme.colors.foreground,
                      backgroundColor: theme.colors.card,
                      fontSize: 24,
                      letterSpacing: 8,
                      fontFamily: 'monospace'
                    }}
                    placeholder="000000"
                    placeholderTextColor={theme.colors.mutedAlt}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="one-time-code"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.otpCode && (
                <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                  {errors.otpCode.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="w-full flex-row items-center justify-center gap-2 px-6 py-4 shadow-sm"
              style={{
                backgroundColor: isLoading ? theme.colors.primaryLight : theme.colors.primary,
                borderRadius: 20
              }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-medium">Verifying...</Text>
                </>
              ) : (
                <Text className="text-white font-medium">Verify Email</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Resend section */}
          <View className="pt-6 border-t" style={{ borderColor: theme.colors.border }}>
            <Text className="text-sm text-center mb-4" style={{ color: theme.colors.muted }}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={isResending || timeRemaining > 0}
              className="w-full flex-row items-center justify-center gap-2 py-4"
              style={{
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card,
                opacity: (isResending || timeRemaining > 0) ? 0.5 : 1
              }}
            >
              {isResending ? (
                <>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text className="font-medium" style={{ color: theme.colors.primary }}>Sending...</Text>
                </>
              ) : timeRemaining > 0 ? (
                <>
                  <ArrowPathIcon size={20} color={theme.colors.muted} />
                  <Text style={{ color: theme.colors.muted }}>
                    Resend in {formatTime(timeRemaining)}
                  </Text>
                </>
              ) : (
                <>
                  <ArrowPathIcon size={20} color={theme.colors.primary} />
                  <Text className="font-medium" style={{ color: theme.colors.primary }}>
                    Resend Verification Email
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Help text */}
          <View className="mt-6">
            <Text className="text-xs text-center" style={{ color: theme.colors.muted }}>
              Make sure to check your spam folder if you don't see the email.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

