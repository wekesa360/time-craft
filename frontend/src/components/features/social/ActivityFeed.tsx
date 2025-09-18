import React, { useState } from 'react';
import type { ActivityFeedItem } from '../../../types';
import { 
  Award, 
  Trophy, 
  Target, 
  Share2, 
  Heart, 
  MessageCircle,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  onRefresh?: () => void;
  onLike?: (activityId: string) => void;
  onComment?: (activityId: string, comment: string) => void;
  onShare?: (activityId: string) => void;
  isLoading?: boolean;
}

const activityTypeIcons = {
  badge_unlock: Award,
  challenge_join: Target,
  challenge_complete: Trophy,
  achievement_share: Share2
};

const activityTypeColors = {
  badge_unlock: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950',
  challenge_join: 'text-blue-600 bg-blue-100 dark:bg-blue-950',
  challenge_complete: 'text-green-600 bg-green-100 dark:bg-green-950',
  achievement_share: 'text-purple-600 bg-purple-100 dark:bg-purple-950'
};

const filterOptions = [
  { value: '', label: 'All Activities' },
  { value: 'badge_unlock', label: 'Badge Unlocks' },
  { value: 'challenge_join', label: 'Challenge Joins' },
  { value: 'challenge_complete', label: 'Challenge Completions' },
  { value: 'achievement_share', label: 'Achievement Shares' }
];

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  onRefresh,
  onLike,
  onComment,
  onShare,
  isLoading = false
}) => {
  const [filter, setFilter] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const filteredActivities = activities.filter(activity => 
    !filter || activity.type === filter
  );

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getActivityMessage = (activity: ActivityFeedItem) => {
    switch (activity.type) {
      case 'badge_unlock':
        return `unlocked the "${activity.content.badgeName}" badge!`;
      case 'challenge_join':
        return `joined the "${activity.content.challengeName}" challenge`;
      case 'challenge_complete':
        return `completed the "${activity.content.challengeName}" challenge!`;
      case 'achievement_share':
        return `shared their achievement: ${activity.content.message}`;
      default:
        return 'had an activity';
    }
  };

  const handleCommentSubmit = (activityId: string) => {
    const comment = commentInputs[activityId]?.trim();
    if (comment && onComment) {
      onComment(activityId, comment);
      setCommentInputs(prev => ({ ...prev, [activityId]: '' }));
    }
  };

  const handleCommentChange = (activityId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [activityId]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-background-secondary rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-background-secondary rounded w-3/4"></div>
                  <div className="h-3 bg-background-secondary rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Activity Feed</h2>
        
        <div className="flex items-center space-x-3">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-foreground-secondary" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input text-sm min-w-[140px]"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn-ghost p-2"
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-foreground-secondary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No activities yet</h3>
            <p className="text-foreground-secondary">
              {filter 
                ? 'No activities match your current filter. Try selecting a different filter.'
                : 'Connect with friends to see their activities, or start completing challenges to share your own!'
              }
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const IconComponent = activityTypeIcons[activity.type];
            const iconColor = activityTypeColors[activity.type];
            
            return (
              <div key={activity.id} className="card p-6">
                {/* Activity Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className={`p-2 rounded-lg ${iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {activity.firstName} {activity.lastName}
                      </span>
                      <span className="text-foreground-secondary">
                        {getActivityMessage(activity)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Content */}
                {activity.content && (
                  <div className="ml-14 mb-4">
                    {activity.type === 'badge_unlock' && (
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="text-2xl">{activity.content.badgeIcon}</div>
                        <div>
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                            {activity.content.badgeName}
                          </h4>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            {activity.content.badgeDescription}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full">
                              {activity.content.badgeTier}
                            </span>
                            <span className="text-xs text-yellow-700 dark:text-yellow-300">
                              +{activity.content.badgePoints} points
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activity.type === 'challenge_complete' && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                          {activity.content.challengeName}
                        </h4>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          Final score: {activity.content.finalScore}/{activity.content.targetValue}
                        </p>
                        {activity.content.rank && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Finished #{activity.content.rank} out of {activity.content.totalParticipants} participants
                          </p>
                        )}
                      </div>
                    )}

                    {activity.type === 'achievement_share' && activity.content.message && (
                      <div className="p-3 bg-background-secondary rounded-lg">
                        <p className="text-foreground italic">"{activity.content.message}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Actions */}
                <div className="ml-14 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {onLike && (
                      <button
                        onClick={() => onLike(activity.id)}
                        className="flex items-center space-x-1 text-foreground-secondary hover:text-red-500 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">Like</span>
                      </button>
                    )}
                    
                    {onComment && (
                      <button
                        onClick={() => {
                          // Focus on comment input (would need ref implementation)
                        }}
                        className="flex items-center space-x-1 text-foreground-secondary hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Comment</span>
                      </button>
                    )}
                    
                    {onShare && (
                      <button
                        onClick={() => onShare(activity.id)}
                        className="flex items-center space-x-1 text-foreground-secondary hover:text-green-500 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Input */}
                {onComment && (
                  <div className="ml-14 mt-4 pt-4 border-t border-border">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[activity.id] || ''}
                        onChange={(e) => handleCommentChange(activity.id, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentSubmit(activity.id);
                          }
                        }}
                        className="input flex-1 text-sm"
                      />
                      <button
                        onClick={() => handleCommentSubmit(activity.id)}
                        disabled={!commentInputs[activity.id]?.trim()}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Load More */}
      {filteredActivities.length > 0 && (
        <div className="text-center">
          <button className="btn-outline">
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;