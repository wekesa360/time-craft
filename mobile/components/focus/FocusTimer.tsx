import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusStore } from '../../stores/focus';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const TIMER_SIZE = width * 0.7;

interface FocusTimerProps {
  onComplete?: () => void;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ onComplete }) => {
  const {
    currentSession,
    timeRemaining,
    isTimerActive,
    isPaused,
    setTimeRemaining,
    setTimerActive,
    pauseSession,
    resumeSession,
    cancelSession,
  } = useFocusStore();

  const animatedValue = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer logic
  useEffect(() => {
    if (isTimerActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(timeRemaining - 1);
        
        // Pulse animation every second
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        // Haptic feedback at certain intervals
        if (timeRemaining <= 10 && timeRemaining > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (timeRemaining === 60) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerActive, timeRemaining]);

  // Handle completion
  useEffect(() => {
    if (isTimerActive && timeRemaining === 0) {
      setTimerActive(false);
      onComplete?.();
    }
  }, [timeRemaining, isTimerActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!currentSession) return 0;
    const totalSeconds = currentSession.plannedDuration * 60;
    const elapsed = totalSeconds - timeRemaining;
    return elapsed / totalSeconds;
  };

  const getSessionTypeEmoji = (sessionType: string): string => {
    switch (sessionType) {
      case 'pomodoro': return '🍅';
      case 'deep_work': return '🎯';
      case 'break': return '☕';
      default: return '⏰';
    }
  };

  const getSessionTypeColor = (sessionType: string): string => {
    switch (sessionType) {
      case 'pomodoro': return '#ef4444'; // red
      case 'deep_work': return '#3b82f6'; // blue
      case 'break': return '#22c55e'; // green
      default: return '#6b7280'; // gray
    }
  };

  if (!currentSession) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-gray-500 text-lg">No active session</Text>
      </View>
    );
  }

  const progress = getProgress();
  const sessionColor = getSessionTypeColor(currentSession.sessionType);

  return (
    <View className="items-center justify-center py-8">
      {/* Timer Circle */}
      <Animated.View
        style={{
          transform: [{ scale: animatedValue }],
        }}
        className="relative items-center justify-center"
      >
        {/* Background Circle */}
        <View
          style={{
            width: TIMER_SIZE,
            height: TIMER_SIZE,
            borderRadius: TIMER_SIZE / 2,
          }}
          className="bg-gray-100 items-center justify-center"
        >
          {/* Progress Circle */}
          <View
            style={{
              position: 'absolute',
              width: TIMER_SIZE,
              height: TIMER_SIZE,
              borderRadius: TIMER_SIZE / 2,
              borderWidth: 8,
              borderColor: sessionColor,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [
                { rotate: `${progress * 360 - 90}deg` }
              ],
            }}
          />
          
          {/* Session Info */}
          <View className="items-center">
            <Text style={{ fontSize: 48 }}>
              {getSessionTypeEmoji(currentSession.sessionType)}
            </Text>
            
            <Text
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: sessionColor,
                marginTop: 8,
              }}
            >
              {formatTime(timeRemaining)}
            </Text>
            
            <Text className="text-gray-600 text-lg mt-2 capitalize">
              {currentSession.sessionType.replace('_', ' ')}
            </Text>
            
            {isPaused && (
              <View className="bg-yellow-100 px-3 py-1 rounded-full mt-2">
                <Text className="text-yellow-700 font-medium">Paused</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Progress Bar */}
      <View className="w-full max-w-xs mt-8 mb-6">
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            style={{
              width: `${progress * 100}%`,
              backgroundColor: sessionColor,
            }}
            className="h-full rounded-full"
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-500 text-sm">
            {Math.floor(progress * 100)}% complete
          </Text>
          <Text className="text-gray-500 text-sm">
            {currentSession.plannedDuration} min session
          </Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View className="flex-row gap-4 mt-4">
        <TouchableOpacity
          className={`px-6 py-3 rounded-xl ${
            isPaused ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          onPress={isPaused ? resumeSession : pauseSession}
        >
          <Text className="text-white font-semibold">
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="px-6 py-3 rounded-xl bg-red-500"
          onPress={cancelSession}
        >
          <Text className="text-white font-semibold">
            🛑 Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Session Details */}
      {((currentSession as any)?.taskId) && (
        <View className="mt-6 bg-gray-100 rounded-xl p-4">
          <Text className="text-gray-700 font-medium">
            Working on task: {(currentSession as any).taskId}
          </Text>
        </View>
      )}
    </View>
  );
};

export default FocusTimer;