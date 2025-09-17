import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useFocusStore } from '../../stores/focus';
import FocusSetup from '../../components/focus/FocusSetup';
import FocusTimer from '../../components/focus/FocusTimer';
import SessionComplete from '../../components/focus/SessionComplete';

export default function FocusScreen() {
  const { 
    currentSession, 
    timeRemaining, 
    isTimerActive,
    fetchSessions 
  } = useFocusStore();
  
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    fetchSessions();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications to get alerts when your focus sessions complete.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSessionStart = () => {
    // Session started, timer will show automatically
  };

  const handleTimerComplete = () => {
    setShowCompletion(true);
  };

  const handleCompletionFinish = () => {
    setShowCompletion(false);
  };

  const renderContent = () => {
    if (showCompletion && currentSession) {
      return (
        <SessionComplete
          sessionDuration={currentSession.duration}
          onComplete={handleCompletionFinish}
        />
      );
    }

    if (currentSession) {
      return (
        <FocusTimer onComplete={handleTimerComplete} />
      );
    }

    return (
      <FocusSetup onSessionStart={handleSessionStart} />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Focus Timer
        </Text>
        <Text className="text-gray-600 mt-1">
          {currentSession 
            ? `${currentSession.type.replace('_', ' ')} session active`
            : 'Stay focused and productive'
          }
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 py-4">
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}