import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useHealthStore } from '../../stores/health';

export default function HealthScreen() {
  const { summary, logs, fetchHealthLogs, fetchHealthSummary, isLoading } = useHealthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchHealthLogs();
    fetchHealthSummary();
  }, []);

  const handleQuickLog = (type: 'exercise' | 'nutrition' | 'mood' | 'hydration') => {
    const modalRoutes = {
      exercise: '/modals/log-exercise',
      nutrition: '/modals/log-nutrition',
      mood: '/modals/log-mood',
      hydration: '/modals/log-hydration',
    };
    
    router.push(modalRoutes[type]);
  };

  const quickLogOptions = [
    {
      type: 'exercise' as const,
      title: 'Log Workout',
      subtitle: 'Track your exercise',
      emoji: '🏋️‍♂️',
      color: 'bg-red-100',
      textColor: 'text-red-700',
    },
    {
      type: 'nutrition' as const,
      title: 'Log Meal',
      subtitle: 'Track what you eat',
      emoji: '🍎',
      color: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      type: 'mood' as const,
      title: 'Log Mood',
      subtitle: 'How are you feeling?',
      emoji: '😊',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    {
      type: 'hydration' as const,
      title: 'Log Water',
      subtitle: 'Stay hydrated',
      emoji: '💧',
      color: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
  ];

  const recentLogs = logs.slice(0, 5); // Show last 5 logs

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'exercise': return '🏋️‍♂️';
      case 'nutrition': return '🍎';
      case 'mood': return '😊';
      case 'hydration': return '💧';
      default: return '📝';
    }
  };

  const formatLogDescription = (log: any) => {
    switch (log.type) {
      case 'exercise':
        return `${log.payload.activity} - ${log.payload.durationMinutes} min`;
      case 'nutrition':
        return `${log.payload.mealType}: ${log.payload.description}`;
      case 'mood':
        return `Mood: ${log.payload.score}/10, Energy: ${log.payload.energy}/10`;
      case 'hydration':
        return `${log.payload.amount}ml ${log.payload.drinkType}`;
      default:
        return 'Health log';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Health & Wellness
          </Text>
          <Text className="text-gray-600">
            Track your physical and mental wellbeing
          </Text>
        </View>

        {/* Today's Summary */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Today's Overview
          </Text>
          
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-2xl font-bold text-red-600 mb-1">
                {summary.exerciseCount}
              </Text>
              <Text className="text-gray-600 text-sm">Workouts</Text>
            </View>
            
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-2xl font-bold text-green-600 mb-1">
                {summary.nutritionCount}
              </Text>
              <Text className="text-gray-600 text-sm">Meals Logged</Text>
            </View>
            
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-2xl font-bold text-blue-600 mb-1">
                {summary.hydrationTotal}ml
              </Text>
              <Text className="text-gray-600 text-sm">Water Intake</Text>
            </View>
            
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-2xl font-bold text-yellow-600 mb-1">
                {summary.moodAverage.toFixed(1)}/10
              </Text>
              <Text className="text-gray-600 text-sm">Avg Mood</Text>
            </View>
          </View>
        </View>

        {/* Quick Log Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Log
          </Text>
          
          <View className="grid grid-cols-2 gap-3">
            {quickLogOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                className={`${option.color} rounded-2xl p-4 shadow-sm`}
                onPress={() => handleQuickLog(option.type)}
              >
                <Text className="text-3xl mb-2">{option.emoji}</Text>
                <Text className={`font-semibold ${option.textColor} mb-1`}>
                  {option.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {option.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">
              Recent Activity
            </Text>
            <TouchableOpacity
              onPress={() => {
                // Navigate to full health log history
                console.log('Show all health logs');
              }}
            >
              <Text className="text-primary-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          {recentLogs.length > 0 ? (
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {recentLogs.map((log, index) => (
                <View
                  key={log.id}
                  className={`p-4 flex-row items-center ${
                    index !== recentLogs.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-3">
                    <Text className="text-xl">{getLogIcon(log.type)}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 capitalize">
                      {log.type} Log
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {formatLogDescription(log)}
                    </Text>
                  </View>
                  
                  <Text className="text-gray-500 text-xs">
                    {new Date(log.recordedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 shadow-sm items-center">
              <Text className="text-4xl mb-2">📊</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </Text>
              <Text className="text-gray-600 text-center">
                Start tracking your health and wellness journey
              </Text>
            </View>
          )}
        </View>

        {/* Health Insights */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Health Tips
          </Text>
          
          <View className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6">
            <Text className="text-lg font-semibold text-primary-900 mb-2">
              💡 Stay Consistent
            </Text>
            <Text className="text-primary-800">
              Regular health tracking helps you identify patterns and make better decisions for your wellbeing.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}