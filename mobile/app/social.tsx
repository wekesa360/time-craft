import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../constants/dynamicTheme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { router } from 'expo-router';
import {
  UsersIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
} from 'react-native-heroicons/outline';

type TabKey = 'feed' | 'challenges' | 'connections';

export default function SocialScreen() {
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'active' | 'completed' | 'my'>('all');
  const queryClient = useQueryClient();

  // Queries
  const { data: feedData } = useQuery({
    queryKey: ['social-feed', { limit: 20, offset: 0 }],
    queryFn: () => apiClient.getSocialFeed({ limit: 20, offset: 0 }),
    staleTime: 60_000,
  });

  const { data: publicChallenges } = useQuery({
    queryKey: ['public-challenges', { limit: 20 }],
    queryFn: () => apiClient.getPublicChallenges({ limit: 20 }),
    staleTime: 60_000,
  });

  const { data: connections } = useQuery({
    queryKey: ['connections', { status: 'accepted' }],
    queryFn: () => apiClient.getConnections({ status: 'accepted' }),
    staleTime: 60_000,
  });

  const { data: pendingConnections } = useQuery({
    queryKey: ['connections', { status: 'pending' }],
    queryFn: () => apiClient.getConnections({ status: 'pending' }),
    staleTime: 60_000,
  });

  // Mutations
  const joinMutation = useMutation({
    mutationFn: (challengeId: string) => apiClient.joinChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-challenges'] });
      Alert.alert('Joined', 'You have joined the challenge');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.error || 'Failed to join challenge'),
  });

  const TabButton = ({ id, label }: { id: TabKey; label: string }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(id)}
      style={{
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radii.xl,
        backgroundColor: activeTab === id ? theme.colors.primary : theme.colors.card,
        borderWidth: 1,
        borderColor: activeTab === id ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Text
        style={{
          color: activeTab === id ? theme.colors.primaryForeground : theme.colors.muted,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const FilterChip = ({ id, label }: { id: 'all' | 'active' | 'completed' | 'my'; label: string }) => (
    <TouchableOpacity
      onPress={() => setChallengeFilter(id)}
      style={{
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.xl,
        backgroundColor: challengeFilter === id ? theme.colors.primary : theme.colors.card,
        borderWidth: 1,
        borderColor: challengeFilter === id ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Text
        style={{
          color: challengeFilter === id ? theme.colors.primaryForeground : theme.colors.muted,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl }}>
        {/* Header */}
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.foreground, fontSize: 28, fontWeight: '800' }}>
            Social & Community
          </Text>
          <Text style={{ color: theme.colors.muted, marginTop: 4 }}>
            Connect with friends and share your wellness journey
          </Text>
        </View>

        {/* Overview Banner */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radii.xl,
            padding: theme.spacing.xl,
            marginBottom: theme.spacing.xl,
          }}
       >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: theme.colors.primaryForeground + 'cc', marginBottom: 6 }}>
                Your Social Impact
              </Text>
              <Text style={{ color: theme.colors.primaryForeground, fontSize: 42, fontWeight: '800' }}>
                0
              </Text>
              <Text style={{ color: theme.colors.primaryForeground + 'cc', marginTop: 2 }}>
                Active Connections & Challenges
              </Text>
            </View>
            <View style={{ alignItems: 'center', gap: theme.spacing.md }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.colors.primaryForeground + '33',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <UsersIcon size={theme.iconSizes.lg} color={theme.colors.primaryForeground} />
              </View>
              <Text style={{ color: theme.colors.primaryForeground }}>0 Friends</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
          <TabButton id="feed" label="Activity Feed" />
          <TabButton id="challenges" label="Challenges" />
          <TabButton id="connections" label="Connections" />
        </View>

        {/* Feed */}
        {activeTab === 'feed' && (
          <View style={{ gap: theme.spacing.lg }}>
            {/* Quick Stats */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {[
                { key: 'connections', icon: UsersIcon, label: 'Connections', value: String(connections?.data?.length || 0) },
                { key: 'active', icon: ChartBarIcon, label: 'Active Challenges', value: String(publicChallenges?.data?.length || 0) },
                { key: 'completed', icon: TrophyIcon, label: 'Completed', value: '0' },
                { key: 'pending', icon: ChatBubbleLeftRightIcon, label: 'Pending Requests', value: String(pendingConnections?.data?.length || 0) },
              ].map((s) => (
                <View key={s.key} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 12 }}>
                  <Card>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: theme.radii.lg,
                        backgroundColor: theme.colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <s.icon size={theme.iconSizes.md} color={theme.colors.primary} />
                    </View>
                    <Text style={{ color: theme.colors.foreground, fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
                    <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{s.label}</Text>
                  </Card>
                </View>
              ))}
            </View>

            {/* Recent Activity */}
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>
                Recent Activity
              </Text>
              <View style={{ gap: theme.spacing.md }}>
                {(feedData?.data || []).slice(0, 6).map((item: any, i: number) => (
                  <View
                    key={i}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: theme.colors.input,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <UsersIcon size={theme.iconSizes.sm} color={theme.colors.muted} />
                      </View>
                      <View>
                        <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{item.type}</Text>
                        <Text style={{ color: theme.colors.muted }}>{item.challenge_title || item.badge_title || 'Activity'}</Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.colors.mutedAlt }}>now</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Challenges */}
        {activeTab === 'challenges' && (
          <View style={{ gap: theme.spacing.lg }}>
            <Card>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: theme.spacing.md }}>
                Challenges
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
                <FilterChip id="all" label="All" />
                <FilterChip id="active" label="Active" />
                <FilterChip id="my" label="Mine" />
                <FilterChip id="completed" label="Completed" />
              </View>
              <Button title="Create" onPress={() => router.push('/modals/create-challenge' as any)} />
            </Card>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {(publicChallenges?.data || []).map((c: any) => (
                <View key={c.id} style={{ width: '100%', paddingHorizontal: 8, marginBottom: 12 }}>
                  <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ color: theme.colors.foreground, fontWeight: '700', marginBottom: 4 }}>
                          {c.title}
                        </Text>
                        <Text style={{ color: theme.colors.muted }}>{c.challenge_type}</Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: theme.colors.primaryLight,
                          paddingVertical: theme.spacing.sm,
                          paddingHorizontal: theme.spacing.md,
                          borderRadius: theme.radii.lg,
                          borderWidth: 1,
                          borderColor: theme.colors.primary + '33',
                        }}
                      >
                        <TouchableOpacity onPress={() => joinMutation.mutate(c.id)}>
                          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                            {joinMutation.isPending ? 'Joining...' : 'Join'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Connections */}
        {activeTab === 'connections' && (
          <View style={{ gap: theme.spacing.lg }}>
            {/* Stats */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 }}>
              {[
                { key: 'friends', icon: UsersIcon, label: 'Active Connections', value: String(connections?.data?.length || 0) },
                { key: 'pending', icon: ChatBubbleLeftRightIcon, label: 'Pending Requests', value: String(pendingConnections?.data?.length || 0) },
                { key: 'rate', icon: ChartBarIcon, label: 'Connection Rate', value: `${Math.round((Number(connections?.data?.length || 0) / Math.max(((connections?.data?.length || 0) + (pendingConnections?.data?.length || 0)), 1)) * 100)}%` },
              ].map((s) => (
                <View key={s.key} style={{ width: '100%', paddingHorizontal: 8, marginBottom: 12 }}>
                  <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: theme.radii.xl,
                          backgroundColor: theme.colors.primaryLight,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <s.icon size={theme.iconSizes.lg} color={theme.colors.primary} />
                      </View>
                      <View>
                        <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>{s.value}</Text>
                        <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{s.label}</Text>
                      </View>
                    </View>
                  </Card>
                </View>
              ))}
            </View>

            {/* Connections Management */}
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                <Text style={{ color: theme.colors.foreground, fontWeight: '700' }}>Manage Connections</Text>
                <Button title="Add Friend" onPress={() => router.push('/modals/add-friend' as any)} />
              </View>
              <View style={{ gap: theme.spacing.md }}>
                {(pendingConnections?.data || []).map((conn: any) => (
                  <View key={conn.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.foreground }}>
                      {conn.requester_first_name} {conn.requester_last_name} → {conn.addressee_first_name} {conn.addressee_last_name}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                      <Button
                        title="Accept"
                        variant="outline"
                        onPress={async () => {
                          await apiClient.acceptConnectionRequest(conn.id);
                          queryClient.invalidateQueries({ queryKey: ['connections'] });
                        }}
                      />
                      <Button
                        title="Decline"
                        variant="ghost"
                        onPress={async () => {
                          await apiClient.declineConnectionRequest(conn.id);
                          queryClient.invalidateQueries({ queryKey: ['connections'] });
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        <View style={{ height: 64 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
