/**
 * Live Activity Feed Component
 * Real-time social activity updates
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useSSEMessage } from '../../../hooks/useSSE';
import { FadeIn, Stagger } from '../../ui/animations';

interface ActivityItem {
  id: string;
  type: 'badge_unlock' | 'challenge_complete' | 'focus_session' | 'task_complete' | 'health_goal' | 'social_connect';
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  data: Record<string, any>;
  isNew?: boolean;
}

interface LiveActivityFeedProps {
  maxItems?: number;
  showUserActions?: boolean;
  className?: string;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  maxItems = 20,
  showUserActions = true,
  className,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [newActivityCount, setNewActivityCount] = useState(0);

  // Listen for real-time activity updates
  useSSEMessage('social_activity', (activity: ActivityItem) => {
    setActivities(prev => {
      const newActivities = [
        { ...activity, isNew: true },
        ...prev.slice(0, maxItems - 1)
      ];
      
      // Mark as new for animation
      setTimeout(() => {
        setActivities(current => 
          current.map(item => 
            item.id === activity.id ? { ...item, isNew: false } : item
          )
        );
      }, 3000);
      
      return newActivities;
    });
    
    setNewActivityCount(prev => prev + 1);
  });

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'badge_unlock':
        return (
          <div className="w-8 h-8 bg-warning-light dark:bg-warning/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-warning dark:text-warning-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        );
      case 'challenge_complete':
        return (
          <div className="w-8 h-8 bg-success-light dark:bg-success/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-success dark:text-success-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'focus_session':
        return (
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'task_complete':
        return (
          <div className="w-8 h-8 bg-info-light dark:bg-info/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-info dark:text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'health_goal':
        return (
          <div className="w-8 h-8 bg-error-light dark:bg-error/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-error dark:text-error-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case 'social_connect':
        return (
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-muted dark:bg-muted rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'badge_unlock':
        return `unlocked the "${activity.data.badgeName}" badge`;
      case 'challenge_complete':
        return `completed the "${activity.data.challengeName}" challenge`;
      case 'focus_session':
        return `completed a ${activity.data.duration}-minute focus session`;
      case 'task_complete':
        return `completed "${activity.data.taskTitle}"`;
      case 'health_goal':
        return `reached their ${activity.data.goalType} goal`;
      case 'social_connect':
        return `connected with ${activity.data.connectionName}`;
      default:
        return 'had some activity';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const clearNewActivityCount = () => {
    setNewActivityCount(0);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground dark:text-white">
            Activity Feed
          </h3>
          <div className="flex items-center space-x-2">
            {newActivityCount > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={clearNewActivityCount}
                className="px-3 py-1 bg-info-light text-info dark:bg-info/20 dark:text-info-light rounded-full text-xs font-medium"
              >
                {newActivityCount} new
              </motion.button>
            )}
            <div className="flex items-center space-x-1 text-sm text-muted-foreground dark:text-muted-foreground">
              <div className="w-2 h-2 bg-success-light0 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Activity List */}
      <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  backgroundColor: activity.isNew 
                    ? ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0)']
                    : 'rgba(59, 130, 246, 0)'
                }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ 
                  layout: { duration: 0.3 },
                  backgroundColor: { duration: 3, times: [0, 0.1, 1] }
                }}
                className={cn(
                  'p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0',
                  activity.isNew && 'ring-2 ring-blue-500/20'
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Activity Icon */}
                  {getActivityIcon(activity.type)}
                  
                  {/* User Avatar */}
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    {activity.userAvatar ? (
                      <img 
                        src={activity.userAvatar} 
                        alt={activity.userName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        {activity.userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-foreground dark:text-white">
                        {activity.userName}
                      </span>
                      <span className="text-muted-foreground dark:text-muted-foreground ml-1">
                        {getActivityMessage(activity)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {getTimeAgo(activity.timestamp)}
                      </div>
                      
                      {/* Activity-specific details */}
                      {activity.type === 'focus_session' && activity.data.productivity && (
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={cn(
                                'w-3 h-3',
                                i < activity.data.productivity ? 'text-warning-light' : 'text-muted-foreground dark:text-muted-foreground'
                              )}
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                      )}
                      
                      {activity.type === 'badge_unlock' && (
                        <div className="text-xs bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light px-2 py-1 rounded-full">
                          {activity.data.badgeType}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Empty State */}
        {activities.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-muted-foreground dark:text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activity from your connections will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;