import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../lib/api';
import { useAppTheme } from '../constants/dynamicTheme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { showToast } from '../lib/toast';
import { 
  HomeIcon,
  CheckCircleIcon,
  HeartIcon,
  CalendarIcon,
  UserIcon,
} from 'react-native-heroicons/outline';

// Tabs: badges, leaderboard, achievements

type TabKey = 'badges' | 'leaderboard' | 'achievements';

export default function AchievementsScreen() {
  const theme = useAppTheme();
  const [tab, setTab] = useState<TabKey>('badges');

  // Queries
  const { data: badgesData } = useQuery({
    queryKey: ['badges', 'user'],
    queryFn: () => apiClient.getBadges(),
    staleTime: 5 * 60_000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['badges', 'leaderboard'],
    queryFn: () => apiClient.getBadgeLeaderboard(),
    staleTime: 2 * 60_000,
  });

  const badges = badgesData?.badges || [];
  const totalBadges = badges.length;
  const unlockedBadges = badges.filter((b: any) => b.isUnlocked).length;
  const totalPoints = badges.filter((b: any) => b.isUnlocked).reduce((s: number, b: any) => s + (b.points || 0), 0);

  const recentUnlocked = useMemo(() => (
    badges
      .filter((b: any) => b.isUnlocked)
      .sort((a: any, b: any) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
      .slice(0, 6)
  ), [badges]);

  const handleShare = async (badge: any, platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'email' | 'whatsapp') => {
    try {
      await apiClient.shareBadge({ badgeId: badge.id || badge.badgeId, platform });
      showToast.success(`Badge shared on ${platform}`, 'Shared');
    } catch (e: any) {
      showToast.error(e?.response?.data?.error || 'Failed to share badge', 'Error');
    }
  };

  const TabButton = ({ id, label }: { id: TabKey; label: string }) => (
    <TouchableOpacity
      onPress={() => setTab(id)}
      style={{
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radii.xl,
        backgroundColor: tab === id ? theme.colors.primary : theme.colors.card,
        borderWidth: 1,
        borderColor: tab === id ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Text style={{ color: tab === id ? theme.colors.primaryForeground : theme.colors.muted, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: 120 }}>
        {/* Header with right back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
          <View style={{ width: 44 }} />
          <Text style={{ color: theme.colors.foreground, fontSize: 20, fontWeight: '800' }}>Achievements & Badges</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
          >
            <Text style={{ color: theme.colors.muted }}>‹</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: theme.colors.muted, marginBottom: theme.spacing.lg }}>Track your progress and celebrate milestones</Text>

        {/* Points Overview */}
        <View style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl, padding: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: theme.colors.primaryForeground + 'cc', marginBottom: 6 }}>Total Points Earned</Text>
              <Text style={{ color: theme.colors.primaryForeground, fontSize: 42, fontWeight: '800' }}>{totalPoints}</Text>
              <Text style={{ color: theme.colors.primaryForeground + 'cc', marginTop: 2 }}>
                Level {Math.floor(unlockedBadges / 5) + 1} - Wellness Champion
              </Text>
            </View>
            <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primaryForeground + '33', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Text style={{ color: theme.colors.primaryForeground, fontSize: 28 }}>🏆</Text>
              </View>
              <Text style={{ color: theme.colors.primaryForeground }}>{unlockedBadges} Badges</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <TabButton id="badges" label="My Badges" />
          <TabButton id="leaderboard" label="Leaderboard" />
          <TabButton id="achievements" label="Achievements" />
        </View>

        {tab === 'badges' && (
          <View style={{ gap: theme.spacing.lg }}>
            {/* Recent Achievements */}
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>Recent Achievements</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
                {recentUnlocked.length === 0 ? (
                  <View style={{ width: '100%', paddingHorizontal: 8 }}>
                    <Card>
                      <Text style={{ color: theme.colors.muted }}>No badges earned yet. Complete tasks, log health activities, and maintain streaks to earn your first badges.</Text>
                    </Card>
                  </View>
                ) : (
                  recentUnlocked.map((badge: any) => (
                    <View key={badge.id} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 12 }}>
                      <Card>
                        <View style={{ alignItems: 'center' }}>
                          <View style={{ width: 64, height: 64, borderRadius: theme.radii.xl, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                            <Text style={{ color: theme.colors.primaryForeground, fontSize: 28 }}>{badge.icon || '🏅'}</Text>
                          </View>
                          <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{badge.name}</Text>
                          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{badge.description}</Text>
                          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
                            {(['twitter','facebook','linkedin'] as const).map((p) => (
                              <Button key={p} title={`Share ${p}`} variant="outline" onPress={() => handleShare(badge, p)} />
                            ))}
                          </View>
                        </View>
                      </Card>
                    </View>
                  ))
                )}
              </View>
            </Card>

            {/* All Badges Grid */}
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>All Badges</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
                {badges.map((badge: any) => (
                  <View key={badge.id} style={{ width: '25%', paddingHorizontal: 8, marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => badge.isUnlocked && handleShare(badge, 'twitter')}>
                      <View style={{
                        aspectRatio: 1,
                        borderRadius: theme.radii.lg,
                        backgroundColor: badge.isUnlocked ? theme.colors.primary : theme.colors.input,
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Text style={{ fontSize: 24, color: badge.isUnlocked ? theme.colors.primaryForeground : theme.colors.muted }}>{badge.icon || '🏅'}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {tab === 'leaderboard' && (
          <View style={{ gap: theme.spacing.lg }}>
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>Badge Leaderboard</Text>
              <View style={{ gap: theme.spacing.sm }}>
                {(leaderboardData?.leaderboard || []).map((entry: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: idx < (leaderboardData?.leaderboard?.length || 0) - 1 ? 1 : 0, borderColor: theme.colors.border }}>
                    <Text style={{ color: theme.colors.foreground }}>{idx + 1}. {entry.displayName}</Text>
                    <Text style={{ color: theme.colors.muted }}>{entry.points} pts</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {tab === 'achievements' && (
          <View style={{ gap: theme.spacing.lg }}>
            {/* Active Streaks */}
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>Active Streaks</Text>
              <View style={{ gap: theme.spacing.sm }}>
                {badges.filter((b: any) => b.category === 'streak' && b.isUnlocked).slice(0, 4).map((badge: any) => (
                  <View key={badge.id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                    <View style={{ width: 56, height: 56, borderRadius: theme.radii.lg, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24 }}>🔥</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{badge.name}</Text>
                      <Text style={{ color: theme.colors.muted, marginTop: 2 }}>Current streak</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: theme.colors.foreground, fontWeight: '800', fontSize: 20 }}>{badge.progress?.current ?? 0}</Text>
                      <Text style={{ color: theme.colors.mutedAlt, fontSize: 12 }}>days</Text>
                    </View>
                  </View>
                ))}

                {badges.filter((b: any) => b.category === 'streak' && b.isUnlocked).length === 0 && (
                  <Text style={{ color: theme.colors.muted }}>No active streaks</Text>
                )}
              </View>
            </Card>

            {/* Progress Towards Next Badges */}
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>Progress Towards Next Badges</Text>
              <View style={{ gap: theme.spacing.md }}>
                {badges.filter((b: any) => !b.isUnlocked && (b.progress?.percentage ?? 0) > 0).slice(0, 5).map((badge: any) => (
                  <View key={badge.id} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{badge.name}</Text>
                      <Text style={{ color: theme.colors.muted }}>{badge.progress.current}/{badge.progress.target}</Text>
                    </View>
                    <View style={{ height: 8, borderRadius: theme.radii.pill, backgroundColor: theme.colors.input }}>
                      <View style={{ height: 8, borderRadius: theme.radii.pill, backgroundColor: theme.colors.primary, width: `${badge.progress.percentage}%` }} />
                    </View>
                    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{Math.round(badge.progress.percentage)}% complete • {Math.max(0, (badge.progress.target - badge.progress.current))} more to unlock</Text>
                  </View>
                ))}

                {badges.filter((b: any) => !b.isUnlocked && (b.progress?.percentage ?? 0) > 0).length === 0 && (
                  <Text style={{ color: theme.colors.muted }}>No badges in progress</Text>
                )}
              </View>
            </Card>
          </View>
        )}

        <View style={{ height: 64 }} />
      </ScrollView>
      {/* Fixed bottom navigation mimic */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingHorizontal: theme.spacing.xl }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks' as any)} style={{ alignItems: 'center' }}>
            <CheckCircleIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/health' as any)} style={{ alignItems: 'center' }}>
            <HeartIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Health</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/dashboard' as any)} style={{ alignItems: 'center' }}>
            <HomeIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar' as any)} style={{ alignItems: 'center' }}>
            <CalendarIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile' as any)} style={{ alignItems: 'center' }}>
            <UserIcon size={24} color={theme.colors.muted} />
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
