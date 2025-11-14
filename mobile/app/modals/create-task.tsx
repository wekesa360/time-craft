import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import TaskForm from '../../components/tasks/TaskForm';
import { useAppTheme } from '../../constants/dynamicTheme';

export default function CreateTaskModal() {
  const theme = useAppTheme();
  const handleSuccess = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between" style={{ backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 18 }}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={{ color: theme.colors.foreground, fontWeight: '600', fontSize: 18 }}>
          New Task
        </Text>
        
        <View style={{ width: 64 }} />
      </View>

      {/* Task Form */}
      <TaskForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}