import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircleIcon } from 'react-native-heroicons/outline';
import { useAuthStore } from '../../stores/auth';
import { showToast } from '../../lib/toast';
import { useAppTheme } from '../../constants/dynamicTheme';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const { forgotPassword, isLoading } = useAuthStore();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPassword(data.email);
      setEmailSent(true);
      showToast.success('Password reset email sent!', 'Success');
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.';
      showToast.error(errorMessage, 'Error');
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <View className="flex-1 justify-center px-6 py-8">
        {/* Logo/Brand */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}>
            <Text className="text-2xl font-bold text-white">TC</Text>
          </View>
          <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
            {emailSent ? 'Check Your Email' : 'Reset Password'}
          </Text>
          <Text className="text-center" style={{ color: theme.colors.muted }}>
            {emailSent 
              ? 'We\'ve sent a password reset link to your email address'
              : 'Enter your email address to reset your password'
            }
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-6 mb-8">
          {emailSent ? (
            <View className="space-y-6">
              <View className="items-center">
                <CheckCircleIcon size={64} color={theme.colors.primary} />
                <Text className="mb-6 text-center mt-4" style={{ color: theme.colors.muted }}>
                  Please check your inbox and follow the instructions to reset your password.
                </Text>
              </View>
              
              <View className="space-y-4">
                <Link href="/auth/login" asChild>
                  <TouchableOpacity className="w-full flex-row items-center justify-center gap-2 px-6 py-4 shadow-sm" style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}>
                    <Text className="text-white font-medium">Back to Sign In</Text>
                  </TouchableOpacity>
                </Link>
                
                <TouchableOpacity
                  onPress={() => setEmailSent(false)}
                  className="w-full py-2"
                >
                  <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>
                    Didn't receive the email? Try again
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View className="mb-8">
                <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                  Email Address
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full px-4 py-3"
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: errors.email ? '#ef4444' : theme.colors.border,
                        color: theme.colors.foreground,
                        backgroundColor: theme.colors.card
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.colors.mutedAlt}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.email && (
                  <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                    {errors.email.message}
                  </Text>
                )}
              </View>

              <View className="mb-6">
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
                      <Text className="text-white font-medium">Sending Reset Link...</Text>
                    </>
                  ) : (
                    <Text className="text-white font-medium">Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="items-center">
                <Link href="/auth/login" asChild>
                  <TouchableOpacity className="py-3">
                    <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>
                      Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="items-center">
          <View className="flex-row">
            <Text className="text-sm" style={{ color: theme.colors.muted }}>
              Remember your password?{' '}
            </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text className="font-medium text-sm" style={{ color: theme.colors.primary }}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}