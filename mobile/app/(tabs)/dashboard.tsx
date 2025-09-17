import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth';

export default function DashboardScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6">
        {/* Header */}
        <View className="pt-6 pb-8">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </Text>
          <Text className="text-gray-600 mt-1">
            Here's what's happening today
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="grid grid-cols-2 gap-4 mb-8">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-3xl font-bold text-primary-600 mb-2">
              12
            </Text>
            <Text className="text-gray-600 text-sm">
              Tasks Today
            </Text>
          </View>
          
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-3xl font-bold text-green-600 mb-2">
              4
            </Text>
            <Text className="text-gray-600 text-sm">
              Completed
            </Text>
          </View>
          
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-3xl font-bold text-purple-600 mb-2">
              2.5h
            </Text>
            <Text className="text-gray-600 text-sm">
              Focus Time
            </Text>
          </View>
          
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-3xl font-bold text-orange-600 mb-2">
              85%
            </Text>
            <Text className="text-gray-600 text-sm">
              Health Score
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          
          <View className="space-y-3">
            <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
              <View className="w-12 h-12 bg-primary-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-primary-600 text-xl">📝</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Add Task</Text>
                <Text className="text-gray-500 text-sm">Create a new task</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
              <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-green-600 text-xl">💚</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Log Health</Text>
                <Text className="text-gray-500 text-sm">Track your wellness</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
              <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4">
                <Text className="text-purple-600 text-xl">⏰</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">Start Focus</Text>
                <Text className="text-gray-500 text-sm">Begin a focus session</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </Text>
          
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-gray-500 text-center">
              Your recent activity will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}