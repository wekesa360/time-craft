import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, loginWithBiometric, isLoading, biometricEnabled, biometricAvailable, biometricCapabilities, initializeBiometric } = useAuthStore();
  const [showBiometric, setShowBiometric] = useState(false);
  
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
    <View className="flex-1 bg-gray-50 px-6 py-12">
      <View className="flex-1 justify-center max-w-sm mx-auto w-full">
        <View className="bg-white rounded-2xl p-8 shadow-lg">
          <Text className="text-2xl font-bold text-gray-900 text-center mb-8">
            Welcome Back
          </Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
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
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-4 py-3 text-base ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              className={`rounded-xl py-4 mt-6 ${
                isLoading ? 'bg-primary-400' : 'bg-primary-600'
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

            {/* Biometric Login Option */}
            {showBiometric && (
              <>
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="px-4 text-gray-500 text-sm">or</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                <TouchableOpacity
                  className="border-2 border-primary-200 rounded-xl py-4 flex-row items-center justify-center"
                  onPress={handleBiometricLogin}
                  disabled={isLoading}
                >
                  <Text className="text-2xl mr-3">{getBiometricIcon()}</Text>
                  <Text className="text-primary-600 font-semibold text-lg">
                    Sign in with {getBiometricText()}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">
                Don't have an account?{' '}
              </Text>
              <Link href="/auth/register">
                <Text className="text-primary-600 font-semibold">
                  Sign Up
                </Text>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}