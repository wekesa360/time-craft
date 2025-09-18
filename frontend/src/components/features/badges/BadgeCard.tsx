import React from 'react';
import type { Badge } from '../../../types';
import { 
  Award, 
  Lock, 
  Share2, 
  Calendar,
  Trophy,
  Star,
  Target,
  Users,
  Zap,
  Heart
} from 'lucide-react';

interface BadgeCardProps {
  badge: Badge;
  onShare?: (badge: Badge) => void;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const badgeIcons = {
  productivity: Trophy,
  health: Heart,
  social: Users,
  streak: Zap,
  milestone: Star
};

const tierColors = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-950/20',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-600'
  },
  silver: {
    bg: 'bg-gray-100 dark:bg-gray-950/20',
    border: 'border-gray-300 dark:border-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    icon: 'text-gray-600'
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-950/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-600'
  },
  platinum: {
    bg: 'bg-purple-100 dark:bg-purple-950/20',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-800 dark:text-purple-200',
    icon: 'text-purple-600'
  }
};

const sizeClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  onShare,
  size = 'md',
  showProgress = true
}) => {
  const IconComponent = badgeIcons[badge.category] || Award;
  const tierStyle = tierColors[badge.tier];
  const isUnlocked = badge.isUnlocked;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`
      card transition-all duration-200 hover:shadow-lg
      ${sizeClasses[size]}
      ${isUnlocked 
        ? `${tierStyle.bg} ${tierStyle.border} border-2` 
        : 'bg-background-secondary border-2 border-dashed border-border opacity-75'
      }
    `}>
      {/* Badge Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-lg transition-all
            ${isUnlocked 
              ? `${tierStyle.bg} ${tierStyle.border} border` 
              : 'bg-background-tertiary border border-border'
            }
          `}>
            {isUnlocked ? (
              <IconComponent className={`${iconSizes[size]} ${tierStyle.icon}`} />
            ) : (
              <Lock className={`${iconSizes[size]} text-foreground-secondary`} />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-semibold ${
              isUnlocked ? tierStyle.text : 'text-foreground-secondary'
            }`}>
              {badge.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium capitalize
                ${isUnlocked ? tierStyle.bg : 'bg-background-tertiary'}
                ${isUnlocked ? tierStyle.text : 'text-foreground-secondary'}
              `}>
                {badge.tier}
              </span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium capitalize
                ${isUnlocked ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' : 'bg-background-tertiary text-foreground-secondary'}
              `}>
                {badge.category}
              </span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        {isUnlocked && onShare && (
          <button
            onClick={() => onShare(badge)}
            className="btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Share badge"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Badge Description */}
      <p className={`text-sm mb-3 ${
        isUnlocked ? 'text-foreground-secondary' : 'text-foreground-muted'
      }`}>
        {badge.description}
      </p>

      {/* Progress Section */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={isUnlocked ? 'text-foreground' : 'text-foreground-secondary'}>
              Progress
            </span>
            <span className={`font-medium ${
              isUnlocked ? tierStyle.text : 'text-foreground-secondary'
            }`}>
              {badge.progress.current}/{badge.progress.target}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-background-tertiary rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isUnlocked 
                  ? tierStyle.icon.replace('text-', 'bg-')
                  : getProgressColor(badge.progress.percentage)
              }`}
              style={{ width: `${Math.min(100, badge.progress.percentage)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className={isUnlocked ? 'text-foreground-secondary' : 'text-foreground-muted'}>
              {badge.progress.percentage.toFixed(0)}% complete
            </span>
            {badge.points > 0 && (
              <span className={`font-medium ${
                isUnlocked ? tierStyle.text : 'text-foreground-secondary'
              }`}>
                {badge.points} pts
              </span>
            )}
          </div>
        </div>
      )}

      {/* Unlock Date */}
      {isUnlocked && badge.unlockedAt && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-2 text-xs text-foreground-secondary">
            <Calendar className="w-3 h-3" />
            <span>Unlocked {formatDate(badge.unlockedAt)}</span>
          </div>
        </div>
      )}

      {/* Locked State Hint */}
      {!isUnlocked && badge.progress.percentage > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-2 text-xs text-foreground-secondary">
            <Target className="w-3 h-3" />
            <span>
              {badge.progress.target - badge.progress.current} more to unlock
            </span>
          </div>
        </div>
      )}

      {/* Completely Locked State */}
      {!isUnlocked && badge.progress.percentage === 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-2 text-xs text-foreground-muted">
            <Lock className="w-3 h-3" />
            <span>Complete activities to unlock</span>
          </div>
        </div>
      )}
    </div>
  );
};