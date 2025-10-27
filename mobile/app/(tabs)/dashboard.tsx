import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  HeartIcon, 
  FireIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  BoltIcon
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api-client';

interface DashboardStats {
  tasksToday: number;
  tasksCompleted: number;
  focusTimeToday: number;
  healthScore: number;
  streakDays: number;
  weeklyProgress: number;
}

interface RecentActivity {
  id: string;
  type: 'task' | 'health' | 'focus' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.get('/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async (): Promise<RecentActivity[]> => {
      const response = await apiClient.get('/dashboard/recent-activities');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStats(), refetchActivities()]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const quickActions = [
    {
      id: 'add-task',
      title: 'Add Task',
      description: 'Create a new task',
      icon: PlusIcon,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onPress: () => router.push('/modals/add-task'),
    },
    {
      id: 'log-health',
      title: 'Log Health',
      description: 'Track your wellness',
      icon: HeartIcon,
      color: 'bg-red-100',
      iconColor: 'text-red-600',
      onPress: () => router.push('/(tabs)/health'),
    },
    {
      id: 'start-focus',
      title: 'Start Focus',
      description: 'Begin a focus session',
      icon: ClockIcon,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onPress: () => router.push('/(tabs)/focus'),
    },
    {
      id: 'view-calendar',
      title: 'Calendar',
      description: 'Check your schedule',
      icon: CalendarIcon,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      onPress: () => router.push('/calendar'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-8">
          <Text className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName}! 👋
          </Text>
          <Text className="text-gray-600 mt-1 text-lg">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View className="px-6 mb-8">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <CheckCircleIcon size={24} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-blue-600">
                    {stats?.tasksCompleted || 0}
                  </Text>
                </View>
                <Text className="text-gray-600 text-sm font-medium">
                  Tasks Completed
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  of {stats?.tasksToday || 0} today
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <ClockIcon size={24} color="#8B5CF6" />
                  <Text className="text-2xl font-bold text-purple-600">
                    {formatFocusTime(stats?.focusTimeToday || 0)}
                  </Text>
                </View>
                <Text className="text-gray-600 text-sm font-medium">
                  Focus Time
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  today
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <HeartIcon size={24} color="#EF4444" />
                  <Text className="text-2xl font-bold text-red-600">
                    {stats?.healthScore || 0}%
                  </Text>
                </View>
                <Text className="text-gray-600 text-sm font-medium">
                  Health Score
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  this week
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <FireIcon size={24} color="#F59E0B" />
                  <Text className="text-2xl font-bold text-orange-600">
                    {stats?.streakDays || 0}
                  </Text>
                </View>
                <Text className="text-gray-600 text-sm font-medium">
                  Day Streak
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  keep it up!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View className="px-6 mb-8">
          <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-lg font-semibold">
                  Weekly Progress
                </Text>
                <Text className="text-blue-100 text-sm">
                  You're doing great this week!
                </Text>
              </View>
              <View className="bg-white/20 rounded-full p-3">
                <ChartBarIcon size={24} color="white" />
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="flex-1 bg-white/20 rounded-full h-3 mr-4">
                <View 
                  className="bg-white rounded-full h-3"
                  style={{ width: `${stats?.weeklyProgress || 0}%` }}
                />
              </View>
              <Text className="text-white font-bold text-lg">
                {stats?.weeklyProgress || 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </Text>
          
          <View className="flex-row flex-wrap -mx-2">
            {quickActions.map((action) => (
              <View key={action.id} className="w-1/2 px-2 mb-4">
                <TouchableOpacity 
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  onPress={action.onPress}
                >
                  <View className={`w-12 h-12 ${action.color} rounded-xl items-center justify-center mb-3`}>
                    <action.icon size={24} className={action.iconColor} />
                  </View>
                  <Text className="font-semibold text-gray-900 text-base">
                    {action.title}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {action.description}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Recent Activity
          </Text>
          
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {activities && activities.length > 0 ? (
              activities.slice(0, 5).map((activity, index) => (
                <View key={activity.id}>
                  <View className="p-4 flex-row items-center">
                    <View className={`w-10 h-10 ${activity.color} rounded-full items-center justify-center mr-4`}>
                      <Text className="text-lg">{activity.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900">
                        {activity.title}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {activity.description}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  {index < activities.length - 1 && index < 4 && (
                    <View className="h-px bg-gray-100 mx-4" />
                  )}
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <BoltIcon size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  No recent activity yet
                </Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
                  Start completing tasks and tracking your wellness!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}