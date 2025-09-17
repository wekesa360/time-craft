import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-6 py-8">
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
            <Text className="text-primary-600 text-3xl font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-gray-600 mt-1">
            {user?.email}
          </Text>
        </View>

        <View className="space-y-4 mb-8">
          <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Edit Profile</Text>
              <Text className="text-gray-500 text-sm">Update your information</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between"
            onPress={() => router.push('/modals/settings')}
          >
            <View>
              <Text className="font-semibold text-gray-900">Settings</Text>
              <Text className="text-gray-500 text-sm">App preferences</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">Help & Support</Text>
              <Text className="text-gray-500 text-sm">Get help when you need it</Text>
            </View>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          className="bg-red-500 rounded-2xl py-4 px-6"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-center">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}