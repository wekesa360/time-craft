import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useNotificationStore } from '../../stores/notifications';

export default function SettingsModal() {
  const {
    biometricCapabilities,
    biometricEnabled,
    biometricAvailable,
    setBiometricEnabled,
    initializeBiometric,
    isLoading,
  } = useAuthStore();

  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    isLoading: notificationsLoading,
    pushToken,
  } = useNotificationStore();

  const [localBiometricEnabled, setLocalBiometricEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings);

  useEffect(() => {
    const initSettings = async () => {
      await initializeBiometric();
      setLocalBiometricEnabled(biometricEnabled);
      setLocalNotificationSettings(notificationSettings);
    };
    initSettings();
  }, [initializeBiometric, biometricEnabled, notificationSettings]);

  const handleBiometricToggle = async (value: boolean) => {
    setIsToggling(true);
    
    try {
      await setBiometricEnabled(value);
      setLocalBiometricEnabled(value);
      
      if (value) {
        Alert.alert(
          'Success',
          `${getBiometricText()} authentication has been enabled for quick sign-in.`
        );
      } else {
        Alert.alert(
          'Disabled',
          `${getBiometricText()} authentication has been disabled.`
        );
      }
    } catch (error) {
      setLocalBiometricEnabled(!value);
      Alert.alert(
        'Error',
        value 
          ? `Failed to enable ${getBiometricText()} authentication. Please try again.`
          : `Failed to disable ${getBiometricText()} authentication.`
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleNotificationToggle = async (setting: keyof typeof notificationSettings, value: boolean) => {
    setIsToggling(true);
    
    try {
      const newSettings = { ...localNotificationSettings, [setting]: value };
      setLocalNotificationSettings(newSettings);
      
      await updateNotificationSettings({ [setting]: value });
      
      Alert.alert(
        'Settings Updated',
        `${setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} notifications ${value ? 'enabled' : 'disabled'}.`
      );
    } catch (error) {
      // Revert local state on error
      setLocalNotificationSettings(prev => ({ ...prev, [setting]: !value }));
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.'
      );
    } finally {
      setIsToggling(false);
    }
  };

  const getBiometricIcon = () => {
    if (!biometricCapabilities?.supportedTypes.length) return '🔒';
    
    const types = biometricCapabilities.supportedTypes;
    if (types.includes(2)) return '👤'; // Face ID
    if (types.includes(1)) return '👆'; // Touch ID/Fingerprint
    if (types.includes(3)) return '👁️'; // Iris
    return '🔒';
  };

  const getBiometricText = () => {
    if (!biometricCapabilities?.supportedTypes.length) return 'Biometric';
    
    const types = biometricCapabilities.supportedTypes;
    if (types.includes(2)) return 'Face ID';
    if (types.includes(1)) return 'Touch ID';
    if (types.includes(3)) return 'Iris';
    return 'Biometric';
  };

  const getBiometricDescription = () => {
    const text = getBiometricText();
    return `Use ${text} to quickly sign in to your account`;
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity onPress={handleBack}>
          <Text className="text-primary-600 font-semibold text-lg">Back</Text>
        </TouchableOpacity>
        
        <Text className="text-lg font-semibold text-gray-900">
          Settings
        </Text>
        
        <View className="w-16" />
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Security Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-6">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Security</Text>
            </View>

            {/* Biometric Authentication */}
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-2xl mr-3">{getBiometricIcon()}</Text>
                    <Text className="font-semibold text-gray-900">
                      {getBiometricText()} Login
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    {getBiometricDescription()}
                  </Text>
                  
                  {!biometricAvailable && (
                    <Text className="text-red-500 text-xs mt-1">
                      {!biometricCapabilities?.hasHardware 
                        ? 'Not supported on this device'
                        : !biometricCapabilities?.isEnrolled
                        ? `${getBiometricText()} not set up in device settings`
                        : 'Not available'
                      }
                    </Text>
                  )}
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localBiometricEnabled}
                    onValueChange={handleBiometricToggle}
                    disabled={!biometricAvailable || isLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localBiometricEnabled ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            {/* Setup Instructions */}
            {biometricCapabilities?.hasHardware && !biometricCapabilities?.isEnrolled && (
              <View className="px-6 py-4 bg-yellow-50 border-t border-gray-100">
                <View className="flex-row items-start">
                  <Text className="text-yellow-600 mr-2">⚠️</Text>
                  <View className="flex-1">
                    <Text className="font-medium text-yellow-800 mb-1">
                      Setup Required
                    </Text>
                    <Text className="text-yellow-700 text-sm">
                      To use {getBiometricText()}, please set it up in your device settings first.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Notifications Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-6">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Notifications</Text>
              {!pushToken && (
                <Text className="text-sm text-orange-600 mt-1">Push notifications not available</Text>
              )}
            </View>

            {/* Task Reminders */}
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg mr-2">📝</Text>
                    <Text className="font-medium text-gray-900">Task Reminders</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">Get notified before tasks are due</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.taskReminders}
                    onValueChange={(value) => handleNotificationToggle('taskReminders', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.taskReminders ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px bg-gray-100 mx-6" />

            {/* Health Reminders */}
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg mr-2">🏥</Text>
                    <Text className="font-medium text-gray-900">Health Reminders</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">Hydration, mood check-ins, exercise</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.healthReminders}
                    onValueChange={(value) => handleNotificationToggle('healthReminders', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.healthReminders ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px bg-gray-100 mx-6" />

            {/* Focus Session Alerts */}
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg mr-2">🎯</Text>
                    <Text className="font-medium text-gray-900">Focus Session Alerts</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">Session completion and break reminders</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.focusSessionAlerts}
                    onValueChange={(value) => handleNotificationToggle('focusSessionAlerts', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.focusSessionAlerts ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px bg-gray-100 mx-6" />

            {/* Achievements */}
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg mr-2">🏆</Text>
                    <Text className="font-medium text-gray-900">Achievements</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">Celebrate your milestones</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.achievements}
                    onValueChange={(value) => handleNotificationToggle('achievements', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.achievements ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px bg-gray-100 mx-6" />

            {/* Weekly Reports */}
            <View className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-lg mr-2">📊</Text>
                    <Text className="font-medium text-gray-900">Weekly Reports</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">Weekly productivity summaries</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.weeklyReports}
                    onValueChange={(value) => handleNotificationToggle('weeklyReports', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.weeklyReports ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>
          </View>

          {/* App Preferences Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-6">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">App Preferences</Text>
            </View>

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">Notifications</Text>
                <Text className="text-gray-500 text-sm">Manage your notifications</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 mx-6" />

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">Theme</Text>
                <Text className="text-gray-500 text-sm">Light, dark, or system</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 mx-6" />

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">Language</Text>
                <Text className="text-gray-500 text-sm">English</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          </View>

          {/* Data & Privacy Section */}
          <View className="bg-white rounded-2xl shadow-sm mb-6">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">Data & Privacy</Text>
            </View>

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">Export Data</Text>
                <Text className="text-gray-500 text-sm">Download your data</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 mx-6" />

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View>
                <Text className="font-medium text-gray-900">Delete Account</Text>
                <Text className="text-gray-500 text-sm">Permanently delete your account</Text>
              </View>
              <Text className="text-red-400 text-xl">›</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View className="bg-white rounded-2xl shadow-sm">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-900">About</Text>
            </View>

            <View className="px-6 py-4">
              <Text className="text-gray-500 text-sm mb-2">TimeCraft Mobile</Text>
              <Text className="text-gray-400 text-xs">Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}