import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Award, 
  Trophy, 
  Users, 
  TrendingUp,
  Share2,
  Target
} from 'lucide-react';

// Components
import { BadgeGrid } from '../components/features/badges/BadgeGrid';
import { BadgeShare } from '../components/features/badges/BadgeShare';
import { BadgeLeaderboard } from '../components/features/badges/BadgeLeaderboard';

// Hooks and API
import { useBadgeQueries } from '../hooks/queries/useBadgeQueries';
import type { Badge } from '../types';

type ViewMode = 'badges' | 'leaderboard' | 'achievements';

export default function BadgesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('badges');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Queries
  const {
    useBadgesQuery,
    useBadgeLeaderboardQuery,
    useShareBadgeMutation
  } = useBadgeQueries();

  const { data: badgeData, isLoading: badgesLoading } = useBadgesQuery();
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useBadgeLeaderboardQuery();

  // Mutations
  const shareBadgeMutation = useShareBadgeMutation();

  // Extract data
  const badges = badgeData?.badges || [];
  const totalBadges = badgeData?.totalBadges || 0;
  const unlockedBadges = badgeData?.unlockedBadges || 0;

  // Handlers
  const handleShareBadge = (badge: Badge) => {
    setSelectedBadge(badge);
    setShareModalOpen(true);
  };

  const handleShare = async (badge: Badge, platform: string, message?: string) => {
    try {
      await shareBadgeMutation.mutateAsync({
        badgeId: badge.id,
        platform,
        message
      });
      toast.success(`Badge shared on ${platform}!`);
      setShareModalOpen(false);
    } catch (error) {
      toast.error('Failed to share badge');
    }
  };

  const isLoading = badgesLoading || leaderboardLoading;

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
          <h1 className="text-3xl font-bold text-foreground">
            {t('navigation.badges')}
          </h1>
          <p className="text-foreground-secondary mt-1">
            Earn badges by completing activities and reaching milestones
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('badges')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'badges' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="My Badges"
            >
              <Award className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'leaderboard' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('achievements')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'achievements' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Achievements"
            >
              <Target className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Badges Earned</p>
              <p className="text-2xl font-bold text-foreground">{unlockedBadges}</p>
              <p className="text-xs text-yellow-600">of {totalBadges} total</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-950 rounded-lg">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Total Points</p>
              <p className="text-2xl font-bold text-foreground">
                {badges.filter(b => b.isUnlocked).reduce((sum, b) => sum + b.points, 0)}
              </p>
              <p className="text-xs text-blue-600">Badge points earned</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Completion Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {totalBadges > 0 ? Math.round((unlockedBadges / totalBadges) * 100) : 0}%
              </p>
              <p className="text-xs text-green-600">Badges unlocked</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Leaderboard Rank</p>
              <p className="text-2xl font-bold text-foreground">
                {leaderboard.find(entry => entry.userId === 'current-user')?.rank || '-'}
              </p>
              <p className="text-xs text-purple-600">Your position</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'badges' && (
        <BadgeGrid
          badges={badges}
          onShareBadge={handleShareBadge}
          isLoading={badgesLoading}
        />
      )}

      {viewMode === 'leaderboard' && (
        <BadgeLeaderboard
          leaderboard={leaderboard}
          currentUserId="current-user"
          isLoading={leaderboardLoading}
        />
      )}

      {viewMode === 'achievements' && (
        <div className="space-y-6">
          {/* Recent Achievements */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h3>
            
            {badges.filter(b => b.isUnlocked).length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No achievements yet</h3>
                <p className="text-foreground-secondary mb-4">
                  Complete tasks, log health activities, and maintain streaks to earn your first badges
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <button className="btn-primary">
                    <Target className="w-4 h-4 mr-2" />
                    View Available Badges
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges
                  .filter(b => b.isUnlocked)
                  .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
                  .slice(0, 6)
                  .map((badge) => (
                    <div key={badge.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{badge.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{badge.name}</h4>
                          <p className="text-xs text-foreground-secondary capitalize">
                            {badge.tier} • {badge.category}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground-secondary mb-2">{badge.description}</p>
                      {badge.unlockedAt && (
                        <p className="text-xs text-foreground-muted">
                          Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Progress Towards Next Badges */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Progress Towards Next Badges</h3>
            
            {badges.filter(b => !b.isUnlocked && b.progress.percentage > 0).length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-8 h-8 text-foreground-secondary mx-auto mb-2 opacity-50" />
                <p className="text-foreground-secondary">No badges in progress</p>
                <p className="text-sm text-foreground-muted">Complete more activities to start earning badges</p>
              </div>
            ) : (
              <div className="space-y-4">
                {badges
                  .filter(b => !b.isUnlocked && b.progress.percentage > 0)
                  .sort((a, b) => b.progress.percentage - a.progress.percentage)
                  .slice(0, 5)
                  .map((badge) => (
                    <div key={badge.id} className="flex items-center space-x-4 p-3 bg-background-secondary rounded-lg">
                      <div className="w-12 h-12 bg-background-tertiary rounded-lg flex items-center justify-center">
                        <span className="text-lg opacity-50">{badge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-foreground">{badge.name}</h4>
                          <span className="text-sm text-foreground-secondary">
                            {badge.progress.current}/{badge.progress.target}
                          </span>
                        </div>
                        <div className="w-full bg-background-tertiary rounded-full h-2 mb-1">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${badge.progress.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-foreground-secondary">
                          {badge.progress.percentage.toFixed(0)}% complete • {badge.progress.target - badge.progress.current} more to unlock
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badge Share Modal */}
      <BadgeShare
        badge={selectedBadge}
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedBadge(null);
        }}
        onShare={handleShare}
      />
    </div>
  );
}