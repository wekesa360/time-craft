import React, { useState } from 'react';
import { useNotificationHistoryQuery } from '../../../hooks/queries/useNotificationQueries';
import type { Notification } from '../../../types';

export const NotificationHistory: React.FC = () => {
  const [filters, setFilters] = useState({
    type: '',
    limit: 50,
  });

  const { data: notifications, isLoading, error } = useNotificationHistoryQuery(filters);

  const notificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'task_reminder', label: 'Task Reminders' },
    { value: 'health_reminder', label: 'Health Reminders' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'social', label: 'Social' },
    { value: 'system', label: 'System' },
  ];

  const getNotificationIcon = (type: string) => {
    const icons = {
      task_reminder: '✅',
      health_reminder: '🏃',
      achievement: '🏆',
      system: '⚙️',
      social: '👥',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: '🔴 Urgent',
      high: '🟠 High',
      medium: '🟡 Medium',
      low: '🔵 Low',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      window.open(notification.actionUrl, '_blank');
    }
  };

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: Record<string, Notification[]> = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading notification history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-2">❌ Error loading notifications</div>
        <p className="text-gray-600 dark:text-gray-300">Please try again later</p>
      </div>
    );
  }

  const groupedNotifications = notifications ? groupNotificationsByDate(notifications) : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Notification History
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage your past notifications
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value) }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={25}>25 notifications</option>
              <option value={50}>50 notifications</option>
              <option value={100}>100 notifications</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', limit: 50 })}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {groupedNotifications.length > 0 ? (
          groupedNotifications.map(([date, dayNotifications]) => (
            <div key={date} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 dark:bg-gray-600 px-6 py-3 border-b border-gray-200 dark:border-gray-500">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {dayNotifications.length} notification{dayNotifications.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Notifications for this date */}
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {dayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 border-l-4 transition-colors ${getPriorityColor(notification.priority)} ${
                      notification.actionUrl ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600' : ''
                    } ${!notification.isRead ? 'font-medium' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                              {getPriorityLabel(notification.priority)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500 dark:text-gray-400">
                              {formatDateTime(notification.createdAt)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs">
                              {notification.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          {notification.actionLabel && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {notification.actionLabel} →
                            </span>
                          )}
                        </div>

                        {notification.readAt && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Read {formatTimeAgo(notification.readAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No notifications found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {filters.type ? 'Try changing your filter settings' : 'You haven\'t received any notifications yet'}
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {notifications && notifications.length > 0 && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📊 Notification Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {notifications.length}
              </div>
              <div className="text-blue-600 dark:text-blue-300">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {notifications.filter(n => !n.isRead).length}
              </div>
              <div className="text-blue-600 dark:text-blue-300">Unread</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length}
              </div>
              <div className="text-blue-600 dark:text-blue-300">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                {new Set(notifications.map(n => n.type)).size}
              </div>
              <div className="text-blue-600 dark:text-blue-300">Types</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};