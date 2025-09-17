import React, { useState, useEffect } from 'react';
import { 
  useNotificationPreferencesQuery, 
  useUpdateNotificationPreferencesMutation,
  useRegisterDeviceMutation 
} from '../../../hooks/queries/useNotificationQueries';
import type { NotificationPreferences as NotificationPreferencesType } from '../../../types';

export const NotificationPreferences: React.FC = () => {
  const { data: preferences, isLoading } = useNotificationPreferencesQuery();
  const updateMutation = useUpdateNotificationPreferencesMutation();
  const registerDeviceMutation = useRegisterDeviceMutation();

  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferencesType>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    // Check current push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferencesType, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'enabled' | 'start' | 'end', value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localPreferences) return;
    
    try {
      await updateMutation.mutateAsync(localPreferences as NotificationPreferencesType);
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences);
      setHasChanges(false);
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support push notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        // Register device for push notifications
        // In a real app, you would get the actual device token from your push service
        const deviceToken = 'mock_device_token_' + Date.now();
        const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 
                        /Android/.test(navigator.userAgent) ? 'android' : 'web';
        
        await registerDeviceMutation.mutateAsync({
          deviceToken,
          platform,
          appVersion: '1.0.0'
        });
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
    }
  };

  const testNotification = () => {
    if (pushPermission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Time & Wellness',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else {
      alert('Push notifications are not enabled. Please enable them first.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Customize when and how you receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Push Notification Setup */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📱 Push Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Browser Notifications
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Status: {pushPermission === 'granted' ? '✅ Enabled' : 
                           pushPermission === 'denied' ? '❌ Blocked' : '⏳ Not set'}
                </div>
              </div>
              
              {pushPermission !== 'granted' && (
                <button
                  onClick={requestPushPermission}
                  disabled={registerDeviceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {registerDeviceMutation.isPending ? 'Enabling...' : 'Enable Notifications'}
                </button>
              )}
              
              {pushPermission === 'granted' && (
                <button
                  onClick={testNotification}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Test Notification
                </button>
              )}
            </div>

            {pushPermission === 'denied' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ Notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Categories */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔔 Notification Types
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Task Reminders
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified about upcoming tasks and deadlines
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('taskReminders', !localPreferences.taskReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.taskReminders
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.taskReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Health Reminders
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reminders to log health data and maintain habits
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('healthReminders', !localPreferences.healthReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.healthReminders
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.healthReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Social Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Updates about challenges, connections, and social activities
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('socialNotifications', !localPreferences.socialNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.socialNotifications
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.socialNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Badge Unlocks
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Celebrate when you unlock new achievements
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('badgeUnlocks', !localPreferences.badgeUnlocks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.badgeUnlocks
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.badgeUnlocks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Challenge Updates
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Progress updates and results from challenges you're in
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('challengeUpdates', !localPreferences.challengeUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.challengeUpdates
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.challengeUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meeting Reminders
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reminders about upcoming meetings and calendar events
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('meetingReminders', !localPreferences.meetingReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.meetingReminders
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.meetingReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🌙 Quiet Hours
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Quiet Hours
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pause non-urgent notifications during specified hours
                </p>
              </div>
              <button
                onClick={() => handleQuietHoursChange('enabled', !localPreferences.quietHours?.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.quietHours?.enabled
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.quietHours?.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {localPreferences.quietHours?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quietHours?.start || '22:00'}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quietHours?.end || '08:00'}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You have unsaved changes. Don't forget to save your notification preferences!
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Notification Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Enable browser notifications for the best experience</li>
          <li>• Use quiet hours to avoid interruptions during sleep or focus time</li>
          <li>• Customize notification types based on your priorities</li>
          <li>• Test notifications to ensure they're working properly</li>
        </ul>
      </div>
    </div>
  );
};