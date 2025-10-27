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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Social</h1>
        <p className="text-muted-foreground mt-1">Connect with friends and share your wellness journey</p>
      </div>

      {/* View Navigation */}
      <TabSwitcher
        tabs={socialTabs}
        activeTab={viewMode}
        onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
      />

      {/* Social Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">{connections.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Connections</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
            <span>Active friends</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            {challenges.filter(c => c.isActive && c.participants.some(p => p.userId === 'current-user')).length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Active Challenges</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
            <span>Participating</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">
            {challenges.filter(c => !c.isActive && c.participants.some(p => p.userId === 'current-user')).length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Completed</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 font-medium">
            <span>Finished</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-card-foreground">{pendingRequests.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Pending Requests</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 font-medium">
            <span>Awaiting response</span>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'feed' && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Activity Feed</h2>
          <ActivityFeed
            activities={activities}
            isLoading={activitiesLoading}
          />
        </div>
      )}

      {viewMode === 'challenges' && (
        <div className="space-y-6">
          {/* Challenge Filters */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-foreground">Challenges</h2>
              <button 
                onClick={() => setChallengeCreatorOpen(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Create Challenge
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'All Challenges' },
                { key: 'active', label: 'Active' },
                { key: 'my', label: 'My Challenges' },
                { key: 'completed', label: 'Completed' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setChallengeFilter(filter.key as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    challengeFilter === filter.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white dark:bg-slate-800 border border-border text-foreground hover:border-primary'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Challenges Grid */}
          {filteredChallenges.length === 0 ? (
            <div className="bg-card rounded-2xl p-12 border border-border text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {challengeFilter === 'all' ? 'No challenges available' : 
                 challengeFilter === 'my' ? 'You haven\'t joined any challenges yet' :
                 challengeFilter === 'active' ? 'No active challenges' :
                 'No completed challenges'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {challengeFilter === 'all' ? 'Be the first to create a challenge and motivate others!' :
                 challengeFilter === 'my' ? 'Join a challenge or create your own to get started' :
                 'Check back later for new challenges'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={() => setChallengeCreatorOpen(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Create Challenge
                </button>
                {challengeFilter !== 'all' && (
                  <button 
                    onClick={() => setChallengeFilter('all')}
                    className="px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                  >
                    View All Challenges
                  </button>
                )}
              </div>
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
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6">Connections</h2>
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