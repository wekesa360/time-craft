import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TaskForm from '../../components/tasks/TaskForm';

export default function CreateTaskModal() {
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
          New Task
        </Text>
        
        <View className="w-16" />
      </View>

      {/* Task Form */}
      <TaskForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}