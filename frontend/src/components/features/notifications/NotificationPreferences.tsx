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
        <span className="ml-3 text-muted-foreground dark:text-muted-foreground">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
          Notification Preferences
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Customize when and how you receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Push Notification Setup */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            📱 Push Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground dark:text-white">
                  Browser Notifications
                </div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Status: {pushPermission === 'granted' ? '✅ Enabled' : 
                           pushPermission === 'denied' ? '❌ Blocked' : '⏳ Not set'}
                </div>
              </div>
              
              {pushPermission !== 'granted' && (
                <button
                  onClick={requestPushPermission}
                  disabled={registerDeviceMutation.isPending}
                  className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info disabled:bg-muted transition-colors"
                >
                  {registerDeviceMutation.isPending ? 'Enabling...' : 'Enable Notifications'}
                </button>
              )}
              
              {pushPermission === 'granted' && (
                <button
                  onClick={testNotification}
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success transition-colors"
                >
                  Test Notification
                </button>
              )}
            </div>

            {pushPermission === 'denied' && (
              <div className="bg-error-light dark:bg-error/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-error dark:text-error-light">
                  ⚠️ Notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Categories */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            🔔 Notification Types
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Task Reminders
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Get notified about upcoming tasks and deadlines
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('taskReminders', !localPreferences.taskReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.taskReminders
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Health Reminders
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Reminders to log health data and maintain habits
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('healthReminders', !localPreferences.healthReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.healthReminders
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Social Notifications
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Updates about challenges, connections, and social activities
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('socialNotifications', !localPreferences.socialNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.socialNotifications
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Badge Unlocks
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Celebrate when you unlock new achievements
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('badgeUnlocks', !localPreferences.badgeUnlocks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.badgeUnlocks
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Challenge Updates
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Progress updates and results from challenges you're in
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('challengeUpdates', !localPreferences.challengeUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.challengeUpdates
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Meeting Reminders
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Reminders about upcoming meetings and calendar events
                </p>
              </div>
              <button
                onClick={() => handlePreferenceChange('meetingReminders', !localPreferences.meetingReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.meetingReminders
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            🌙 Quiet Hours
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                  Enable Quiet Hours
                </label>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Pause non-urgent notifications during specified hours
                </p>
              </div>
              <button
                onClick={() => handleQuietHoursChange('enabled', !localPreferences.quietHours?.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences.quietHours?.enabled
                    ? 'bg-info'
                    : 'bg-muted dark:bg-muted'
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
                  <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quietHours?.start || '22:00'}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={localPreferences.quietHours?.end || '08:00'}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white"
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
            className="px-6 py-2 bg-info text-white rounded-lg hover:bg-info disabled:bg-muted transition-colors"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-6 py-2 bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted disabled:bg-muted dark:disabled:bg-muted transition-colors"
          >
            Reset
          </button>
        </div>

        {hasChanges && (
          <div className="bg-warning-light dark:bg-warning/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-warning dark:text-warning-light">
              ⚠️ You have unsaved changes. Don't forget to save your notification preferences!
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-info-light dark:bg-info/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-info dark:text-info-light mb-3">
          💡 Notification Tips
        </h3>
        <ul className="text-sm text-info dark:text-info-light space-y-1">
          <li>• Enable browser notifications for the best experience</li>
          <li>• Use quiet hours to avoid interruptions during sleep or focus time</li>
          <li>• Customize notification types based on your priorities</li>
          <li>• Test notifications to ensure they're working properly</li>
        </ul>
      </div>
    </div>
  );
};