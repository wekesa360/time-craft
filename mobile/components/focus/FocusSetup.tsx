import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusStore } from '../../stores/focus';
import { useTaskStore } from '../../stores/tasks';

interface FocusSetupProps {
  onSessionStart: () => void;
}

const FocusSetup: React.FC<FocusSetupProps> = ({ onSessionStart }) => {
  const { 
    startFocusSession, 
    isLoading, 
    pomodoroSettings 
  } = useFocusStore();
  
  const { tasks } = useTaskStore();

  const handleStartSession = async (
    type: 'pomodoro' | 'deep_work' | 'break',
    duration: number,
    taskId?: string
  ) => {
    try {
      await startFocusSession({
        duration,
        taskId,
        type,
      });
      onSessionStart();
    } catch (error) {
      // Error handling is done in the store
    }
  };

  const focusOptions = [
    {
      type: 'pomodoro' as const,
      title: 'Pomodoro',
      subtitle: `${pomodoroSettings.workDuration} minutes of focused work`,
      emoji: '🍅',
      color: 'bg-red-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      duration: pomodoroSettings.workDuration,
      description: 'Perfect for tasks that need intense focus',
    },
    {
      type: 'deep_work' as const,
      title: 'Deep Work',
      subtitle: '60 minutes of uninterrupted focus',
      emoji: '🎯',
      color: 'bg-blue-100',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      duration: 60,
      description: 'For complex tasks requiring sustained attention',
    },
    {
      type: 'break' as const,
      title: 'Break Time',
      subtitle: `${pomodoroSettings.shortBreakDuration} minutes to recharge`,
      emoji: '☕',
      color: 'bg-green-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      duration: pomodoroSettings.shortBreakDuration,
      description: 'Relax and prepare for your next session',
    },
  ];

  const customDurations = [15, 30, 45, 90];
  const pendingTasks = tasks.filter(task => task.status === 'pending').slice(0, 3);

  return (
    <ScrollView className="flex-1">
      <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Start Focus Session
          </Text>
          <Text className="text-gray-600">
            Choose your focus mode and stay productive
          </Text>
        </View>

        {/* Focus Mode Options */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Focus Modes
          </Text>
          
          <View className="space-y-4">
            {focusOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                className={`${option.color} ${option.borderColor} border rounded-2xl p-6 shadow-sm`}
                onPress={() => handleStartSession(option.type, option.duration)}
                disabled={isLoading}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-3xl mr-4">{option.emoji}</Text>
                    <View className="flex-1">
                      <Text className={`font-bold text-lg ${option.textColor}`}>
                        {option.title}
                      </Text>
                      <Text className={`${option.textColor.replace('700', '600')} mt-1`}>
                        {option.subtitle}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-2">
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <Text className="text-gray-400 text-2xl">›</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Durations */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Custom Duration
          </Text>
          
          <View className="flex-row flex-wrap gap-3">
            {customDurations.map((duration) => (
              <TouchableOpacity
                key={duration}
                className="bg-gray-100 border border-gray-300 rounded-xl px-6 py-3"
                onPress={() => handleStartSession('deep_work', duration)}
                disabled={isLoading}
              >
                <Text className="font-semibold text-gray-700">
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Task Selection */}
        {pendingTasks.length > 0 && (
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Work on a Task
            </Text>
            
            <View className="space-y-3">
              {pendingTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                  onPress={() => handleStartSession('pomodoro', pomodoroSettings.workDuration, task.id)}
                  disabled={isLoading}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        {task.title}
                      </Text>
                      {task.description && (
                        <Text className="text-gray-600 text-sm" numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                      <View className="flex-row items-center mt-2">
                        <View className="bg-primary-100 px-2 py-1 rounded-full mr-2">
                          <Text className="text-primary-700 text-xs font-medium">
                            Priority {task.priority}
                          </Text>
                        </View>
                        {task.estimatedDuration && (
                          <Text className="text-gray-500 text-xs">
                            ~{task.estimatedDuration} min
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View className="ml-4">
                      <View className="bg-red-100 rounded-full px-3 py-2">
                        <Text className="text-red-700 font-semibold text-sm">
                          🍅 {pomodoroSettings.workDuration}m
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Pomodoro Stats */}
        <View className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 mb-6">
          <Text className="text-lg font-semibold text-red-900 mb-2">
            🍅 Pomodoro Technique
          </Text>
          <Text className="text-red-800 mb-3">
            Work in focused {pomodoroSettings.workDuration}-minute intervals with {pomodoroSettings.shortBreakDuration}-minute breaks.
          </Text>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-red-600 text-sm">Work</Text>
              <Text className="font-bold text-red-900">{pomodoroSettings.workDuration}m</Text>
            </View>
            <View>
              <Text className="text-red-600 text-sm">Short Break</Text>
              <Text className="font-bold text-red-900">{pomodoroSettings.shortBreakDuration}m</Text>
            </View>
            <View>
              <Text className="text-red-600 text-sm">Long Break</Text>
              <Text className="font-bold text-red-900">{pomodoroSettings.longBreakDuration}m</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View className="bg-blue-50 rounded-2xl p-6">
          <Text className="text-lg font-semibold text-blue-900 mb-2">
            💡 Focus Tips
          </Text>
          <Text className="text-blue-800">
            • Turn off notifications during focus sessions{'\n'}
            • Keep water nearby to stay hydrated{'\n'}
            • Have a clear goal for each session{'\n'}
            • Take breaks to maintain peak performance
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default FocusSetup;