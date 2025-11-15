import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  HeartIcon, 
  PlusIcon, 
  FireIcon,
  ScaleIcon,
  ClockIcon,
  FaceSmileIcon,
  BeakerIcon,
  ChartBarIcon
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';

interface HealthLog {
  id: string;
  type: 'exercise' | 'nutrition' | 'mood' | 'sleep' | 'weight' | 'hydration' | 'medication';
  payload: any;
  recordedAt: string;
  createdAt: string;
}

interface HealthStats {
  weeklyExercise: number;
  averageMood: number;
  averageSleep: number;
  waterIntake: number;
  caloriesBurned: number;
  currentWeight?: number;
}

export default function HealthScreen() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch health logs
  const { data: healthLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['health-logs', selectedPeriod],
    queryFn: async (): Promise<HealthLog[]> => {
      const response = await apiClient.getHealthLogs({ 
        limit: selectedPeriod === 'day' ? 10 : selectedPeriod === 'week' ? 50 : 100 
      });
      // Backend returns { logs: HealthLog[], hasMore, nextCursor, total }
      return response.logs || response.data?.logs || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch health stats
  const { data: stats } = useQuery({
    queryKey: ['health-stats', selectedPeriod],
    queryFn: async (): Promise<HealthStats> => {
      // Convert period to days for backend
      const periodDays = selectedPeriod === 'day' ? '1' : selectedPeriod === 'week' ? '7' : '30';
      const response = await apiClient.getHealthStats({ period: periodDays });
      
      // Map backend response to mobile format
      const backendStats = response.stats || {};
      return {
        weeklyExercise: backendStats.exercise?.totalSessions || 0,
        averageMood: backendStats.mood?.averageMoodScore || 0,
        averageSleep: 0, // Sleep tracking not implemented in backend yet
        waterIntake: backendStats.hydration?.totalWaterMl ? (backendStats.hydration.totalWaterMl / 1000) : 0, // Convert ml to L
        caloriesBurned: backendStats.exercise?.totalDuration ? Math.round(backendStats.exercise.totalDuration * 5) : 0, // Rough estimate: 5 cal/min
        currentWeight: undefined, // Weight tracking not in stats endpoint
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create health log mutation
  const createHealthLogMutation = useMutation({
    mutationFn: async (log: { type: string; payload: any }) => {
      return apiClient.createHealthLog(log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
      queryClient.invalidateQueries({ queryKey: ['health-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to log health data');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh health data');
    } finally {
      setRefreshing(false);
    }
  };

  const quickLogOptions = [
    {
      id: 'exercise',
      title: 'Exercise',
      description: 'Log workout session',
      icon: FireIcon,
      color: theme.colors.successBg,
      iconColor: theme.colors.success,
      onPress: () => router.push('/modals/log-exercise'),
    },
    {
      id: 'mood',
      title: 'Mood',
      description: 'Track how you feel',
      icon: FaceSmileIcon,
      color: theme.colors.warningBg,
      iconColor: theme.colors.warning,
      onPress: () => router.push('/modals/log-mood'),
    },
    {
      id: 'sleep',
      title: 'Sleep',
      description: 'Record sleep hours',
      icon: ClockIcon,
      color: theme.colors.infoBg,
      iconColor: theme.colors.info,
      onPress: () => router.push('/modals/log-sleep'),
    },
    {
      id: 'weight',
      title: 'Weight',
      description: 'Track body weight',
      icon: ScaleIcon,
      color: theme.colors.infoBg,
      iconColor: theme.colors.info,
      onPress: () => router.push('/modals/log-weight'),
    },
    {
      id: 'hydration',
      title: 'Water',
      description: 'Log water intake',
      icon: BeakerIcon,
      color: theme.colors.infoBg,
      iconColor: theme.colors.info,
      onPress: () => router.push('/modals/log-hydration'),
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      description: 'Track meals & calories',
      icon: HeartIcon,
      color: theme.colors.successBg,
      iconColor: theme.colors.success,
      onPress: () => router.push('/modals/log-nutrition'),
    },
  ];

  const periodOptions = [
    { key: 'day', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const formatHealthLogTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getHealthLogIcon = (type: string) => {
    switch (type) {
      case 'exercise': return '🏃‍♂️';
      case 'mood': return '😊';
      case 'sleep': return '😴';
      case 'weight': return '⚖️';
      case 'hydration': return '💧';
      case 'nutrition': return '🍎';
      case 'medication': return '💊';
      default: return '📊';
    }
  };

  const getHealthLogDescription = (log: HealthLog) => {
    // Parse payload if it's a string
    const payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
    
    switch (log.type) {
      case 'exercise':
        return `${payload?.activity || payload?.activity_type || 'Exercise'} - ${payload?.duration || payload?.duration_minutes || 0}min`;
      case 'mood':
        return `Mood: ${payload?.score || 0}/10`;
      case 'sleep':
        return `${payload?.hours || 0}h ${payload?.minutes || 0}m sleep`;
      case 'weight':
        return `${payload?.weight || 0}kg`;
      case 'hydration':
        const ml = payload?.total_ml || payload?.totalMl || payload?.amount_ml || payload?.amountMl || 0;
        const glasses = payload?.glasses || Math.round(ml / 250);
        return `${glasses} glasses (${ml}ml)`;
      case 'nutrition':
        const calories = payload?.calories || payload?.total_calories || payload?.totalCalories || 0;
        return `${calories} calories`;
      default:
        return 'Health data logged';
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>Health</Text>
          <Text style={{ color: theme.colors.muted }}>Track your wellness journey</Text>
        </View>

        {/* Period Selector */}
        <View className="px-6 mb-6">
          <View className="flex-row rounded-2xl p-1" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
            {periodOptions.map((period) => (
              <TouchableOpacity
                key={period.key}
                className={`flex-1 rounded-xl`}
                style={{ backgroundColor: selectedPeriod === period.key ? theme.colors.primaryLight : 'transparent', paddingVertical: theme.spacing.lg, borderRadius: theme.radii.xl, borderWidth: 1, borderColor: selectedPeriod === period.key ? theme.colors.primary : 'transparent' }}
                onPress={() => setSelectedPeriod(period.key as any)}
              >
                <Text
                  className={`text-center font-medium`}
                  style={{ color: selectedPeriod === period.key ? theme.colors.primary : theme.colors.muted }}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Stats */}
        {stats && (
          <View className="px-6 mb-8">
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <FireIcon size={24} color={'#FFFFFF'} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                        {stats.caloriesBurned || 0}
                      </Text>
                      <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Calories Burned</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <FaceSmileIcon size={24} color={'#FFFFFF'} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                        {stats.averageMood ? `${stats.averageMood.toFixed(1)}/10` : 'N/A'}
                      </Text>
                      <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Average Mood</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <ClockIcon size={24} color={'#FFFFFF'} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                        {stats.averageSleep ? `${stats.averageSleep.toFixed(1)}h` : 'N/A'}
                      </Text>
                      <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Average Sleep</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <BeakerIcon size={24} color={'#FFFFFF'} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                        {stats.waterIntake || 0}L
                      </Text>
                      <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>Water Intake</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Log Actions */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>Quick Log</Text>
          
          <View className="flex-row flex-wrap -mx-2">
            {quickLogOptions.map((option) => (
              <View key={option.id} className="w-1/2 px-2 mb-4">
                <TouchableOpacity 
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}
                  onPress={option.onPress}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: option.color, borderWidth: 1, borderColor: (option.iconColor as string) + '22' }}>
                      <option.icon size={22} color={option.iconColor as any} />
                    </View>
                    <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 12 }}>
                      <Text className="font-semibold text-base" style={{ color: theme.colors.foreground }}>
                        {option.title}
                      </Text>
                      <Text className="text-sm mt-1" style={{ color: theme.colors.muted }}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Health Logs */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: theme.colors.foreground }}>Recent Logs</Text>
            <TouchableOpacity>
              <Text className="font-medium" style={{ color: theme.colors.primary }}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="rounded-2xl" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
            {healthLogs && healthLogs.length > 0 ? (
              healthLogs.slice(0, 8).map((log, index) => (
                <View key={log.id}>
                  <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: theme.colors.primaryLight }}>
                      <Text className="text-lg">{getHealthLogIcon(log.type)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold capitalize" style={{ color: theme.colors.foreground }}>
                        {log.type}
                      </Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>
                        {getHealthLogDescription(log)}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: theme.colors.mutedAlt }}>
                        {formatHealthLogTime(log.recordedAt)}
                      </Text>
                    </View>
                  </View>
                  {index < healthLogs.length - 1 && index < 7 && (
                    <View className="h-px mx-4" style={{ backgroundColor: theme.colors.border }} />
                  )}
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <ChartBarIcon size={48} color="#D1D5DB" />
                <Text className="text-center mt-4" style={{ color: theme.colors.muted }}>
                  No health data yet
                </Text>
                <Text className="text-sm text-center mt-1" style={{ color: theme.colors.mutedAlt }}>
                  Start logging your health data to track your wellness!
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