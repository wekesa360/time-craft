import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useAppTheme } from '../constants/dynamicTheme';

export default function HomeScreen() {
  const theme = useAppTheme();
  return (
    <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: theme.colors.card }}>
      <View className="rounded-2xl p-8 shadow-lg max-w-sm w-full" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}>
        <Text className="text-3xl font-bold text-center mb-4" style={{ color: theme.colors.foreground }}>
          TimeCraft
        </Text>
        <Text className="text-lg text-center mb-8" style={{ color: theme.colors.muted }}>
          Your Time & Wellness Companion
        </Text>
        
        <View className="space-y-4">
          <Link 
            href="/auth/login"
            className="rounded-xl py-4 px-6 text-center"
            style={{ backgroundColor: theme.colors.primary }}
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