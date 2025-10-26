import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
  badge?: string;
  change?: number;
}

interface LeaderboardProps {
  title?: string;
  entries?: LeaderboardEntry[];
  timeRange?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  title = 'Leaderboard',
  entries = [],
  timeRange = 'weekly',
  className = ''
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-warning" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700';
      default:
        return 'bg-white dark:bg-muted border-gray-200 dark:border-gray-700';
    }
  };

  const timeRangeOptions = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'all-time', label: 'All Time' }
  ];

  return (
    <div className={`bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-foreground dark:text-white">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">{entries.length} participants</span>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 flex space-x-2">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTimeRange(option.value as any)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                selectedTimeRange === option.value
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="p-6">
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getRankColor(entry.rank)}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                          {entry.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground dark:text-white">{entry.name}</span>
                        {entry.badge && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                            {entry.badge}
                          </span>
                        )}
                      </div>
                      {entry.change !== undefined && (
                        <div className="flex items-center space-x-1 text-xs">
                          <TrendingUp className={`w-3 h-3 ${entry.change > 0 ? 'text-success' : entry.change < 0 ? 'text-error-light0' : 'text-muted-foreground'}`} />
                          <span className={`${entry.change > 0 ? 'text-success' : entry.change < 0 ? 'text-error' : 'text-muted-foreground'}`}>
                            {entry.change > 0 ? '+' : ''}{entry.change}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-foreground dark:text-white">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                    points
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground dark:text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground dark:text-white mb-2">No Data Yet</h4>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Be the first to participate and climb the leaderboard!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {entries.length > 0 && (
        <div className="px-6 py-4 bg-muted dark:bg-muted/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>Rankings update every hour</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
