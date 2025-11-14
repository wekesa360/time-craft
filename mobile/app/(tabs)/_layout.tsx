import { Tabs } from 'expo-router';
import { View } from 'react-native';
import type { ComponentType } from 'react';
import { useAuthStore } from '../../stores/auth';
import {
  HomeIcon,
  CheckCircleIcon,
  HeartIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
} from 'react-native-heroicons/outline';
import { useAppTheme } from '../../constants/dynamicTheme';

function TabBarIcon({ Icon, color, focused }: { Icon: ComponentType<{ color?: string; size?: number }>; color: string; focused?: boolean }) {
  const size = focused ? 28 : 24;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Icon color={color} size={size} />
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();
  const theme = useAppTheme();

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
          height: 80,
          elevation: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: theme.spacing.xs,
        },
        headerShown: false,
      }}
    >
      {/* Left */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={CheckCircleIcon} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={HeartIcon} color={color} />, 
        }}
      />
      {/* Center */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={HomeIcon} color={color} focused={focused} />,
        }}
      />
      {/* Right */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={CalendarIcon} color={color} focused={focused} />, 
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={UserIcon} color={color} focused={focused} />, 
        }}
      />
      {/* Hide Focus route if present to prevent it from showing in the tab bar */}
      <Tabs.Screen
        name="focus"
        options={{
          href: null,
        }}
      />
      {/* Show Social within tabs but keep it hidden from the tab bar */}
      <Tabs.Screen
        name="social"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}