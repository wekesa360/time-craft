import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-4">
      <View className="bg-white rounded-2xl p-8 shadow-lg max-w-sm w-full">
        <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
          TimeCraft
        </Text>
        <Text className="text-lg text-gray-600 text-center mb-8">
          Your Time & Wellness Companion
        </Text>
        
        <View className="space-y-4">
          <Link 
            href="/auth/login"
            className="bg-primary-600 rounded-xl py-4 px-6 text-center"
          >
            <Text className="text-white font-semibold text-lg">
              Get Started
            </Text>
          </Link>
        </View>
      </View>
    </View>
  );
}