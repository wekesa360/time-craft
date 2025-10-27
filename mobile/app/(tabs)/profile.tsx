import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserIcon, 
  CogIcon, 
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  HeartIcon
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api-client';

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalFocusMinutes: number;
  currentStreak: number;
  totalAchievements: number;
  healthLogsCount: number;
}

export default function ProfileScreen() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async (): Promise<UserStats> => {
      const response = await apiClient.get('/profile/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiClient.updateProfile(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      await setBiometricEnabled(enabled);
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          description: 'Update your personal information',
          icon: PencilIcon,
          onPress: () => router.push('/modals/edit-profile'),
        },
        {
          id: 'achievements',
          title: 'Achievements',
          description: 'View your badges and milestones',
          icon: TrophyIcon,
          onPress: () => router.push('/achievements'),
        },
        {
          id: 'analytics',
          title: 'Analytics',
          description: 'Detailed insights and reports',
          icon: ChartBarIcon,
          onPress: () => router.push('/analytics'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Manage your notification preferences',
          icon: BellIcon,
          onPress: () => router.push('/settings/notifications'),
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          description: 'Control your privacy settings',
          icon: ShieldCheckIcon,
          onPress: () => router.push('/settings/privacy'),
        },
        {
          id: 'preferences',
          title: 'App Preferences',
          description: 'Customize your app experience',
          icon: CogIcon,
          onPress: () => router.push('/settings/preferences'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          description: 'Get help and contact support',
          icon: QuestionMarkCircleIcon,
          onPress: () => router.push('/help'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Profile</Text>
          <Text className="text-gray-600">Manage your account and preferences</Text>
        </View>

        {/* User Info Card */}
        <View className="px-6 mb-8">
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-6">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mr-4">
                <UserIcon size={40} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-gray-600 text-lg">
                  {user?.email}
                </Text>
                {user?.isStudent && (
                  <View className="mt-2">
                    <View className="bg-green-100 rounded-full px-3 py-1 self-start">
                      <Text className="text-green-700 text-sm font-medium">
                        Student Account
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Stats */}
            {stats && (
              <View className="flex-row flex-wrap -mx-2">
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <View className="flex-row items-center mb-2">
                      <ClockIcon size={20} color="#3B82F6" />
                      <Text className="text-blue-600 font-semibold ml-2">Focus Time</Text>
                    </View>
                    <Text className="text-2xl font-bold text-blue-700">
                      {Math.floor(stats.totalFocusMinutes / 60)}h {stats.totalFocusMinutes % 60}m
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
                    <View className="flex-row items-center mb-2">
                      <TrophyIcon size={20} color="#10B981" />
                      <Text className="text-green-600 font-semibold ml-2">Tasks Done</Text>
                    </View>
                    <Text className="text-2xl font-bold text-green-700">
                      {stats.completedTasks}
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                    <View className="flex-row items-center mb-2">
                      <FireIcon size={20} color="#F59E0B" />
                      <Text className="text-orange-600 font-semibold ml-2">Streak</Text>
                    </View>
                    <Text className="text-2xl font-bold text-orange-700">
                      {stats.currentStreak} days
                    </Text>
                  </View>
                </View>

                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
                    <View className="flex-row items-center mb-2">
                      <HeartIcon size={20} color="#EF4444" />
                      <Text className="text-red-600 font-semibold ml-2">Health Logs</Text>
                    </View>
                    <Text className="text-2xl font-bold text-red-700">
                      {stats.healthLogsCount}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Biometric Setting */}
        <View className="px-6 mb-8">
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mr-4">
                  <ShieldCheckIcon size={24} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    Biometric Authentication
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Use Face ID or Touch ID to sign in
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} className="px-6 mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {section.title}
            </Text>
            
            <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {section.items.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    className="p-4 flex-row items-center"
                    onPress={item.onPress}
                  >
                    <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-4">
                      <item.icon size={24} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">
                        {item.title}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {item.description}
                      </Text>
                    </View>
                    <View className="ml-4">
                      <Text className="text-gray-400">›</Text>
                    </View>
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View className="h-px bg-gray-100 mx-4" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 shadow-sm border border-red-200"
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View className="flex-row items-center justify-center">
              <ArrowRightOnRectangleIcon size={24} color="#EF4444" />
              <Text className="text-red-600 font-semibold text-lg ml-3">
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="px-6 mb-8">
          <Text className="text-center text-gray-400 text-sm">
            TimeCraft Mobile v1.0.0
          </Text>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}