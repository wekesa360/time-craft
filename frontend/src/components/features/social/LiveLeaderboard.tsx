/**
 * Live Leaderboard Component
 * Real-time challenge leaderboard with live updates
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useChallengeUpdates } from '../../../hooks/useSSE';
import { FadeIn, Stagger } from '../../ui/animations';

interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  progress: number;
  rank: number;
  previousRank?: number;
  isCurrentUser?: boolean;
  lastUpdate: string;
}

interface LiveLeaderboardProps {
  challengeId: string;
  initialData?: LeaderboardEntry[];
  maxEntries?: number;
  showProgress?: boolean;
  className?: string;
}

const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  challengeId,
  initialData = [],
  maxEntries = 10,
  showProgress = true,
  className,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [animatingEntries, setAnimatingEntries] = useState<Set<string>>(new Set());

  // Listen for real-time leaderboard updates
  useChallengeUpdates((update) => {
    if (update.challengeId === challengeId && update.type === 'leaderboard_update') {
      setEntries(prevEntries => {
        const newEntries = [...prevEntries];
        const updatedEntry = update.data as LeaderboardEntry;
        
        // Find existing entry or add new one
        const existingIndex = newEntries.findIndex(entry => entry.userId === updatedEntry.userId);
        
        if (existingIndex >= 0) {
          // Update existing entry and track rank change
          const oldRank = newEntries[existingIndex].rank;
          newEntries[existingIndex] = {
            ...updatedEntry,
            previousRank: oldRank,
          };
        } else {
          // Add new entry
          newEntries.push(updatedEntry);
        }
        
        // Sort by score (descending) and update ranks
        const sortedEntries = newEntries
          .sort((a, b) => b.score - a.score)
          .slice(0, maxEntries)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
        
        // Animate the updated entry
        setAnimatingEntries(prev => new Set([...prev, updatedEntry.userId]));
        setTimeout(() => {
          setAnimatingEntries(prev => {
            const newSet = new Set(prev);
            newSet.delete(updatedEntry.userId);
            return newSet;
          });
        }, 2000);
        
        setLastUpdateTime(new Date());
        return sortedEntries;
      });
    }
  });

  const getRankChangeIcon = (entry: LeaderboardEntry) => {
    if (!entry.previousRank || entry.previousRank === entry.rank) {
      return null;
    }
    
    if (entry.rank < entry.previousRank) {
      return (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-success"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="text-error-light0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
          </svg>
        </motion.div>
      );
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-warning-light dark:bg-warning/20 rounded-full">
          <span className="text-warning dark:text-warning-light font-bold">👑</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-muted dark:bg-muted rounded-full">
          <span className="text-muted-foreground dark:text-muted-foreground font-bold">🥈</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary/20 rounded-full">
          <span className="text-primary dark:text-primary-400 font-bold">🥉</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-muted dark:bg-muted rounded-full">
          <span className="text-muted-foreground dark:text-muted-foreground font-bold text-sm">#{rank}</span>
        </div>
      );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Live Leaderboard
          </h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground dark:text-muted-foreground">
            <div className="w-2 h-2 bg-success-light0 rounded-full animate-pulse" />
            <span>Live</span>
            <span>•</span>
            <span>Updated {lastUpdateTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </FadeIn>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.userId}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: animatingEntries.has(entry.userId) ? [1, 1.02, 1] : 1,
                backgroundColor: animatingEntries.has(entry.userId) 
                  ? ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)']
                  : 'rgba(59, 130, 246, 0)'
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                layout: { duration: 0.3 },
                scale: { duration: 2, times: [0, 0.1, 1] },
                backgroundColor: { duration: 2, times: [0, 0.1, 1] }
              }}
              className={cn(
                'p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0',
                entry.isCurrentUser && 'bg-info-light dark:bg-info/20'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex items-center space-x-2">
                    {getRankDisplay(entry.rank)}
                    {getRankChangeIcon(entry)}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      {entry.userAvatar ? (
                        <img 
                          src={entry.userAvatar} 
                          alt={entry.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {entry.userName.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium text-foreground dark:text-white">
                        {entry.userName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs bg-info-light text-info dark:bg-info/20 dark:text-info-light px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      {showProgress && (
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {entry.progress}% complete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground dark:text-white">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    points
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              {showProgress && (
                <div className="mt-3">
                  <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Empty State */}
        {entries.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-muted-foreground dark:text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No participants yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveLeaderboard;