import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
  BoltIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api';
import { showToast, showConnectionTest } from '../../lib/toast';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';

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
  const theme = useAppTheme();
  const { t } = useI18n();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.getDashboardStats();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Derive activities from dashboard response (recentTasks)
  const activities: RecentActivity[] = (dashboardData?.recentTasks || []).map((t: any) => ({
    id: t.id,
    type: 'task',
    title: t.title,
    description: t.status ? `Status: ${t.status}` : 'Task update',
    timestamp: new Date().toISOString(),
    icon: '✓',
    color: '#eaf2ff',
  }));

  // Extract stats from dashboard data
  const stats: DashboardStats = {
    tasksToday: dashboardData?.taskStats?.pending || 0,
    tasksCompleted: dashboardData?.taskStats?.completed || 0,
    focusTimeToday: dashboardData?.focusStats?.totalMinutesToday || 0,
    healthScore: 85, // Default until health tracking is implemented
    streakDays: dashboardData?.streakDays || 0,
    weeklyProgress: dashboardData?.weeklyProgress || 0,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchStats();
      showToast.success(t('dashboard_refreshed'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      showToast.error(errorMessage, 'Refresh Failed');
      console.error('Dashboard refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
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
      title: 'Add Tasks',
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView 
        className="flex-1"
        style={{ backgroundColor: theme.colors.card }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-evenly', paddingVertical: theme.spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with avatar */}
        <View className="px-6 pt-6 pb-8">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold" style={{ color: theme.colors.foreground }}>
                {getGreeting()}, {user?.firstName || user?.email?.split("@")[0] || "User"}! 👋
              </Text>
              <Text className="mt-1 text-lg" style={{ color: theme.colors.muted }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <View className="items-center">
              <View className="w-14 h-14 rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.colors.primary }}>
                <Text className="text-white font-bold text-xl">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Text>
              </View>
              {/* Connection Status removed */}
            </View>
          </View>
        </View>

        {/* Connection Error Banner */}
        {statsLoading && (
          <View className="px-6 mb-4">
            <View className="rounded-2xl p-4 flex-row items-center" style={{ borderWidth: 1, borderColor: theme.colors.infoBg, backgroundColor: theme.colors.infoBg, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
              <ClockIcon size={20} color={theme.colors.info} />
              <Text className="ml-3 flex-1" style={{ color: theme.colors.info }}>
                {t('youre_doing_great')}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Overview */}
        <View className="px-6 mb-8">
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary + '33' }}>
                      <FireIcon size={24} color={theme.colors.primary} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.foreground }}>
                      {stats?.tasksCompleted || 0}
                    </Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>Tasks Completed</Text>
                    <Text className="text-xs mt-1" style={{ color: theme.colors.primary }}>
                      {stats?.tasksToday || 0} today
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.infoBg, borderWidth: 1, borderColor: theme.colors.infoBg }}>
                      <ClockIcon size={24} color={theme.colors.info} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.foreground }}>
                      {formatFocusTime(stats?.focusTimeToday || 0)}
                    </Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>Focus Time</Text>
                    <Text className="text-xs mt-1" style={{ color: theme.colors.info }}>
                      Today
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.successBg, borderWidth: 1, borderColor: theme.colors.successBg }}>
                      <HeartIcon size={24} color={theme.colors.success} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.foreground }}>
                      {stats?.healthScore || 0}%
                    </Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>Health Score</Text>
                    <Text className="text-xs mt-1" style={{ color: theme.colors.success }}>
                      This week
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.warningBg, borderWidth: 1, borderColor: theme.colors.warningBg }}>
                      <BoltIcon size={24} color={theme.colors.warning} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.foreground }}>
                      {stats?.streakDays || 0}
                    </Text>
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>Day Streak</Text>
                    <Text className="text-xs mt-1" style={{ color: theme.colors.warning }}>
                      Keep it up!
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Progress */}
        <View className="px-6 mb-8">
          <View className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
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
          <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
            {t('quick_actions')}
          </Text>
          
          {(() => {
            const actions = quickActions.filter(a => ['add-task','log-health','view-calendar'].includes(a.id));
            const firstRow = actions.filter(a => a.id === 'add-task' || a.id === 'log-health');
            const calendar = actions.find(a => a.id === 'view-calendar');
            return (
              <>
                <View className="flex-row -mx-2 mb-3">
                  {firstRow.map((action) => (
                    <View key={action.id} className="w-1/2 px-2">
                      <TouchableOpacity
                        className="w-full flex-row items-center justify-center"
                        style={{
                          backgroundColor: theme.colors.primaryLight,
                          borderWidth: 1,
                          borderColor: theme.colors.primary,
                          borderRadius: theme.radii['3xl'],
                          paddingVertical: theme.spacing.xl,
                          paddingHorizontal: theme.spacing.xl,
                        }}
                        onPress={action.onPress}
                      >
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '20' }}>
                            <action.icon size={24} color={theme.colors.primary} />
                          </View>
                          <Text className="font-semibold" style={{ color: theme.colors.primary, fontSize: 18 }}>
                            {action.title}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                {calendar && (
                  <View className="-mx-2">
                    <TouchableOpacity
                      className="w-full flex-row items-center justify-center"
                      style={{
                        backgroundColor: theme.colors.primaryLight,
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                        borderRadius: theme.radii['3xl'],
                        paddingVertical: theme.spacing.xl,
                        paddingHorizontal: theme.spacing.xl,
                      }}
                      onPress={calendar.onPress}
                    >
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary + '20' }}>
                          <calendar.icon size={24} color={theme.colors.primary} />
                        </View>
                        <Text className="font-semibold" style={{ color: theme.colors.primary, fontSize: 18 }}>
                          {calendar.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            );
          })()}
        </View>

        {/* Recent Activity removed */}

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}