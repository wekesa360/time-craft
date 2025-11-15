import { useFonts } from 'expo-font';
import { Slot, SplashScreen, router, useSegments } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../lib/toast';
import { biometricAuth } from '../lib/biometric-auth';
import { Alert } from 'react-native';

import '../global.css';
import { queryClient } from '../lib/query-client';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';
import { I18nProvider } from '../lib/i18n';
import { usePreferencesStore } from '../stores/preferences';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize, loginWithBiometric, logout } = useAuthStore();
  const { initialize: initializeNotifications } = useNotificationStore();
  const effectiveTheme = usePreferencesStore((s) => s.effectiveTheme);
  const segments = useSegments();
  const hasNavigatedRef = useRef(false);
  const biometricAttemptsRef = useRef(0);
  const hasCheckedBiometricRef = useRef(false);
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

  // Initialize authentication on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle automatic biometric authentication when app opens
  useEffect(() => {
    if (loaded && !isLoading && isAuthenticated && !hasCheckedBiometricRef.current) {
      hasCheckedBiometricRef.current = true;
      
      const checkAndPromptBiometric = async () => {
        try {
          const capabilities = await biometricAuth.getCapabilities();
          
          // Only prompt if biometric is available
          if (capabilities.isAvailable) {
            const result = await biometricAuth.authenticate({
              promptMessage: 'Authenticate to access the app',
              cancelLabel: 'Cancel',
              fallbackLabel: 'Use Passcode',
              disableDeviceFallback: false, // Allow PIN fallback
            });

            if (result.success) {
              // Success - reset attempts and continue
              biometricAttemptsRef.current = 0;
              await biometricAuth.setLastBiometricAuth();
            } else {
              // Failed - increment attempts
              biometricAttemptsRef.current += 1;
              
              if (biometricAttemptsRef.current >= 3) {
                // Force sign out after 3 failed attempts
                Alert.alert(
                  'Authentication Failed',
                  'Too many failed authentication attempts. Please sign in again.',
                  [
                    {
                      text: 'Sign In',
                      onPress: async () => {
                        await logout();
                        router.replace('/auth/login');
                      },
                    },
                  ],
                  { cancelable: false }
                );
              } else {
                // Show remaining attempts
                const remaining = 3 - biometricAttemptsRef.current;
                Alert.alert(
                  'Authentication Failed',
                  `Authentication failed. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                  [
                    {
                      text: 'Try Again',
                      onPress: () => {
                        hasCheckedBiometricRef.current = false;
                        checkAndPromptBiometric();
                      },
                    },
                    {
                      text: 'Sign In',
                      style: 'cancel',
                      onPress: async () => {
                        await logout();
                        router.replace('/auth/login');
                      },
                    },
                  ]
                );
              }
            }
          } else {
            // Biometric not available - allow access without prompt
            // User can still use the app, just without biometric protection
          }
        } catch (error) {
          console.error('Biometric check error:', error);
          // On error, allow access (don't block the user)
        }
      };

      // Small delay to ensure app is fully loaded
      setTimeout(() => {
        checkAndPromptBiometric();
      }, 500);
    }
  }, [loaded, isAuthenticated, isLoading, logout]);

  // Handle authentication-based routing and initialize notifications
  useEffect(() => {
    if (loaded && !isLoading) {
      if (isAuthenticated) {
        // User is authenticated, initialize notifications
        initializeNotifications();
      }
    }
  }, [loaded, isAuthenticated, isLoading, initializeNotifications]);

  // Handle navigation separately to avoid timing issues
  // Only redirect on initial load, not on every route change
  useEffect(() => {
    if (loaded && !isLoading && !hasNavigatedRef.current) {
      // Use requestAnimationFrame to ensure the Root Layout is fully mounted
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            // Get current route path (read fresh each time)
            const currentPath = segments.length > 0 ? segments.join('/') : '';
            
            // Allow auth routes (login, register, verify-email, forgot-password) without authentication
            const allowedAuthRoutes = ['auth/login', 'auth/register', 'auth/verify-email', 'auth/forgot-password'];
            const isAllowedAuthRoute = allowedAuthRoutes.some(route => currentPath.includes(route));
            const isAuthRoute = currentPath.startsWith('auth');
            
            if (isAuthenticated) {
              // If authenticated and on an auth route (except verify-email), redirect to dashboard
              if (isAuthRoute && !currentPath.includes('verify-email')) {
                router.replace('/(tabs)/dashboard');
              }
              hasNavigatedRef.current = true;
            } else {
              // If not authenticated, only redirect to login if NOT on an allowed auth route
              // This allows users to stay on verify-email, register, login, or forgot-password pages
              if (isAllowedAuthRoute || isAuthRoute) {
                // User is on an allowed auth route, don't redirect - just mark as navigated
                hasNavigatedRef.current = true;
              } else if (!currentPath || currentPath === '') {
                // If no current path (initial load), redirect to login
                router.replace('/auth/login');
                hasNavigatedRef.current = true;
              } else {
                // On a protected route without auth, redirect to login
                router.replace('/auth/login');
                hasNavigatedRef.current = true;
              }
            }
          } catch (error) {
            // Navigation might fail if already on the correct route
            console.log('Navigation skipped:', error);
            hasNavigatedRef.current = true;
          }
        }, 200);
      });
    }
  }, [loaded, isAuthenticated, isLoading, segments]);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
          <I18nProvider>
            <Slot />
            <Toast config={toastConfig} />
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}