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
      backgroundColor: '#e3f2fd',
      iconColor: '#64b5f6',
      onPress: () => router.push('/modals/add-task'),
    },
    {
      id: 'log-health',
      title: 'Log Health',
      description: 'Track your wellness',
      icon: HeartIcon,
      backgroundColor: '#ffebee',
      iconColor: '#ef5350',
      onPress: () => router.push('/(tabs)/health'),
    },
    {
      id: 'start-focus',
      title: 'Start Focus',
      description: 'Begin a focus session',
      icon: ClockIcon,
      backgroundColor: '#f3e5f5',
      iconColor: '#ba68c8',
      onPress: () => router.push('/(tabs)/focus'),
    },
    {
      id: 'view-calendar',
      title: 'Calendar',
      description: 'Check your schedule',
      icon: CalendarIcon,
      backgroundColor: '#e8f5e8',
      iconColor: '#81c784',
      onPress: () => router.push('/calendar'),
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f5e6e8' }}>
      <ScrollView 
        className="flex-1"
        style={{ backgroundColor: '#f5e6e8' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with avatar */}
        <View className="px-6 pt-6 pb-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold" style={{ color: '#2d2d2d' }}>
                {getGreeting()}, {user?.firstName || user?.email?.split("@")[0] || "User"}! 👋
              </Text>
              <Text className="mt-1 text-lg" style={{ color: '#6b6b6b' }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full items-center justify-center shadow-lg" style={{ backgroundColor: '#ff6b35' }}>
              <Text className="text-white font-bold text-xl">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="px-6 mb-8">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderWidth: 1, borderColor: '#e8e8e8' }}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: '#fff3f0' }}>
                    <FireIcon size={24} color="#ff6b35" />
                  </View>
                </View>
                <Text className="text-2xl font-bold" style={{ color: '#2d2d2d' }}>
                  {stats?.tasksCompleted || 0}
                </Text>
                <Text className="text-sm mt-1" style={{ color: '#6b6b6b' }}>Tasks Completed</Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text className="text-xs font-medium" style={{ color: '#ff6b35' }}>
                    {stats?.tasksToday || 0} total today
                  </Text>
                </View>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderWidth: 1, borderColor: '#e8e8e8' }}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
                    <ClockIcon size={24} color="#64b5f6" />
                  </View>
                </View>
                <Text className="text-2xl font-bold" style={{ color: '#2d2d2d' }}>
                  {formatFocusTime(stats?.focusTimeToday || 0)}
                </Text>
                <Text className="text-sm mt-1" style={{ color: '#6b6b6b' }}>Focus Time</Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text className="text-xs font-medium" style={{ color: '#64b5f6' }}>
                    Today
                  </Text>
                </View>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderWidth: 1, borderColor: '#e8e8e8' }}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: '#e8f5e8' }}>
                    <HeartIcon size={24} color="#81c784" />
                  </View>
                </View>
                <Text className="text-2xl font-bold" style={{ color: '#2d2d2d' }}>
                  {stats?.healthScore || 0}%
                </Text>
                <Text className="text-sm mt-1" style={{ color: '#6b6b6b' }}>Health Score</Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text className="text-xs font-medium" style={{ color: '#81c784' }}>
                    This week
                  </Text>
                </View>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-5 shadow-sm" style={{ borderWidth: 1, borderColor: '#e8e8e8' }}>
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: '#fff8e1' }}>
                    <BoltIcon size={24} color="#ffb74d" />
                  </View>
                </View>
                <Text className="text-2xl font-bold" style={{ color: '#2d2d2d' }}>
                  {stats?.streakDays || 0}
                </Text>
                <Text className="text-sm mt-1" style={{ color: '#6b6b6b' }}>Day Streak</Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <Text className="text-xs font-medium" style={{ color: '#ffb74d' }}>
                    Keep it up!
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View className="px-6 mb-8">
          <View className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: '#ff6b35' }}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-lg font-semibold">
                  Weekly Progress
                </Text>
                <Text className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  You're doing great this week!
                </Text>
              </View>
              <View className="rounded-full p-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <ChartBarIcon size={24} color="white" />
              </View>
            </View>
            
            <View className="flex-row items-center">
              <View className="flex-1 rounded-full h-3 mr-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <View 
                  className="rounded-full h-3"
                  style={{ 
                    width: `${stats?.weeklyProgress || 0}%`,
                    backgroundColor: 'white'
                  }}
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
          <Text className="text-xl font-bold mb-4" style={{ color: '#2d2d2d' }}>
            Quick Actions
          </Text>
          
          <View className="flex-row flex-wrap -mx-2">
            {quickActions.map((action) => (
              <View key={action.id} className="w-1/2 px-2 mb-4">
                <TouchableOpacity 
                  className="bg-white rounded-2xl p-4 shadow-sm"
                  style={{ borderWidth: 1, borderColor: '#e8e8e8' }}
                  onPress={action.onPress}
                >
                  <View className="w-12 h-12 rounded-xl items-center justify-center mb-3" style={{ backgroundColor: action.backgroundColor }}>
                    <action.icon size={24} color={action.iconColor} />
                  </View>
                  <Text className="font-semibold text-base" style={{ color: '#2d2d2d' }}>
                    {action.title}
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
                    {action.description}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold mb-4" style={{ color: '#2d2d2d' }}>
            Recent Activity
          </Text>
          
          <View className="bg-white rounded-2xl shadow-sm" style={{ borderWidth: 1, borderColor: '#e8e8e8' }}>
            {activities && activities.length > 0 ? (
              activities.slice(0, 5).map((activity, index) => (
                <View key={activity.id}>
                  <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: activity.color }}>
                      <Text className="text-lg">{activity.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold" style={{ color: '#2d2d2d' }}>
                        {activity.title}
                      </Text>
                      <Text className="text-sm" style={{ color: '#6b6b6b' }}>
                        {activity.description}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: '#a8a8a8' }}>
                        {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  {index < activities.length - 1 && index < 4 && (
                    <View className="h-px mx-4" style={{ backgroundColor: '#f0f0f0' }} />
                  )}
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <BoltIcon size={48} color="#d1d5db" />
                <Text className="text-center mt-4" style={{ color: '#6b6b6b' }}>
                  No recent activity yet
                </Text>
                <Text className="text-sm text-center mt-1" style={{ color: '#a8a8a8' }}>
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