import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { EyeIcon, EyeSlashIcon } from 'react-native-heroicons/outline';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timezone: z.string().default('UTC'),
  preferredLanguage: z.string().default('en'),
  isStudent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      timezone: 'UTC',
      preferredLanguage: 'en',
      isStudent: false,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser(data);
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      Alert.alert('Registration Failed', 'Please check your information and try again');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-12">
        {/* Logo/Brand */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg">
            <Text className="text-3xl font-bold text-white">TC</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
          <Text className="text-gray-600 text-center">Join TimeCraft and start your wellness journey</Text>
        </View>

        <View className="max-w-sm mx-auto w-full">
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </Text>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border rounded-xl px-4 py-3 text-base ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                        autoCapitalize="words"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.firstName && (
                    <Text className="text-red-500 text-sm mt-1">
                      {errors.firstName.message}
                    </Text>
                  )}
                </View>
                
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </Text>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border rounded-xl px-4 py-3 text-base ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Last name"
                        autoCapitalize="words"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.lastName && (
                    <Text className="text-red-500 text-sm mt-1">
                      {errors.lastName.message}
                    </Text>
                  )}
                </View>
              </View>

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
                <View className="relative">
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border rounded-xl px-4 py-3 pr-12 text-base ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Create a password"
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

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </Text>
                <View className="relative">
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className={`border rounded-xl px-4 py-3 pr-12 text-base ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                        secureTextEntry={!showConfirmPassword}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-3"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon size={20} color="#6B7280" />
                    ) : (
                      <EyeIcon size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              {/* Student Toggle */}
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-sm font-medium text-gray-700">
                  I'm a student
                </Text>
                <Controller
                  control={control}
                  name="isStudent"
                  render={({ field: { onChange, value } }) => (
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                      thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
                    />
                  )}
                />
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
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
              
              <View className="flex-row justify-center mt-4">
                <Text className="text-gray-600">
                  Already have an account?{' '}
                </Text>
                <Link href="/auth/login">
                  <Text className="text-primary-600 font-semibold">
                    Sign In
                  </Text>
                </Link>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}