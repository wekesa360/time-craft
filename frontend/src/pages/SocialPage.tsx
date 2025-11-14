import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Trophy,
  MessageCircle,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import TabSwitcher from '../components/ui/TabSwitcher';
import type { TabItem } from '../components/ui/TabSwitcher';

// Components
import ConnectionsList from '../components/features/social/ConnectionsList';
import { ChallengeCard } from '../components/features/social/ChallengeCard';
import ActivityFeed from '../components/features/social/ActivityFeed';
import { ChallengeCreator } from '../components/features/social/ChallengeCreator';

// Hooks and API
import { useSocialQueries } from '../hooks/queries/useSocialQueries';
import type { Challenge } from '../types';

type ViewMode = 'feed' | 'challenges' | 'connections';

export default function SocialPage() {
  const { t } = useTranslation();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [challengeCreatorOpen, setChallengeCreatorOpen] = useState(false);
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'active' | 'completed' | 'my'>('all');

  // Queries
  const {
    useConnectionsQuery,
    useChallengesQuery,
    useActivityFeedQuery,
    useSendConnectionRequestMutation,
    useAcceptConnectionRequestMutation,
    useDeclineConnectionRequestMutation,
    useCreateChallengeMutation,
    useJoinChallengeMutation,
    useLeaveChallengeMutation
  } = useSocialQueries();

  const { data: connectionsData, isLoading: connectionsLoading } = useConnectionsQuery();
  const { data: challenges = [], isLoading: challengesLoading } = useChallengesQuery();
  const { data: activities = [], isLoading: activitiesLoading } = useActivityFeedQuery();

  // Mutations
  const sendConnectionRequestMutation = useSendConnectionRequestMutation();
  const acceptConnectionRequestMutation = useAcceptConnectionRequestMutation();
  const declineConnectionRequestMutation = useDeclineConnectionRequestMutation();
  const createChallengeMutation = useCreateChallengeMutation();
  const joinChallengeMutation = useJoinChallengeMutation();
  const leaveChallengeMutation = useLeaveChallengeMutation();

  // Extract data
  const connections = connectionsData?.connections || [];
  const pendingRequests = connectionsData?.pendingRequests || [];

  // Filter challenges
  const filteredChallenges = challenges.filter(challenge => {
    switch (challengeFilter) {
      case 'active':
        return challenge.isActive && new Date(challenge.endDate) > new Date();
      case 'completed':
        return new Date(challenge.endDate) < new Date();
      case 'my':
        return challenge.participants.some(p => p.userId === 'current-user');
      default:
        return true;
    }
  });

  // Handlers
  const handleSendConnectionRequest = async (email: string, message?: string) => {
    try {
      await sendConnectionRequestMutation.mutateAsync({ email, message });
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error('Failed to send connection request');
    }
  };

  const handleAcceptConnectionRequest = async (connectionId: string) => {
    try {
      await acceptConnectionRequestMutation.mutateAsync(connectionId);
      toast.success('Connection request accepted!');
    } catch (error) {
      toast.error('Failed to accept connection request');
    }
  };

  const handleDeclineConnectionRequest = async (connectionId: string) => {
    try {
      await declineConnectionRequestMutation.mutateAsync(connectionId);
      toast.success('Connection request declined');
    } catch (error) {
      toast.error('Failed to decline connection request');
    }
  };

  const handleCreateChallenge = async (challengeData: Omit<Challenge, 'id' | 'participants' | 'leaderboard' | 'isActive'>) => {
    try {
      await createChallengeMutation.mutateAsync(challengeData);
      toast.success('Challenge created successfully!');
      setChallengeCreatorOpen(false);
    } catch (error) {
      toast.error('Failed to create challenge');
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallengeMutation.mutateAsync(challengeId);
      toast.success('Joined challenge successfully!');
    } catch (error) {
      toast.error('Failed to join challenge');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    if (window.confirm('Are you sure you want to leave this challenge?')) {
      try {
        await leaveChallengeMutation.mutateAsync(challengeId);
        toast.success('Left challenge successfully');
      } catch (error) {
        toast.error('Failed to leave challenge');
      }
    }
  };

  const isLoading = connectionsLoading || challengesLoading || activitiesLoading;

  // Debug logging for social data
  React.useEffect(() => {
    console.log('SocialPage loaded data:', {
      connectionsCount: connections.length,
      pendingRequestsCount: pendingRequests.length,
      challengesCount: challenges.length,
      activitiesCount: activities.length,
      connectionsData,
      challenges: challenges.slice(0, 3),
      activities: activities.slice(0, 3)
    });
  }, [connectionsData, connections, pendingRequests, challenges, activities]);

  // Tab configuration
  const socialTabs: TabItem[] = [
    { id: 'feed', label: 'Activity Feed' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'connections', label: 'Connections' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Social & Community
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with friends and share your wellness journey
          </p>
        </div>

        {/* Social Overview */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-primary-foreground/80 mb-2">
                Your Social Impact
              </p>
              <p className="text-5xl md:text-6xl font-bold">
                {connections.length + challenges.filter(c => c.participants.some(p => p.userId === 'current-user')).length}
              </p>
              <p className="text-primary-foreground/80 mt-2">
                Active Connections & Challenges
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-2">
                  <Users className="w-10 h-10" />
                </div>
                <p className="text-sm">{connections.length} Friends</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-2">
                  <Trophy className="w-10 h-10" />
                </div>
                <p className="text-sm">
                  {challenges.filter(c => c.participants.some(p => p.userId === 'current-user')).length} Challenges
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View Navigation */}
        <TabSwitcher
          tabs={socialTabs}
          activeTab={viewMode}
          onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
        />

        {/* Content based on view mode */}
        {viewMode === 'feed' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{connections.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Connections</p>
              </div>

              <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {challenges.filter(c => c.isActive && c.participants.some(p => p.userId === 'current-user')).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Active Challenges</p>
              </div>

              <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {challenges.filter(c => !c.isActive && c.participants.some(p => p.userId === 'current-user')).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Completed</p>
              </div>

              <div className="bg-card rounded-2xl p-4 md:p-6 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending Requests</p>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">Recent Activity</h2>
              <ActivityFeed
                activities={activities}
                isLoading={activitiesLoading}
              />
            </div>
          </div>
        )}

        {viewMode === 'challenges' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-foreground">Challenges</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'active', label: 'Active' },
                    { key: 'my', label: 'Mine' },
                    { key: 'completed', label: 'Completed' }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setChallengeFilter(filter.key as any)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        challengeFilter === filter.key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setChallengeCreatorOpen(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            {filteredChallenges.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No challenges found
                </h3>
                <button 
                  onClick={() => setChallengeCreatorOpen(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Create Challenge
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId="current-user"
                    isParticipating={challenge.participants.some(p => p.userId === 'current-user')}
                    onJoin={handleJoinChallenge}
                    onLeave={handleLeaveChallenge}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'connections' && (
          <div className="space-y-6">
            {/* Connection Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">
                  {connections.length}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Active Connections
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">
                  {pendingRequests.length}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Pending Requests
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">
                  {Math.round((connections.length / Math.max(connections.length + pendingRequests.length, 1)) * 100)}%
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connection Rate
                </p>
              </div>
            </div>

            {/* Connections Management */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-6">Manage Connections</h2>
              <ConnectionsList
                connections={connections}
                pendingRequests={pendingRequests}
                onSendRequest={handleSendConnectionRequest}
                onAcceptRequest={handleAcceptConnectionRequest}
                onDeclineRequest={handleDeclineConnectionRequest}
                onRemoveConnection={() => {}} // TODO: Implement
                isLoading={connectionsLoading}
              />
            </div>
          </div>
        )}

      {/* Challenge Creator Modal */}
      <ChallengeCreator
        isOpen={challengeCreatorOpen}
        onClose={() => setChallengeCreatorOpen(false)}
        onSave={handleCreateChallenge}
      />
      </div>
    </div>
  );
}