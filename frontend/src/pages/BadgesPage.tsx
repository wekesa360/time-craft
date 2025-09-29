import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Share2
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
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'badges' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              My Badges
            </button>
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'leaderboard' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setViewMode('achievements')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'achievements' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Achievements
            </button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground-secondary mb-2">Badges Earned</p>
            <p className="text-3xl font-bold text-foreground mb-1">{unlockedBadges}</p>
            <p className="text-sm text-foreground-secondary">of {totalBadges} total</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground-secondary mb-2">Total Points</p>
            <p className="text-3xl font-bold text-foreground mb-1">
              {badges.filter(b => b.isUnlocked).reduce((sum, b) => sum + b.points, 0)}
            </p>
            <p className="text-sm text-foreground-secondary">Badge points earned</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground-secondary mb-2">Completion Rate</p>
            <p className="text-3xl font-bold text-foreground mb-1">
              {totalBadges > 0 ? Math.round((unlockedBadges / totalBadges) * 100) : 0}%
            </p>
            <p className="text-sm text-foreground-secondary">Badges unlocked</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground-secondary mb-2">Leaderboard Rank</p>
            <p className="text-3xl font-bold text-foreground mb-1">
              {leaderboard.find(entry => entry.userId === 'current-user')?.rank || '-'}
            </p>
            <p className="text-sm text-foreground-secondary">Your position</p>
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
                <h3 className="text-lg font-medium text-foreground mb-2">No achievements yet</h3>
                <p className="text-foreground-secondary">
                  Complete tasks, log health activities, and maintain streaks to earn your first badges
                </p>
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