import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ExerciseForm from '../../components/health/ExerciseForm';

export default function LogExerciseModal() {
  const handleSuccess = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={handleCancel}>
          <Text className="text-primary-600 font-semibold text-lg">Cancel</Text>
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-gray-900">
          Log Workout
        </Text>
        
        <View className="w-16" />
      </View>

      {/* Exercise Form */}
      <ExerciseForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}