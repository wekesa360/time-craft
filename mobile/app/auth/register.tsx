import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/auth';
import { EyeIcon, EyeSlashIcon, CheckIcon } from 'react-native-heroicons/outline';
import { useAppTheme } from '../../constants/dynamicTheme';
import { showToast } from '../../lib/toast';

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

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { register: registerUser, isLoading } = useAuthStore();
  const theme = useAppTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      isStudent: false,
    },
  });

  const password = watch('password');

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '#f0f0f0' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#ff8c5a', '#ffb74d', '#64b5f6', '#81c784'];
    
    return {
      score,
      label: labels[Math.min(score - 1, 4)] || '',
      color: colors[Math.min(score - 1, 4)] || '#f0f0f0',
    };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await registerUser(data as any);
      
      // Check if verification is required
      if (result && typeof result === 'object' && 'requiresVerification' in result && result.requiresVerification) {
        // Redirect to verification page
        router.push({
          pathname: '/auth/verify-email',
          params: { email: result.email || data.email }
        });
        showToast.success('Account created! Please verify your email.', 'Success');
      } else {
        // Registration completed (shouldn't happen with new flow, but handle it)
        showToast.success('Account created successfully! Welcome!', 'Success');
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      showToast.error('Please check your information and try again', 'Registration Failed');
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 py-8" style={{ minHeight: '100%' }}>
          {/* Logo/Brand */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: theme.colors.primary, borderRadius: 20 }}>
              <Text className="text-2xl font-bold text-white">TC</Text>
            </View>
            <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>Create Your Account</Text>
            <View className="flex-row">
              <Text style={{ color: theme.colors.muted }}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text className="font-medium" style={{ color: theme.colors.primary }}>Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          {/* Registration Form */}
          <View className="space-y-6 mb-8">
            {/* Name Fields */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                  First Name
                </Text>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full px-4 py-3"
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: errors.firstName ? '#ef4444' : theme.colors.border,
                        color: theme.colors.foreground,
                        backgroundColor: theme.colors.card
                      }}
                      placeholder="First name"
                      placeholderTextColor={theme.colors.mutedAlt}
                      autoCapitalize="words"
                      autoComplete="given-name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.firstName && (
                  <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                    {errors.firstName.message}
                  </Text>
                )}
              </View>
              
              <View className="flex-1">
                <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                  Last Name
                </Text>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full px-4 py-3"
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: errors.lastName ? '#ef4444' : theme.colors.border,
                        color: theme.colors.foreground,
                        backgroundColor: theme.colors.card
                      }}
                      placeholder="Last name"
                      placeholderTextColor={theme.colors.mutedAlt}
                      autoCapitalize="words"
                      autoComplete="family-name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.lastName && (
                  <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                    {errors.lastName.message}
                  </Text>
                )}
              </View>
            </View>

            {/* Email Field */}
            <View>
              <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                Email
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
                    autoCorrect={false}
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
            {/* Password Field */}
            <View>
              <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                Password
              </Text>
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
                      placeholder="Create a password"
                      placeholderTextColor={theme.colors.mutedAlt}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
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
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator */}
              {password && (
                <View className="mt-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View className="flex-1 h-2" style={{ backgroundColor: '#f0f0f0', borderRadius: 10 }}>
                      <View
                        className="h-2"
                        style={{ 
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                          borderRadius: 10
                        }}
                      />
                    </View>
                    <Text className="text-xs" style={{ color: '#6b6b6b' }}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                  <View className="space-y-1">
                    <View className="flex-row items-center gap-1">
                      <CheckIcon 
                        size={12} 
                        color={password.length >= 8 ? '#81c784' : '#6b6b6b'} 
                      />
                      <Text className="text-xs" style={{ color: '#6b6b6b' }}>At least 8 characters</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <CheckIcon 
                        size={12} 
                        color={/[A-Z]/.test(password) ? '#81c784' : '#6b6b6b'} 
                      />
                      <Text className="text-xs" style={{ color: '#6b6b6b' }}>One uppercase letter</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <CheckIcon 
                        size={12} 
                        color={/[a-z]/.test(password) ? '#81c784' : '#6b6b6b'} 
                      />
                      <Text className="text-xs" style={{ color: '#6b6b6b' }}>One lowercase letter</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <CheckIcon 
                        size={12} 
                        color={/\d/.test(password) ? '#81c784' : '#6b6b6b'} 
                      />
                      <Text className="text-xs" style={{ color: '#6b6b6b' }}>One number</Text>
                    </View>
                  </View>
                </View>
              )}
              
              {errors.password && (
                <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Confirm Password Field */}
            <View>
              <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.foreground }}>
                Confirm Password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="w-full px-4 pr-16 py-3"
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: errors.confirmPassword ? '#ef4444' : theme.colors.border,
                        color: theme.colors.foreground,
                        backgroundColor: theme.colors.card
                      }}
                      placeholder="Confirm your password"
                      placeholderTextColor={theme.colors.mutedAlt}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-3"
                  style={{ top: 12 }}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text className="text-sm underline" style={{ color: theme.colors.primary }}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Student Checkbox */}
            <View className="flex-row items-center py-4">
              <Controller
                control={control}
                name="isStudent"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    className="w-5 h-5 mr-3 items-center justify-center"
                    style={{
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: value ? theme.colors.primary : theme.colors.border,
                      backgroundColor: value ? theme.colors.primary : theme.colors.card
                    }}
                    onPress={() => onChange(!value)}
                  >
                    {value && <CheckIcon size={14} color="white" />}
                  </TouchableOpacity>
                )}
              />
              <Text className="text-sm" style={{ color: theme.colors.foreground }}>I'm a student</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              className="w-full px-6 py-4 font-medium flex-row items-center justify-center gap-2 shadow-sm"
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
                  <Text className="text-white font-medium">Creating...</Text>
              </>
            ) : (
                <Text className="text-white font-medium">Create Account</Text>
            )}
            </TouchableOpacity>
          </View>

          {/* Terms Notice */}
          <View className="items-center">
            <View className="flex-row flex-wrap justify-center">
              <Text className="text-xs text-center" style={{ color: theme.colors.muted }}>
                By creating an account, you agree to our{' '}
              </Text>
              <Link href="/terms" asChild>
                <TouchableOpacity>
                  <Text className="text-xs" style={{ color: theme.colors.primary }}>Terms of Service</Text>
                </TouchableOpacity>
              </Link>
              <Text className="text-xs" style={{ color: theme.colors.muted }}> and </Text>
              <Link href="/privacy" asChild>
                <TouchableOpacity>
                  <Text className="text-xs" style={{ color: theme.colors.primary }}>Privacy Policy</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}