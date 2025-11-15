import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, Linking, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserIcon, 
  CogIcon, 
  BellIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  HeartIcon
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';
import { showToast } from '../../lib/toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import healthService from '../../lib/health';

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  totalFocusMinutes: number;
  currentStreak: number;
  totalAchievements: number;
  healthLogsCount: number;
}

// Import the User type from the types file
import type { User } from '../../types';

// Local type for community stats
interface CommunityStats {
  challengesActive: number;
  badgesCount: number;
  friendsCount: number;
  leaderboardRank?: number;
}

export default function ProfileScreen() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const theme = useAppTheme();
  const { t } = useI18n();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ connected: boolean; provider: any }>({ connected: false, provider: null });

  useEffect(() => {
    (async () => {
      await healthService.initialize();
      setHealthStatus(healthService.getStatus());
    })();
  }, []);

  const handleConnectHealth = async () => {
    const ok = await healthService.connect();
    setHealthStatus(healthService.getStatus());
    if (!ok) {
      showToast.info(t('health_sync_unavailable'));
    }
  };
  const openURL = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert(t('error'), t('unable_to_open_link')));
  };

  // Fetch user profile
  const { 
    data: userProfile, 
    isLoading: isLoadingProfile, 
    refetch: refetchProfile,
    isRefetching: isRefreshingProfile 
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        return await apiClient.getProfile();
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        showToast.error('Failed to load profile');
        throw error;
      }
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      return await apiClient.updateProfile(updates);
    },
    onSuccess: (updatedUser: User) => {
      // Update auth store with new user data
      useAuthStore.getState().setUser(updatedUser);
      showToast.success('Profile updated successfully');
      refetchProfile();
    },
    onError: (error: any) => {
      console.error('Update profile error:', error);
      showToast.error(error.message || 'Failed to update profile');
    },
  });

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    refetchProfile();
  }, [refetchProfile]);

  // Fetch user stats (compose from existing endpoints)
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async (): Promise<UserStats> => {
      // No backend endpoint available; return safe defaults to avoid 404s
      return {
        totalTasks: 0,
        completedTasks: 0,
        totalFocusMinutes: 0,
        currentStreak: 0,
        totalAchievements: 0,
        healthLogsCount: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Community summary for the profile
  const community: CommunityStats = {
    challengesActive: 0,
    badgesCount: Number(stats?.totalAchievements ?? 0) || 0,
    friendsCount: 0,
    leaderboardRank: undefined,
  };

  const handleLogout = async () => {
    setLogoutDialogVisible(true);
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      await setBiometricEnabled(enabled);
    } catch (error) {
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const menuSections = [
    {
      title: t('account'),
      items: [
        {
          id: 'edit-profile',
          title: t('edit_profile'),
          description: t('update_personal_info'),
          icon: PencilIcon,
          onPress: () => router.push('/edit-profile' as any),
        },
        {
          id: 'achievements',
          title: t('achievements'),
          description: t('view_badges_milestones'),
          icon: TrophyIcon,
          onPress: () => router.push('/achievements' as any),
        },
        {
          id: 'analytics',
          title: t('analytics'),
          description: t('detailed_insights_reports'),
          icon: ChartBarIcon,
          onPress: () => router.push('/analytics' as any),
        },
      ],
    },
    {
      title: t('settings'),
      items: [
        {
          id: 'settings',
          title: t('settings'),
          description: 'Notifications, privacy, preferences',
          icon: CogIcon,
          onPress: () => router.push('/modals/settings'),
        },
      ],
    },
    {
      title: t('social'),
      items: [
        {
          id: 'social-community',
          title: t('social'),
          description: t('feed_challenges_connections'),
          icon: UserIcon,
          onPress: () => router.push('/social' as any),
        },
      ],
    },
    {
      title: t('support'),
      items: [
        {
          id: 'help',
          title: t('help_support'),
          description: t('get_help_and_contact_support'),
          icon: QuestionMarkCircleIcon,
          onPress: () => Alert.alert(t('coming_soon'), 'Help & Support will be available soon.'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6">
          <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.foreground }}>{t('profile')}</Text>
          <Text style={{ color: theme.colors.muted }}>{t('manage_account_and_prefs')}</Text>
        </View>

        {/* User Info Card */}
        <View style={{ paddingHorizontal: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
          <View style={{
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radii['3xl'],
            padding: theme.spacing.xl
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing.md,
                backgroundColor: theme.colors.primaryLight
              }}>
                <UserIcon size={40} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 24, // 2xl equivalent
                  fontWeight: '700',
                  color: theme.colors.foreground,
                  marginBottom: theme.spacing.xs
                }}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={{
                  fontSize: 18, // lg equivalent
                  color: theme.colors.muted
                }}>
                  {user?.email}
                </Text>
                {user?.isStudent && (
                  <View className="mt-2">
                    <View className="rounded-full px-3 py-1 self-start" style={{ backgroundColor: theme.colors.successBg }}>
                      <Text className="text-sm font-medium" style={{ color: theme.colors.success }}>
                        Student Account
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity onPress={() => router.push('/challenges' as any)}>
                  <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                    <View className="flex-row items-center justify-between">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <TrophyIcon size={24} color={'#FFFFFF'} />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                          {community.challengesActive}
                        </Text>
                        <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('active_challenges')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity onPress={() => router.push('/leaderboard' as any)}>
                  <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                    <View className="flex-row items-center justify-between">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <ChartBarIcon size={24} color={'#FFFFFF'} />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                          {community.leaderboardRank ? `#${community.leaderboardRank}` : '—'}
                        </Text>
                        <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('leaderboard')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              

              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity onPress={() => router.push('/social' as any)}>
                  <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                    <View className="flex-row items-center justify-between">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <UserIcon size={24} color={'#FFFFFF'} />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                          {community.friendsCount}
                        </Text>
                        <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('connections')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <TouchableOpacity onPress={() => router.push('/achievements' as any)}>
                  <View className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
                    <View className="flex-row items-center justify-between">
                      <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                        <FireIcon size={24} color={'#FFFFFF'} />
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>
                          {community.badgesCount}
                        </Text>
                        <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('achievements')}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Biometric Setting */}
        <View className="px-6 mb-8">
          <View className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: theme.spacing.xl }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: theme.colors.primaryLight }}>
                  <ShieldCheckIcon size={24} color={theme.colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold" style={{ color: theme.colors.foreground }}>
                    Biometric Authentication
                  </Text>
                  <Text className="text-sm" style={{ color: theme.colors.muted }}>
                    Use Face ID or Touch ID to sign in
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} className="px-6 mb-8">
            <Text className="text-lg font-bold mb-4" style={{ color: theme.colors.foreground }}>
              {section.title}
            </Text>
            <View className="rounded-2xl shadow-sm" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  <TouchableOpacity
                    className="p-4 flex-row items-center"
                    onPress={item.onPress}
                  >
                    <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: theme.colors.surface }}>
                      <item.icon size={24} color={theme.colors.muted} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold" style={{ color: theme.colors.foreground }}>
                        {item.title}
                      </Text>
                      <Text className="text-sm" style={{ color: theme.colors.muted }}>
                        {item.description}
                      </Text>
                    </View>
                    <View className="ml-4">
                      <Text style={{ color: theme.colors.mutedAlt }}>›</Text>
                    </View>
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View className="h-px mx-4" style={{ backgroundColor: theme.colors.border }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Health Connect / Apple Health */}
        <View className="px-6 mb-8">
          <Text className="text-lg font-bold mb-4" style={{ color: theme.colors.foreground }}>
            {t('connect_health_services')}
          </Text>
          <View className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
            <Text className="mb-2" style={{ color: theme.colors.muted }}>
              {Platform.OS === 'android' ? t('connect_health_desc_android') : t('connect_health_desc_ios')}
            </Text>
            <View className="flex-row items-center justify-between mt-2">
              <View>
                <Text style={{ color: healthStatus.connected ? theme.colors.success : theme.colors.muted }}>
                  {healthStatus.connected ? t('connected') : t('not_connected')}
                </Text>
              </View>
              {healthStatus.connected ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      const ok = await healthService.fetchAndLogData();
                      if (ok) {
                        showToast.success(t('sync_now'), t('success'));
                      } else {
                        showToast.info(t('health_sync_unavailable'));
                      }
                    }}
                    className="px-4 py-3 rounded-2xl"
                    style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
                  >
                    <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('sync_now')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  disabled={healthStatus.connected}
                  onPress={handleConnectHealth}
                  className="px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl }}
                >
                  <Text style={{ color: theme.colors.primaryForeground, fontWeight: '600' }}>
                    {t('connect_now')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            className="rounded-2xl p-4 shadow-sm"
            style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.danger + '55', borderRadius: theme.radii.xl, padding: theme.spacing.xl }}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View className="flex-row items-center justify-center">
              <ArrowRightOnRectangleIcon size={24} color={theme.colors.danger} />
              <Text className="font-semibold text-lg ml-3" style={{ color: theme.colors.danger }}>
                {isLoggingOut ? t('signing_out') : t('sign_out')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="px-6 mb-8">
          <Text className="text-center text-sm" style={{ color: theme.colors.mutedAlt }}>
            {t('about_version')}
          </Text>
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View className="h-20" />
      </ScrollView>
      <ConfirmDialog
        visible={logoutDialogVisible}
        title={t('sign_out_title')}
        description={t('are_you_sure_sign_out')}
        confirmText={t('sign_out')}
        cancelText={t('cancel')}
        onCancel={() => setLogoutDialogVisible(false)}
        onConfirm={async () => {
          setLogoutDialogVisible(false);
          setIsLoggingOut(true);
          try {
            await logout();
            router.replace('/auth/login');
          } catch (error) {
            Alert.alert(t('error'), 'Failed to sign out');
          } finally {
            setIsLoggingOut(false);
          }
        }}
      />
    </SafeAreaView>
  );
}