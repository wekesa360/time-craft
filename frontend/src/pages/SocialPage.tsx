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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Social Hub</h1>
          <p className="text-foreground-secondary mt-1">
            Connect with others and participate in challenges together
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('feed')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'feed' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Activity Feed
            </button>
            <button
              onClick={() => setViewMode('challenges')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'challenges' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Challenges
            </button>
            <button
              onClick={() => setViewMode('connections')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'connections' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Connections
            </button>
          </div>
        </div>
      </div>

      {/* Social Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Connections</p>
              <p className="text-2xl font-bold text-foreground">{connections.length}</p>
              <p className="text-xs text-blue-600">Active friends</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Active Challenges</p>
              <p className="text-2xl font-bold text-foreground">
                {challenges.filter(c => c.isActive && c.participants.some(p => p.userId === 'current-user')).length}
              </p>
              <p className="text-xs text-green-600">Participating</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Completed Challenges</p>
              <p className="text-2xl font-bold text-foreground">
                {challenges.filter(c => !c.isActive && c.participants.some(p => p.userId === 'current-user')).length}
              </p>
              <p className="text-xs text-purple-600">Finished</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Pending Requests</p>
              <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
              <p className="text-xs text-orange-600">Awaiting response</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <MessageCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'feed' && (
        <ActivityFeed
          activities={activities}
          isLoading={activitiesLoading}
        />
      )}

      {viewMode === 'challenges' && (
        <div className="space-y-6">
          {/* Challenge Filters */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-foreground">Filter:</span>
            <div className="flex items-center space-x-2">
              {[
                { key: 'all', label: 'All Challenges' },
                { key: 'active', label: 'Active' },
                { key: 'my', label: 'My Challenges' },
                { key: 'completed', label: 'Completed' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setChallengeFilter(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    challengeFilter === filter.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Challenges Grid */}
          {filteredChallenges.length === 0 ? (
            <div className="card p-12 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {challengeFilter === 'all' ? 'No challenges available' : 
                 challengeFilter === 'my' ? 'You haven\'t joined any challenges yet' :
                 challengeFilter === 'active' ? 'No active challenges' :
                 'No completed challenges'}
              </h3>
              <p className="text-foreground-secondary mb-6">
                {challengeFilter === 'all' ? 'Be the first to create a challenge and motivate others!' :
                 challengeFilter === 'my' ? 'Join a challenge or create your own to get started' :
                 'Check back later for new challenges'}
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button 
                  onClick={() => setChallengeCreatorOpen(true)}
                  className="btn btn-primary"
                >
                  Create Challenge
                </button>
                {challengeFilter !== 'all' && (
                  <button 
                    onClick={() => setChallengeFilter('all')}
                    className="btn btn-secondary"
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
        <ConnectionsList
          connections={connections}
          pendingRequests={pendingRequests}
          onSendRequest={handleSendConnectionRequest}
          onAcceptRequest={handleAcceptConnectionRequest}
          onDeclineRequest={handleDeclineConnectionRequest}
          onRemoveConnection={() => {}} // TODO: Implement
          isLoading={connectionsLoading}
        />
      )}

      {/* Challenge Creator Modal */}
      <ChallengeCreator
        isOpen={challengeCreatorOpen}
        onClose={() => setChallengeCreatorOpen(false)}
        onSave={handleCreateChallenge}
      />
    </div>
  );
}