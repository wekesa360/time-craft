import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAccessibilityContext } from '../accessibility/AccessibilityProvider';
import type { Notification } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const notificationIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  system: Bell,
};

const notificationStyles = {
  info: 'bg-info-light border-blue-200 text-info dark:bg-info/20 dark:border-blue-800 dark:text-info-light',
  success: 'bg-success-light border-green-200 text-success dark:bg-success/20 dark:border-green-800 dark:text-success-light',
  warning: 'bg-warning-light border-yellow-200 text-warning dark:bg-warning/20 dark:border-yellow-800 dark:text-warning-light',
  error: 'bg-error-light border-red-200 text-error dark:bg-error/20 dark:border-red-800 dark:text-error-light',
  system: 'bg-muted border-gray-200 text-muted-foreground dark:bg-muted/20 dark:border-gray-800 dark:text-muted-foreground',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const { t } = useTranslation();
  const { announce } = useAccessibilityContext();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'tasks' | 'health' | 'social'>('all');

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.getNotifications(filter),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      announce('Notification marked as read');
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      announce('All notifications marked as read');
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      announce('Notification deleted');
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: () => apiClient.clearAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      announce('All notifications cleared');
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'system') return notification.type === 'system';
    if (filter === 'tasks') return notification.category === 'tasks';
    if (filter === 'health') return notification.category === 'health';
    if (filter === 'social') return notification.category === 'social';
    return true;
  });

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  }, [markAsReadMutation]);

  // Handle mark as read
  const handleMarkAsRead = useCallback((notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  }, [markAsReadMutation]);

  // Handle delete
  const handleDelete = useCallback((notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  }, [deleteNotificationMutation]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    clearAllMutation.mutate();
  }, [clearAllMutation]);

  // Announce new notifications
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      announce(`You have ${unreadCount} new notifications`);
    }
  }, [notifications, announce]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${className}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-muted shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground dark:text-white">
                {t('notifications.title')}
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-light text-info dark:bg-info dark:text-info-light">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  className="text-sm text-info hover:text-info dark:text-info dark:hover:text-info-light disabled:opacity-50"
                >
                  {t('notifications.markAllAsRead')}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 overflow-x-auto">
              {[
                { key: 'all', label: t('notifications.filters.all') },
                { key: 'unread', label: t('notifications.filters.unread') },
                { key: 'system', label: t('notifications.filters.system') },
                { key: 'tasks', label: t('notifications.filters.tasks') },
                { key: 'health', label: t('notifications.filters.health') },
                { key: 'social', label: t('notifications.filters.social') },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                    filter === key
                      ? 'bg-info-light text-info dark:bg-info dark:text-info-light'
                      : 'text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32 text-error dark:text-error-light">
                {t('notifications.error.loading')}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground dark:text-muted-foreground">
                <Bell className="w-12 h-12 mb-2 opacity-50" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type];
                  const isUnread = !notification.read;
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted dark:hover:bg-muted ${
                        isUnread ? 'bg-info-light dark:bg-info/10' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 p-1 rounded-full ${
                          isUnread ? 'bg-info-light dark:bg-info' : 'bg-muted dark:bg-muted'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            notification.type === 'info' ? 'text-info' :
                            notification.type === 'success' ? 'text-success' :
                            notification.type === 'warning' ? 'text-warning' :
                            notification.type === 'error' ? 'text-error' :
                            'text-muted-foreground dark:text-muted-foreground'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-medium ${
                              isUnread ? 'text-foreground dark:text-white' : 'text-muted-foreground dark:text-muted-foreground'
                            }`}>
                              {notification.title}
                            </h3>
                            
                            <div className="flex items-center space-x-1">
                              {isUnread && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="p-1 text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
                                  aria-label={t('notifications.markAsRead')}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => handleDelete(notification.id, e)}
                                className="p-1 text-muted-foreground hover:text-error dark:hover:text-error-light"
                                aria-label={t('common.delete')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
                            <span>
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            
                            {notification.category && (
                              <span className="px-2 py-1 bg-muted dark:bg-muted rounded-full">
                                {t(`notifications.categories.${notification.category}`)}
                              </span>
                            )}
                          </div>
                          
                          {notification.actionLabel && (
                            <div className="mt-2">
                              <button className="text-sm text-info hover:text-info dark:text-info dark:hover:text-info-light">
                                {notification.actionLabel} →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
                className="w-full text-sm text-error hover:text-error dark:text-error-light dark:hover:text-error-light disabled:opacity-50"
              >
                {t('notifications.clearAll')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { announce } = useAccessibilityContext();

  // Create notification
  const createNotification = useMutation({
    mutationFn: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => 
      apiClient.create(notification),
    onSuccess: (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      announce('Notification created');
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: (notificationId: string) => apiClient.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    createNotification: createNotification.mutate,
    markAsRead: markAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    isCreating: createNotification.isPending,
    isMarkingAsRead: markAsRead.isPending,
    isDeleting: deleteNotification.isPending,
  };
};

export default NotificationCenter;