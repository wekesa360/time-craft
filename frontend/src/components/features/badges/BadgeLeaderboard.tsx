import React, { useState } from 'react';
import type { LeaderboardEntry } from '../../../types';
import { 
  Calendar,
  Filter
} from 'lucide-react';

interface BadgeLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
}

const timeRanges = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];

export const BadgeLeaderboard: React.FC<BadgeLeaderboardProps> = ({
  leaderboard,
  currentUserId,
  isLoading = false
}) => {
  const [timeRange, setTimeRange] = useState('month');

  const getRankDisplay = (rank: number) => {
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        rank === 1 ? 'bg-warning-light0 text-white' :
        rank === 2 ? 'bg-muted text-white' :
        rank === 3 ? 'bg-amber-600 text-white' :
        'bg-background-secondary text-foreground'
      }`}>
        {rank}
      </div>
    );
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-background-secondary text-foreground';
    }
  };

  const currentUserEntry = leaderboard.find(entry => entry.userId === currentUserId);
  const topEntries = leaderboard.slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-background-secondary rounded-lg">
              <div className="w-8 h-8 bg-background-tertiary rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-background-tertiary rounded w-1/3"></div>
                <div className="h-3 bg-background-tertiary rounded w-1/4"></div>
              </div>
              <div className="h-6 bg-background-tertiary rounded w-16"></div>
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
        <div className="flex items-center space-x-2">
          <h3 className="text-xl font-semibold text-foreground">Badge Leaderboard</h3>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-foreground-secondary" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input text-sm min-w-[120px]"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topEntries.length >= 3 && (
        <div className="card p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-end justify-center space-x-8">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-16 h-20 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg flex items-end justify-center pb-2 mb-3">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{topEntries[1]?.firstName} {topEntries[1]?.lastName}</p>
                <p className="text-sm text-foreground-secondary">{topEntries[1]?.badgePoints || topEntries[1]?.score} pts</p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="w-20 h-24 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg flex items-end justify-center pb-2 mb-3 relative">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground text-lg">{topEntries[0]?.firstName} {topEntries[0]?.lastName}</p>
                <p className="text-foreground-secondary">{topEntries[0]?.badgePoints || topEntries[0]?.score} pts</p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-t from-amber-500 to-amber-600 rounded-t-lg flex items-end justify-center pb-2 mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{topEntries[2]?.firstName} {topEntries[2]?.lastName}</p>
                <p className="text-sm text-foreground-secondary">{topEntries[2]?.badgePoints || topEntries[2]?.score} pts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current User Position (if not in top 10) */}
      {currentUserEntry && currentUserEntry.rank > 10 && (
        <div className="card p-4 border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full font-medium ${getRankBadgeColor(currentUserEntry.rank)}`}>
                #{currentUserEntry.rank}
              </div>
              <div>
                <p className="font-semibold text-foreground">You</p>
                <p className="text-sm text-foreground-secondary">
                  {currentUserEntry.firstName} {currentUserEntry.lastName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary-600">
                {currentUserEntry.badgePoints || currentUserEntry.score} pts
              </p>
              <p className="text-xs text-foreground-secondary">Your position</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="card p-6">
        <div className="space-y-3">
          {topEntries.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-foreground mb-2">No leaderboard data</h3>
              <p className="text-foreground-secondary">
                Start earning badges to appear on the leaderboard!
              </p>
            </div>
          ) : (
            topEntries.map((entry, index) => {
              const isCurrentUser = entry.userId === currentUserId;
              
              return (
                <div
                  key={entry.userId}
                  className={`
                    flex items-center justify-between p-4 rounded-lg transition-colors
                    ${isCurrentUser 
                      ? 'bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800' 
                      : 'bg-background-secondary hover:bg-background-tertiary'
                    }
                  `}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8">
                      {getRankDisplay(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div>
                      <p className={`font-semibold ${isCurrentUser ? 'text-primary-700 dark:text-primary-300' : 'text-foreground'}`}>
                        {entry.firstName} {entry.lastName}
                        {isCurrentUser && <span className="ml-2 text-xs text-primary-600">(You)</span>}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        Rank #{entry.rank}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={`font-bold ${isCurrentUser ? 'text-primary-600' : 'text-foreground'}`}>
                      {entry.badgePoints || entry.score}
                    </p>
                    <p className="text-xs text-foreground-secondary">points</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Leaderboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-warning mb-1">
            {leaderboard.length}
          </div>
          <p className="text-sm text-foreground-secondary">Total Participants</p>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, entry) => sum + (entry.badgePoints || entry.score), 0) / leaderboard.length) : 0}
          </div>
          <p className="text-sm text-foreground-secondary">Average Points</p>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-info mb-1">
            {leaderboard.length > 0 ? Math.max(...leaderboard.map(entry => entry.badgePoints || entry.score)) : 0}
          </div>
          <p className="text-sm text-foreground-secondary">Highest Score</p>
        </div>
      </div>

      {/* Competition Info */}
      <div className="card p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="font-semibold text-info dark:text-info-light">How to Climb the Leaderboard</h4>
        </div>
        <ul className="text-sm text-info dark:text-info-light space-y-1">
          <li>• Complete tasks and focus sessions to earn productivity badges</li>
          <li>• Log health activities regularly for wellness badges</li>
          <li>• Maintain streaks for bonus points</li>
          <li>• Participate in social challenges</li>
          <li>• Higher tier badges (Gold, Platinum) give more points</li>
        </ul>
      </div>
    </div>
  );
};