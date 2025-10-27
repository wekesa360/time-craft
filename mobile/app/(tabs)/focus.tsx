import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  ClockIcon,
  FireIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api-client';

interface FocusSession {
  id: string;
  sessionType: string;
  plannedDuration: number;
  actualDuration?: number;
  startedAt: string;
  completedAt?: string;
  isSuccessful: boolean;
  productivityRating?: number;
  notes?: string;
}

interface FocusTemplate {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  sessionType: string;
  durationMinutes: number;
  breakDurationMinutes: number;
  isDefault: boolean;
}

interface FocusStats {
  totalSessions: number;
  totalMinutes: number;
  averageRating: number;
  streakDays: number;
  todayMinutes: number;
  weeklyMinutes: number;
}

export default function FocusScreen() {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const queryClient = useQueryClient();

  // Fetch focus templates
  const { data: templates = [] } = useQuery({
    queryKey: ['focus-templates'],
    queryFn: async (): Promise<FocusTemplate[]> => {
      const response = await apiClient.get('/focus/templates');
      return response.data.templates || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch focus stats
  const { data: stats } = useQuery({
    queryKey: ['focus-stats'],
    queryFn: async (): Promise<FocusStats> => {
      const response = await apiClient.get('/focus/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent sessions
  const { data: recentSessions = [] } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: async (): Promise<FocusSession[]> => {
      const response = await apiClient.getFocusSessions({ limit: 10 });
      return response.sessions || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create focus session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (session: { sessionType: string; plannedDuration: number; templateId?: string }) => {
      return apiClient.createFocusSession(session);
    },
    onSuccess: (data) => {
      setActiveSession(data.session);
      setTimeRemaining(data.session.plannedDuration * 60); // Convert to seconds
      setIsRunning(true);
      setIsPaused(false);
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to start focus session');
    },
  });

  // Update focus session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, updates }: { sessionId: string; updates: any }) => {
      return apiClient.updateFocusSession(sessionId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['focus-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Session completed
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeRemaining]);

  const startSession = (template: FocusTemplate) => {
    createSessionMutation.mutate({
      sessionType: template.sessionType,
      plannedDuration: template.durationMinutes,
      templateId: template.id,
    });
  };

  const pauseSession = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const resumeSession = () => {
    setIsPaused(false);
    setIsRunning(true);
  };

  const stopSession = () => {
    if (activeSession) {
      const actualDuration = Math.ceil((activeSession.plannedDuration * 60 - timeRemaining) / 60);
      
      updateSessionMutation.mutate({
        sessionId: activeSession.id,
        updates: {
          actualDuration,
          completedAt: new Date().toISOString(),
          isSuccessful: false, // Stopped early
        }
      });
    }
    
    resetSession();
  };

  const handleSessionComplete = () => {
    if (activeSession) {
      updateSessionMutation.mutate({
        sessionId: activeSession.id,
        updates: {
          actualDuration: activeSession.plannedDuration,
          completedAt: new Date().toISOString(),
          isSuccessful: true,
        }
      });
      
      // Show completion alert
      Alert.alert(
        'Session Complete! 🎉',
        `Great job! You completed a ${activeSession.plannedDuration}-minute ${activeSession.sessionType} session.`,
        [
          {
            text: 'Rate Session',
            onPress: () => router.push(`/modals/rate-session?id=${activeSession.id}`),
          },
          { text: 'Done', style: 'default' },
        ]
      );
    }
    
    resetSession();
  };

  const resetSession = () => {
    setActiveSession(null);
    setTimeRemaining(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'pomodoro': return '🍅';
      case 'deep_work': return '🧠';
      case 'meditation': return '🧘‍♂️';
      case 'study': return '📚';
      case 'creative': return '🎨';
      default: return '⏰';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'pomodoro': return 'bg-red-100 text-red-700 border-red-200';
      case 'deep_work': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'meditation': return 'bg-green-100 text-green-700 border-green-200';
      case 'study': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'creative': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Focus</Text>
          <Text className="text-gray-600">Deep work sessions and productivity tracking</Text>
        </View>

        {/* Active Session or Timer */}
        <View className="px-6 mb-8">
          <View className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            {activeSession ? (
              <View className="items-center">
                {/* Session Info */}
                <View className={`px-4 py-2 rounded-full border mb-6 ${getSessionTypeColor(activeSession.sessionType)}`}>
                  <Text className="font-medium capitalize">
                    {getSessionTypeIcon(activeSession.sessionType)} {activeSession.sessionType}
                  </Text>
                </View>

                {/* Timer Display */}
                <Text className="text-6xl font-bold text-gray-900 mb-2">
                  {formatTime(timeRemaining)}
                </Text>
                <Text className="text-gray-500 mb-8">
                  {activeSession.plannedDuration} minute session
                </Text>

                {/* Controls */}
                <View className="flex-row items-center space-x-4">
                  {!isRunning && !isPaused ? (
                    <TouchableOpacity
                      className="bg-blue-600 rounded-full p-4"
                      onPress={resumeSession}
                    >
                      <PlayIcon size={32} color="white" />
                    </TouchableOpacity>
                  ) : isPaused ? (
                    <TouchableOpacity
                      className="bg-blue-600 rounded-full p-4"
                      onPress={resumeSession}
                    >
                      <PlayIcon size={32} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="bg-orange-500 rounded-full p-4"
                      onPress={pauseSession}
                    >
                      <PauseIcon size={32} color="white" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    className="bg-red-500 rounded-full p-4"
                    onPress={stopSession}
                  >
                    <StopIcon size={32} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View className="w-full mt-8">
                  <View className="bg-gray-200 rounded-full h-2">
                    <View 
                      className="bg-blue-600 rounded-full h-2 transition-all duration-1000"
                      style={{ 
                        width: `${((activeSession.plannedDuration * 60 - timeRemaining) / (activeSession.plannedDuration * 60)) * 100}%` 
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="items-center">
                <ClockIcon size={64} color="#D1D5DB" />
                <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">
                  Ready to Focus?
                </Text>
                <Text className="text-gray-500 text-center">
                  Choose a focus template below to start your session
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Focus Stats */}
        {stats && (
          <View className="px-6 mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Your Progress</Text>
            
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <ClockIcon size={24} color="#3B82F6" />
                    <Text className="text-2xl font-bold text-blue-600">
                      {stats.todayMinutes}m
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Today's Focus
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <FireIcon size={24} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-orange-600">
                      {stats.streakDays}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Day Streak
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <ChartBarIcon size={24} color="#10B981" />
                    <Text className="text-2xl font-bold text-green-600">
                      {stats.totalSessions}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Total Sessions
                  </Text>
                </View>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <BoltIcon size={24} color="#8B5CF6" />
                    <Text className="text-2xl font-bold text-purple-600">
                      {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm font-medium">
                    Avg Rating
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Focus Templates */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Focus Templates</Text>
            <TouchableOpacity>
              <AdjustmentsHorizontalIcon size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View className="space-y-3">
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                onPress={() => !activeSession && startSession(template)}
                disabled={!!activeSession}
              >
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                    template.isDefault ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Text className="text-2xl">
                      {getSessionTypeIcon(template.sessionType)}
                    </Text>
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="font-semibold text-gray-900 text-lg">
                        {template.name}
                      </Text>
                      {template.isDefault && (
                        <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
                          <Text className="text-xs font-medium text-blue-700">
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-500 text-sm mb-2">
                      {template.description}
                    </Text>
                    <View className="flex-row items-center">
                      <ClockIcon size={16} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">
                        {template.durationMinutes} minutes
                      </Text>
                      {template.breakDurationMinutes > 0 && (
                        <>
                          <Text className="text-gray-400 mx-2">•</Text>
                          <Text className="text-gray-500 text-sm">
                            {template.breakDurationMinutes}m break
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View className="ml-4">
                    <PlayIcon size={24} color={activeSession ? "#D1D5DB" : "#3B82F6"} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Recent Sessions</Text>
          
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {recentSessions && recentSessions.length > 0 ? (
              recentSessions.slice(0, 5).map((session, index) => (
                <View key={session.id}>
                  <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                      <Text className="text-lg">
                        {getSessionTypeIcon(session.sessionType)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 capitalize">
                        {session.sessionType}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {session.actualDuration || session.plannedDuration} minutes
                        {session.isSuccessful ? ' • Completed' : ' • Stopped early'}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {new Date(session.startedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    {session.productivityRating && (
                      <View className="bg-yellow-100 rounded-full px-2 py-1">
                        <Text className="text-yellow-700 text-sm font-medium">
                          ⭐ {session.productivityRating}/5
                        </Text>
                      </View>
                    )}
                  </View>
                  {index < recentSessions.length - 1 && index < 4 && (
                    <View className="h-px bg-gray-100 mx-4" />
                  )}
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <ClockIcon size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-center mt-4">
                  No focus sessions yet
                </Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
                  Start your first focus session to see your history here
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}