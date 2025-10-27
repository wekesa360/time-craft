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
import { apiClient } from '../../lib/api-client';

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
      return response.logs || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch health stats
  const { data: stats } = useQuery({
    queryKey: ['health-stats', selectedPeriod],
    queryFn: async (): Promise<HealthStats> => {
      const response = await apiClient.get(`/health/stats?period=${selectedPeriod}`);
      return response.data;
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
      color: 'bg-red-100',
      iconColor: 'text-red-600',
      onPress: () => router.push('/modals/log-exercise'),
    },
    {
      id: 'mood',
      title: 'Mood',
      description: 'Track how you feel',
      icon: FaceSmileIcon,
      color: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      onPress: () => router.push('/modals/log-mood'),
    },
    {
      id: 'sleep',
      title: 'Sleep',
      description: 'Record sleep hours',
      icon: ClockIcon,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onPress: () => router.push('/modals/log-sleep'),
    },
    {
      id: 'weight',
      title: 'Weight',
      description: 'Track body weight',
      icon: ScaleIcon,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onPress: () => router.push('/modals/log-weight'),
    },
    {
      id: 'hydration',
      title: 'Water',
      description: 'Log water intake',
      icon: BeakerIcon,
      color: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      onPress: () => router.push('/modals/log-hydration'),
    },
    {
      id: 'nutrition',
      title: 'Nutrition',
      description: 'Track meals & calories',
      icon: HeartIcon,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
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
    switch (log.type) {
      case 'exercise':
        return `${log.payload.activity || 'Exercise'} - ${log.payload.duration || 0}min`;
      case 'mood':
        return `Mood: ${log.payload.score || 0}/10`;
      case 'sleep':
        return `${log.payload.hours || 0}h ${log.payload.minutes || 0}m sleep`;
      case 'weight':
        return `${log.payload.weight || 0}kg`;
      case 'hydration':
        return `${log.payload.glasses || 0} glasses (${log.payload.total_ml || 0}ml)`;
      case 'nutrition':
        return `${log.payload.calories || 0} calories`;
      default:
        return 'Health data logged';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Health</Text>
          <Text className="text-gray-600">Track your wellness journey</Text>
        </View>

        {/* Period Selector */}
        <View className="px-6 mb-6">
          <View className="flex-row bg-gray-100 rounded-2xl p-1">
            {periodOptions.map((period) => (
              <TouchableOpacity
                key={period.key}
                className={`flex-1 py-3 rounded-xl ${
                  selectedPeriod === period.key ? 'bg-white shadow-sm' : ''
                }`}
                onPress={() => setSelectedPeriod(period.key as any)}
              >
                <Text
                  className={`text-center font-medium ${
                    selectedPeriod === period.key ? 'text-gray-900' : 'text-gray-600'
                  }`}
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
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <FireIcon size={24} color="#EF4444" />
                    <Text className="text-2xl font-bold text-red-600">
                      {stats.caloriesBurned || 0}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Calories Burned
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <FaceSmileIcon size={24} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-orange-600">
                      {stats.averageMood ? `${stats.averageMood.toFixed(1)}/10` : 'N/A'}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Average Mood
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <ClockIcon size={24} color="#8B5CF6" />
                    <Text className="text-2xl font-bold text-purple-600">
                      {stats.averageSleep ? `${stats.averageSleep.toFixed(1)}h` : 'N/A'}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Average Sleep
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <BeakerIcon size={24} color="#06B6D4" />
                    <Text className="text-2xl font-bold text-cyan-600">
                      {stats.waterIntake || 0}L
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Water Intake
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Log Actions */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Quick Log</Text>
          
          <View className="flex-row flex-wrap -mx-2">
            {quickLogOptions.map((option) => (
              <View key={option.id} className="w-1/2 px-2 mb-4">
                <TouchableOpacity 
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  onPress={option.onPress}
                >
                  <View className={`w-12 h-12 ${option.color} rounded-xl items-center justify-center mb-3`}>
                    <option.icon size={24} className={option.iconColor} />
                  </View>
                  <Text className="font-semibold text-gray-900 text-base">
                    {option.title}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {option.description}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Health Logs */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Recent Logs</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {healthLogs && healthLogs.length > 0 ? (
              healthLogs.slice(0, 8).map((log, index) => (
                <View key={log.id}>
                  <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                      <Text className="text-lg">{getHealthLogIcon(log.type)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 capitalize">
                        {log.type}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {getHealthLogDescription(log)}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {formatHealthLogTime(log.recordedAt)}
                      </Text>
                    </View>
                  </View>
                  {index < healthLogs.length - 1 && index < 7 && (
                    <View className="h-px bg-gray-100 mx-4" />
                  )}
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <ChartBarIcon size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  No health data yet
                </Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
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