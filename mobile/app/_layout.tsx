import { useFonts } from 'expo-font';
import { Slot, SplashScreen, router } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '../global.css';
import { queryClient } from '../lib/query-client';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { initialize: initializeNotifications } = useNotificationStore();
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle authentication-based routing and initialize notifications
  useEffect(() => {
    if (loaded && !isLoading) {
      if (isAuthenticated) {
        // User is authenticated, initialize notifications and redirect to tabs
        initializeNotifications();
        
        if (!router.canGoBack()) {
          router.replace('/(tabs)/dashboard');
        }
      } else {
        // User is not authenticated, redirect to login
        router.replace('/auth/login');
      }
    }
  }, [loaded, isAuthenticated, isLoading, initializeNotifications]);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Slot />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}