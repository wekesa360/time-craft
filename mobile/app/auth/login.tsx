import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { EyeIcon, EyeSlashIcon } from 'react-native-heroicons/outline';
import GoogleIcon from '../../components/icons/GoogleIcon';
import OTPLogin from '../../components/auth/OTPLogin';
import { showToast, showConnectionTest } from '../../lib/toast';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const { login, loginWithGoogle, loginWithBiometric, isLoading, biometricEnabled, biometricAvailable, biometricCapabilities, initializeBiometric, testConnection } = useAuthStore();
  const [showBiometric, setShowBiometric] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'password' | 'otp'>('google');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const checkBiometric = async () => {
      await initializeBiometric();
      setShowBiometric(biometricEnabled && biometricAvailable);
    };
    checkBiometric();
  }, [initializeBiometric, biometricEnabled, biometricAvailable]);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      showToast.success('Welcome back!', 'Login Successful');
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      // Check if error is due to unverified email
      if (error.requiresVerification && error.email) {
        // Redirect to verification page instead of showing toast
        router.push({
          pathname: '/auth/verify-email',
          params: { email: error.email }
        });
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
      showToast.error(errorMessage, 'Login Failed');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      showToast.success('Welcome!', 'Login Successful');
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      showToast.warning(errorMessage, 'Google Sign-In Not Available');
      setLoginMethod('otp');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setBiometricLoading(true);
      await loginWithBiometric();
      showToast.success('Welcome back!', 'Biometric Login Successful');
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again or use your password.';
      showToast.error(errorMessage, 'Biometric Login Failed');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleOTPSuccess = async (user: any, tokens: any) => {
    try {
      // Update auth store directly with the tokens from OTP
      const authStore = useAuthStore.getState();
      authStore.setUser(user);
      authStore.setTokens(tokens);
      
      showToast.success('Welcome!', 'Login Successful');
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      showToast.error('Please try again.', 'Login Failed');
    }
  };

  const getBiometricIcon = () => {
    if (!biometricCapabilities?.supportedTypes.length) return '🔒';
    
    const types = biometricCapabilities.supportedTypes;
    if (types.includes(2)) return '👤'; // Face ID
    if (types.includes(1)) return '👆'; // Touch ID/Fingerprint
    if (types.includes(3)) return '👁️'; // Iris
    return '🔒';
  };

  const getBiometricText = () => {
    if (!biometricCapabilities?.supportedTypes.length) return 'Biometric';
    
    const types = biometricCapabilities.supportedTypes;
    if (types.includes(2)) return 'Face ID';
    if (types.includes(1)) return 'Touch ID';
    if (types.includes(3)) return 'Iris';
    return 'Biometric';
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8" style={{ minHeight: '100%' }}>
          {/* Logo/Brand */
          }
          <View className="items-center mb-10">
            <View className="w-16 h-16 items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}>
              <Text className="text-2xl font-bold text-white">TC</Text>
            </View>
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>{t('welcome_back')}</Text>
            <Text className="text-center" style={{ color: theme.colors.muted }}>{t('sign_in_to_account')}</Text>
          </View>

          {/* Login Options */}
          <View className="space-y-6 mb-8">
          {/* OTP Login - Show when selected */}
          {loginMethod === 'otp' && (
            <OTPLogin
              onSuccess={handleOTPSuccess}
              onBack={() => setLoginMethod('google')}
            />
          )}

          {/* Primary Login Options - Show when not in password or OTP mode */}
          {loginMethod !== 'password' && loginMethod !== 'otp' && (
            <View className="space-y-5">
              {/* Google Sign In */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={isLoading || googleLoading}
                className="w-full flex-row items-center justify-center py-4 px-6 shadow-sm"
                style={{ borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, opacity: (isLoading || googleLoading) ? 0.7 : 1 }}
              >
                {googleLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text className="ml-2 font-medium" style={{ color: theme.colors.foreground }}>{t('signing_in')}</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <View className="mr-3">
                      <GoogleIcon size={20} />
                    </View>
                    <Text className="font-medium" style={{ color: theme.colors.foreground }}>{t('continue_with_google')}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.border }} />
                <Text className="px-4 text-sm" style={{ color: theme.colors.muted, backgroundColor: theme.colors.card }}>{t('or')}</Text>
                <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.border }} />
              </View>

              {/* Email OTP Option */}
              <TouchableOpacity
                onPress={() => setLoginMethod('otp')}
                className="w-full py-4 px-6 shadow-sm"
                style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}
                disabled={isLoading}
              >
                <Text className="text-white font-medium text-center">{t('continue_with_email')}</Text>
              </TouchableOpacity>

              {/* Biometric Login Option */}
              {showBiometric && (
                <TouchableOpacity
                  className="w-full py-4 px-6 flex-row items-center justify-center bg-white"
                  style={{ borderRadius: 20, borderWidth: 2, borderColor: theme.colors.primaryLight, backgroundColor: theme.colors.card, opacity: (isLoading || biometricLoading) ? 0.7 : 1 }}
                  onPress={handleBiometricLogin}
                  disabled={isLoading || biometricLoading}
                >
                  {biometricLoading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text className="ml-2 font-medium" style={{ color: theme.colors.primary }}>{t('signing_in')}</Text>
                    </View>
                  ) : (
                    <>
                      <Text className="text-2xl mr-3">{getBiometricIcon()}</Text>
                      <Text className="font-medium" style={{ color: theme.colors.primary }}>
                        {t('sign_in')} {t('with') || ''} {getBiometricText()}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Password Alternative */}
              <View className="items-center mt-4">
                <TouchableOpacity
                  onPress={() => setLoginMethod('password')}
                  className="py-3"
                >
                  <Text className="text-sm" style={{ color: theme.colors.muted }}>{t('continue_with_password_instead')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Password Login Form - Show when selected */}
          {loginMethod === 'password' && (
            <View>
              <View className="mb-5">
                <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>{t('email_address')}</Text>
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
                      placeholder={t('email_address')}
                      placeholderTextColor={theme.colors.mutedAlt}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
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
                <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>{t('password')}</Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="w-full px-4 pr-16 py-3"
                        style={{
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: errors.password ? '#ef4444' : theme.colors.border,
                          color: theme.colors.foreground,
                          backgroundColor: theme.colors.card
                        }}
                        placeholder={t('password')}
                        placeholderTextColor={theme.colors.mutedAlt}
                        secureTextEntry={!showPassword}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <TouchableOpacity
                    className="absolute right-3"
                    style={{ top: 12 }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text className="text-sm underline" style={{ color: theme.colors.primary }}>
                      {showPassword ? t('hide') : t('show')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                    {errors.password.message}
                  </Text>
                )}
                
                {/* Forgot Password Link - moved inside password field container */}
                <View className="items-end mt-4 mb-3">
                  <Link href="/auth/forgot-password" asChild>
                    <TouchableOpacity>
                      <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>{t('forgot_password')}</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
              
              <TouchableOpacity 
                className="w-full flex-row items-center justify-center gap-2 px-6 py-4 shadow-sm"
                style={{ 
                  backgroundColor: isLoading ? theme.colors.primaryLight : theme.colors.primary,
                  borderRadius: 20
                }}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-medium">{t('signing_in')}</Text>
                </>
              ) : (
                <Text className="text-white font-medium">{t('sign_in')}</Text>
              )}
              </TouchableOpacity>

              <View className="items-center mt-4">
                <TouchableOpacity
                  onPress={() => setLoginMethod('google')}
                  className="py-3"
                >
                  <Text className="text-sm text-center" style={{ color: theme.colors.muted }}>Back to other options</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

          {/* Footer */}
          <View className="items-center space-y-4">
            <View className="flex-row">
              <Text className="text-sm" style={{ color: theme.colors.muted }}>{t('dont_have_account')} </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-medium" style={{ color: theme.colors.primary }}>{t('sign_up')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}