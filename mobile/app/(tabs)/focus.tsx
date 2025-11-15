import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler, Animated } from 'react-native';
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
import { apiClient } from '../../lib/api';
import { useAppTheme } from '../../constants/dynamicTheme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../lib/toast';

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
  const theme = useAppTheme();
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [view, setView] = useState<'timer' | 'progress'>('timer');
  const queryClient = useQueryClient();
  const [backDialogVisible, setBackDialogVisible] = useState(false);
  const [completeDialogVisible, setCompleteDialogVisible] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Fetch focus templates
  const { data: templates = [] } = useQuery({
    queryKey: ['focus-templates'],
    queryFn: async (): Promise<FocusTemplate[]> => {
      const response = await apiClient.getFocusTemplates();
      return response.templates || response.data?.templates || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch focus stats
  const { data: stats } = useQuery({
    queryKey: ['focus-stats'],
    queryFn: async (): Promise<FocusStats> => {
      const response = await apiClient.getFocusStats();
      return response.stats || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch recent sessions
  const { data: recentSessions = [] } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: async (): Promise<FocusSession[]> => {
      const response = await apiClient.getFocusSessions({ limit: 10 });
      return response.sessions || response.data?.sessions || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create focus session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (session: { sessionType: string; plannedDuration: number; templateId?: string }) => {
      return apiClient.createFocusSession(session);
    },
    onSuccess: (data) => {
      const session = data.session || data;
      setActiveSession(session);
      setTimeRemaining(session.plannedDuration * 60); // Convert to seconds
      setIsRunning(true);
      setIsPaused(false);
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
    },
    onError: (error) => {
      showToast.error('Failed to start focus session', 'Error');
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
    let interval: ReturnType<typeof setInterval>;
    
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

  // Update progress animation
  useEffect(() => {
    if (activeSession && activeSession.plannedDuration && progressBarWidth > 0) {
      const totalSeconds = activeSession.plannedDuration * 60;
      const progress = totalSeconds > 0 ? (totalSeconds - timeRemaining) / totalSeconds : 0;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false, // width animation doesn't support native driver
      }).start();
    }
  }, [timeRemaining, activeSession, progressAnim, progressBarWidth]);

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
      setCompleteDialogVisible(true);
    }
    
    resetSession();
  };

  const resetSession = () => {
    setActiveSession(null);
    setTimeRemaining(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  // Intercept Android hardware back button while session is active
  useEffect(() => {
    const onBackPress = () => {
      if (activeSession) {
        setBackDialogVisible(true);
        return true; // Block default back action
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeSession, isRunning, isPaused, timeRemaining]);


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

  const getSessionTypeTheme = (type: string) => {
    switch (type) {
      case 'pomodoro':
        return { bg: theme.colors.danger + '20', text: theme.colors.danger, border: theme.colors.danger + '33' };
      case 'deep_work':
        return { bg: theme.colors.primaryLight, text: theme.colors.primary, border: theme.colors.primary + '55' };
      case 'meditation':
        return { bg: theme.colors.successBg, text: theme.colors.success, border: theme.colors.successBg };
      case 'study':
        return { bg: theme.colors.infoBg, text: theme.colors.info, border: theme.colors.infoBg };
      case 'creative':
        return { bg: theme.colors.warningBg, text: theme.colors.warning, border: theme.colors.warningBg };
      default:
        return { bg: theme.colors.surface, text: theme.colors.muted, border: theme.colors.border };
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>Focus</Text>
          <Text style={{ color: theme.colors.muted }}>Deep work sessions and productivity tracking</Text>
        </View>

        {/* Pager Tabs */}
        <View className="px-6 mb-4">
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            {[
              { id: 'timer', label: 'Timer' },
              { id: 'progress', label: 'Progress' },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setView(t.id as any)}
                style={{
                  paddingVertical: theme.spacing.lg,
                  paddingHorizontal: theme.spacing.xl,
                  borderRadius: theme.radii.xl,
                  backgroundColor: view === t.id ? theme.colors.primary : theme.colors.card,
                  borderWidth: 1,
                  borderColor: view === t.id ? theme.colors.primary : theme.colors.border,
                }}
              >
                <Text style={{ color: view === t.id ? theme.colors.primaryForeground : theme.colors.muted, fontWeight: '700' }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {view === 'timer' && (
        <View className="px-6 mb-8">
          <Card style={{ borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
            {activeSession ? (
              <View className="items-center">
                {/* Session Info */}
                <View className="px-4 py-2 rounded-full border mb-6" style={{ backgroundColor: getSessionTypeTheme(activeSession.sessionType).bg, borderColor: getSessionTypeTheme(activeSession.sessionType).border }}>
                  <Text className="font-medium capitalize" style={{ color: getSessionTypeTheme(activeSession.sessionType).text }}>
                    {getSessionTypeIcon(activeSession.sessionType)} {activeSession.sessionType}
                  </Text>
                </View>

                {/* Timer Display */}
                <Text className="text-6xl font-bold mb-2" style={{ color: theme.colors.foreground }}>
                  {formatTime(timeRemaining)}
                </Text>
                <Text style={{ color: theme.colors.muted }} className="mb-8">
                  {activeSession.plannedDuration} minute session
                </Text>

                {/* Controls */}
                <View className="flex-row items-center space-x-4">
                  {!isRunning && !isPaused ? (
                    <TouchableOpacity className="rounded-full p-4" style={{ backgroundColor: theme.colors.primary }} onPress={resumeSession}>
                      <PlayIcon size={theme.iconSizes.lg} color={theme.colors.primaryForeground} />
                    </TouchableOpacity>
                  ) : isPaused ? (
                    <TouchableOpacity className="rounded-full p-4" style={{ backgroundColor: theme.colors.primary }} onPress={resumeSession}>
                      <PlayIcon size={theme.iconSizes.lg} color={theme.colors.primaryForeground} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity className="rounded-full p-4" style={{ backgroundColor: theme.colors.warning }} onPress={pauseSession}>
                      <PauseIcon size={theme.iconSizes.lg} color={theme.colors.primaryForeground} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity className="rounded-full p-4" style={{ backgroundColor: theme.colors.danger }} onPress={stopSession}>
                    <StopIcon size={theme.iconSizes.lg} color={theme.colors.primaryForeground} />
                  </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View className="w-full mt-8" style={{ paddingHorizontal: 24 }}>
                  <View 
                    className="rounded-full h-2" 
                    style={{ backgroundColor: theme.colors.border }}
                    onLayout={(e) => {
                      const { width } = e.nativeEvent.layout;
                      setProgressBarWidth(width);
                    }}
                  >
                    <Animated.View 
                      className="rounded-full h-2"
                      style={{ 
                        backgroundColor: theme.colors.primary,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, progressBarWidth || 0],
                        }),
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="items-center">
                <ClockIcon size={64} color={theme.colors.mutedAlt} />
                <Text className="text-xl font-semibold mt-4 mb-2" style={{ color: theme.colors.foreground }}>
                  Ready to Focus?
                </Text>
                <Text className="text-center" style={{ color: theme.colors.muted }}>
                  Choose a focus template below to start your session
                </Text>
              </View>
            )}
          </Card>
        </View>
        )}

        {/* Focus Stats (Progress tab) */}
        {view === 'progress' && stats && (
          <View className="px-6 mb-8">
            <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>Your Progress</Text>
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Card style={{ padding: theme.spacing.lg }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <ClockIcon size={theme.iconSizes.md} color={theme.colors.info} />
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.info }}>
                      {stats.todayMinutes}m
                    </Text>
                  </View>
                  <Text className="text-sm font-medium" style={{ color: theme.colors.muted }}>
                    Today's Focus
                  </Text>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card style={{ padding: theme.spacing.lg }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <FireIcon size={theme.iconSizes.md} color={theme.colors.warning} />
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.warning }}>
                      {stats.streakDays}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium" style={{ color: theme.colors.muted }}>
                    Day Streak
                  </Text>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card style={{ padding: theme.spacing.lg }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <ChartBarIcon size={theme.iconSizes.md} color={theme.colors.success} />
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.success }}>
                      {stats.totalSessions}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium" style={{ color: theme.colors.muted }}>
                    Total Sessions
                  </Text>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card style={{ padding: theme.spacing.lg }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <BoltIcon size={theme.iconSizes.md} color={theme.colors.primary} />
                    <Text className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                      {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium" style={{ color: theme.colors.muted }}>
                    Avg Rating
                  </Text>
                </Card>
              </View>
            </View>
          </View>
        )}

        {/* Quick Start - only in Timer view */}
        {view === 'timer' && (
        <View className="px-6 mb-4">
          <Card style={{ padding: theme.spacing.lg }}>
            <Text className="text-lg font-bold mb-3" style={{ color: theme.colors.foreground }}>Quick Start</Text>
            <View className="flex-row items-center" style={{ gap: theme.spacing.sm, flexWrap: 'wrap' as any }}>
              {[
                { label: '15 min', type: 'pomodoro', duration: 15 },
                { label: '25 min', type: 'pomodoro', duration: 25 },
                { label: '45 min', type: 'deep_work', duration: 45 },
                { label: '90 min', type: 'deep_work', duration: 90 },
              ].map((q) => (
                <Button
                  key={q.label}
                  title={q.label}
                  variant="outline"
                  onPress={() => !activeSession && createSessionMutation.mutate({ sessionType: q.type as any, plannedDuration: q.duration })}
                />
              ))}
            </View>
          </Card>
        </View>
        )}

        {/* Focus Templates - only in Timer view */}
        {view === 'timer' && (
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: theme.colors.foreground }}>Focus Templates</Text>
            <TouchableOpacity>
              <AdjustmentsHorizontalIcon size={theme.iconSizes.md} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>
          
          <View className="space-y-3">
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                className="rounded-2xl"
                style={{ opacity: activeSession ? 0.6 : 1 }}
                onPress={() => !activeSession && startSession(template)}
                disabled={!!activeSession}
              >
                <Card style={{ padding: theme.spacing.lg }}>
                  <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4`} style={{ backgroundColor: template.isDefault ? theme.colors.primaryLight : theme.colors.surface }}>
                      <Text className="text-2xl">
                        {getSessionTypeIcon(template.sessionType)}
                      </Text>
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="font-semibold text-lg" style={{ color: theme.colors.foreground }}>
                          {template.name}
                        </Text>
                        {template.isDefault && (
                          <View className="ml-2 px-2 py-1 rounded-full" style={{ backgroundColor: theme.colors.primaryLight }}>
                            <Text className="text-xs font-medium" style={{ color: theme.colors.primary }}>
                              Default
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm mb-2" style={{ color: theme.colors.muted }}>
                        {template.description}
                      </Text>
                      <View className="flex-row items-center">
                        <ClockIcon size={theme.iconSizes.sm} color={theme.colors.muted} />
                        <Text className="text-sm ml-1" style={{ color: theme.colors.muted }}>
                          {template.durationMinutes} minutes
                        </Text>
                        {template.breakDurationMinutes > 0 && (
                          <>
                            <Text className="mx-2" style={{ color: theme.colors.mutedAlt }}>•</Text>
                            <Text className="text-sm" style={{ color: theme.colors.muted }}>
                              {template.breakDurationMinutes}m break
                            </Text>
                          </>
                        )}
                      </View>
                    </View>

                    <View className="ml-4">
                      <PlayIcon size={theme.iconSizes.md} color={activeSession ? '#D1D5DB' : theme.colors.primary} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        )}

        {/* Recent Sessions - only in Progress view */}
        {view === 'progress' && (
        <View className="px-6 mb-8">
          <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>Recent Sessions</Text>
          
          <Card style={{ padding: 0 }}>
            {recentSessions && recentSessions.length > 0 ? (
              recentSessions.slice(0, 5).map((session, index) => (
                <View key={session.id}>
                  <View className="p-4 flex-row items-center">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: theme.colors.primaryLight }}>
                      <Text className="text-lg">
                        {getSessionTypeIcon(session.sessionType)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold capitalize" style={{ color: theme.colors.foreground }}>
                        {session.sessionType}
                      </Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>
                        {session.actualDuration || session.plannedDuration} minutes
                        {session.isSuccessful ? ' • Completed' : ' • Stopped early'}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: theme.colors.mutedAlt }}>
                        {new Date(session.startedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    {session.productivityRating && (
                      <View className="rounded-full px-2 py-1" style={{ backgroundColor: theme.colors.warningBg }}>
                        <Text className="text-sm font-medium" style={{ color: theme.colors.warning }}>
                          ⭐ {session.productivityRating}/5
                        </Text>
                      </View>
                    )}
                  </View>
                  {index < recentSessions.length - 1 && index < 4 && (
                    <View className="h-px mx-4" style={{ backgroundColor: theme.colors.border }} />
                  )}
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <ClockIcon size={theme.iconSizes.lg} color={theme.colors.mutedAlt} />
                <Text className="text-center mt-4" style={{ color: theme.colors.muted }}>
                  No focus sessions yet
                </Text>
                <Text className="text-sm text-center mt-1" style={{ color: theme.colors.mutedAlt }}>
                  Start your first focus session to see your history here
                </Text>
              </View>
            )}
          </Card>
        </View>
        )}

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
      <ConfirmDialog
        visible={backDialogVisible}
        title={'Active session'}
        description={'A focus session is running. Do you want to stop it and leave?'}
        confirmText={'Stop & Leave'}
        cancelText={'Stay'}
        onCancel={() => setBackDialogVisible(false)}
        onConfirm={() => {
          setBackDialogVisible(false);
          stopSession();
          router.back();
        }}
      />
      <ConfirmDialog
        visible={completeDialogVisible}
        title={'Session Complete! 🎉'}
        description={'Great job completing your focus session.'}
        confirmText={'Done'}
        cancelText={'Rate (soon)'}
        onCancel={() => {
          setCompleteDialogVisible(false);
          showToast.info('Session rating will be available soon.');
        }}
        onConfirm={() => setCompleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}