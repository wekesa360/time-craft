import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { EyeIcon, EyeSlashIcon } from 'react-native-heroicons/outline';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, loginWithGoogle, loginWithBiometric, isLoading, biometricEnabled, biometricAvailable, biometricCapabilities, initializeBiometric } = useAuthStore();
  const [showBiometric, setShowBiometric] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'password' | 'otp'>('google');
  
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
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Google Login Failed', 'Please try again.');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await loginWithBiometric();
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Biometric Login Failed', 'Please try again or use your password.');
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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-6 py-12 min-h-screen">
        {/* Logo/Brand */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg">
            <Text className="text-3xl font-bold text-white">TC</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-gray-600 text-center">Sign in to your TimeCraft account</Text>
        </View>

        {/* Login Options */}
        <View className="space-y-6">
          {/* Primary Login Options - Show when not in password mode */}
          {loginMethod !== 'password' && (
            <View className="space-y-4">
              {/* Google Sign In */}
              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex-row items-center justify-center bg-white border border-gray-200 rounded-2xl py-4 px-6 shadow-sm"
              >
                <View className="w-6 h-6 mr-3">
                  <Text className="text-lg">🔍</Text>
                </View>
                <Text className="text-gray-700 font-semibold text-lg">Continue with Google</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="px-4 text-gray-500 text-sm">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Email OTP Option */}
              <TouchableOpacity
                onPress={() => setLoginMethod('otp')}
                className="w-full bg-blue-600 rounded-2xl py-4 px-6 shadow-sm"
              >
                <Text className="text-white font-semibold text-lg text-center">Continue with Email</Text>
              </TouchableOpacity>

              {/* Biometric Login Option */}
              {showBiometric && (
                <TouchableOpacity
                  className="w-full border-2 border-blue-200 rounded-2xl py-4 px-6 flex-row items-center justify-center"
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Text className="text-2xl mr-3">{getBiometricIcon()}</Text>
                  <Text className="text-blue-600 font-semibold text-lg">
                    Sign in with {getBiometricText()}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Password Alternative */}
              <View className="items-center">
                <TouchableOpacity
                  onPress={() => setLoginMethod('password')}
                  className="py-2"
                >
                  <Text className="text-gray-500 text-sm">Continue with password instead</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Password Login Form - Show when selected */}
          {loginMethod === 'password' && (
            <View className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3 text-base ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
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
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </Text>
                )}
              </View>
              
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border rounded-xl px-4 py-3 pr-12 text-base ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-3"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon size={20} color="#6B7280" />
                    ) : (
                      <EyeIcon size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <View className="items-end">
                <TouchableOpacity>
                  <Text className="text-blue-600 text-sm font-medium">Forgot password?</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                className={`rounded-xl py-4 mt-6 ${
                  isLoading ? 'bg-blue-400' : 'bg-blue-600'
                }`}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold text-lg text-center">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLoginMethod('google')}
                className="py-2"
              >
                <Text className="text-gray-500 text-sm text-center">Back to other options</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer */}
        <View className="items-center mt-8">
          <Text className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/register">
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </Link>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}