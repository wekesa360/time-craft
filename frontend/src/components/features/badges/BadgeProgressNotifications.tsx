/**
 * Badge Progress Notifications Component
 * Notifications and hints for upcoming badge achievements
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { Button } from '../../ui';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: string;
    target: number;
    current: number;
  }[];
  isUnlocked: boolean;
  progress: number; // 0-100
}

interface BadgeProgressNotification {
  id: string;
  badge: Badge;
  type: 'progress' | 'almost_complete' | 'hint' | 'milestone';
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

interface BadgeProgressNotificationsProps {
  badges: Badge[];
  onDismiss?: (notificationId: string) => void;
  onTakeAction?: (badge: Badge) => void;
  className?: string;
}

const notificationTypes = {
  progress: {
    icon: '📈',
    color: 'blue',
    title: 'Progress Update',
  },
  almost_complete: {
    icon: '🎯',
    color: 'orange',
    title: 'Almost There!',
  },
  hint: {
    icon: '💡',
    color: 'yellow',
    title: 'Tip',
  },
  milestone: {
    icon: '🏆',
    color: 'green',
    title: 'Milestone Reached',
  },
};

const colorClasses = {
  blue: 'bg-info-light border-blue-200 text-info dark:bg-info/20 dark:border-blue-800 dark:text-info-light',
  orange: 'bg-primary-50 border-orange-200 text-primary dark:bg-primary/20 dark:border-orange-800 dark:text-primary-200',
  yellow: 'bg-warning-light border-yellow-200 text-warning dark:bg-warning/20 dark:border-yellow-800 dark:text-warning-light',
  green: 'bg-success-light border-green-200 text-success dark:bg-success/20 dark:border-green-800 dark:text-success-light',
  purple: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-200',
};

const BadgeProgressNotifications: React.FC<BadgeProgressNotificationsProps> = ({
  badges,
  onDismiss,
  onTakeAction,
  className,
}) => {
  const [notifications, setNotifications] = useState<BadgeProgressNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Generate notifications based on badge progress
  useEffect(() => {
    const newNotifications: BadgeProgressNotification[] = [];

    badges.forEach(badge => {
      if (badge.isUnlocked) return;

      const notificationId = `${badge.id}-${Math.floor(badge.progress / 10) * 10}`;
      
      // Skip if already dismissed
      if (dismissedIds.has(notificationId)) return;

      // Almost complete (90%+)
      if (badge.progress >= 90) {
        newNotifications.push({
          id: notificationId,
          badge,
          type: 'almost_complete',
          message: `You're ${100 - badge.progress}% away from unlocking "${badge.name}"!`,
          timestamp: Date.now(),
          priority: 'high',
          actionable: true,
        });
      }
      // Significant progress (every 25%)
      else if (badge.progress > 0 && badge.progress % 25 === 0) {
        newNotifications.push({
          id: notificationId,
          badge,
          type: 'milestone',
          message: `${badge.progress}% progress on "${badge.name}" badge!`,
          timestamp: Date.now(),
          priority: 'medium',
        });
      }
      // Progress hints for stalled badges
      else if (badge.progress > 10 && badge.progress < 50) {
        const hints = generateHints(badge);
        if (hints.length > 0) {
          newNotifications.push({
            id: `${badge.id}-hint`,
            badge,
            type: 'hint',
            message: hints[Math.floor(Math.random() * hints.length)],
            timestamp: Date.now(),
            priority: 'low',
            actionable: true,
          });
        }
      }
    });

    // Sort by priority and timestamp
    newNotifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.timestamp - a.timestamp;
    });

    setNotifications(newNotifications.slice(0, 5)); // Limit to 5 notifications
  }, [badges, dismissedIds]);

  const generateHints = (badge: Badge): string[] => {
    const hints: string[] = [];
    
    badge.requirements.forEach(req => {
      const remaining = req.target - req.current;
      const percentage = (req.current / req.target) * 100;
      
      if (percentage < 50) {
        switch (req.type) {
          case 'focus_sessions':
            hints.push(`Complete ${remaining} more focus sessions to progress on "${badge.name}"`);
            break;
          case 'tasks_completed':
            hints.push(`Finish ${remaining} more tasks to unlock "${badge.name}"`);
            break;
          case 'exercise_minutes':
            hints.push(`Log ${remaining} more minutes of exercise for "${badge.name}"`);
            break;
          case 'water_glasses':
            hints.push(`Drink ${remaining} more glasses of water to progress on "${badge.name}"`);
            break;
          case 'consecutive_days':
            hints.push(`Keep your streak going for ${remaining} more days to earn "${badge.name}"`);
            break;
          case 'social_connections':
            hints.push(`Connect with ${remaining} more people to unlock "${badge.name}"`);
            break;
          default:
            hints.push(`You need ${remaining} more ${req.type.replace('_', ' ')} for "${badge.name}"`);
        }
      }
    });
    
    return hints;
  };

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => new Set([...prev, notificationId]));
    onDismiss?.(notificationId);
  };

  const handleAction = (notification: BadgeProgressNotification) => {
    onTakeAction?.(notification.badge);
    handleDismiss(notification.id);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'green';
    if (progress >= 75) return 'orange';
    if (progress >= 50) return 'yellow';
    return 'blue';
  };

  if (notifications.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground dark:text-white">
          Badge Progress
        </h3>
        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
          {notifications.length} update{notifications.length !== 1 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => {
          const typeConfig = notificationTypes[notification.type];
          const progressColor = getProgressColor(notification.badge.progress);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-4 rounded-lg border',
                colorClasses[typeConfig.color as keyof typeof colorClasses]
              )}
            >
              <div className="flex items-start space-x-3">
                {/* Badge Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-muted/50 flex items-center justify-center text-lg">
                    {notification.badge.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{typeConfig.icon}</span>
                    <h4 className="font-medium text-sm">
                      {typeConfig.title}
                    </h4>
                    <span className="text-xs opacity-75">
                      {notification.badge.tier} • {notification.badge.category}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">
                    {notification.message}
                  </p>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">{notification.badge.progress}%</span>
                    </div>
                    <div className="w-full bg-white/30 dark:bg-muted/30 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${notification.badge.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={cn(
                          'h-2 rounded-full',
                          progressColor === 'green' ? 'bg-success-light0' :
                          progressColor === 'orange' ? 'bg-primary-500' :
                          progressColor === 'yellow' ? 'bg-warning-light0' :
                          'bg-info-light0'
                        )}
                      />
                    </div>
                  </div>

                  {/* Requirements */}
                  {notification.badge.requirements.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {notification.badge.requirements.slice(0, 2).map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-center justify-between text-xs opacity-75">
                          <span>{req.type.replace('_', ' ')}</span>
                          <span>{req.current}/{req.target}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  {notification.actionable && (
                    <Button
                      onClick={() => handleAction(notification)}
                      size="sm"
                      className="text-xs px-2 py-1 h-auto"
                    >
                      Take Action
                    </Button>
                  )}
                  
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-muted/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-4"
      >
        <h4 className="font-medium text-foreground dark:text-white mb-3">Badge Progress Summary</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-success dark:text-success-light">
              {badges.filter(b => b.isUnlocked).length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">Unlocked</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-primary dark:text-primary-400">
              {badges.filter(b => !b.isUnlocked && b.progress >= 75).length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">Almost There</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-info dark:text-info">
              {badges.filter(b => !b.isUnlocked && b.progress > 0 && b.progress < 75).length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">In Progress</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-muted-foreground dark:text-muted-foreground">
              {badges.filter(b => !b.isUnlocked && b.progress === 0).length}
            </div>
            <div className="text-xs text-muted-foreground dark:text-muted-foreground">Not Started</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BadgeProgressNotifications;