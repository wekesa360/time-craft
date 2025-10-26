import React, { useState } from 'react';
import { useSendNotificationMutation } from '../../../hooks/queries/useNotificationQueries';

export const NotificationTester: React.FC = () => {
  const [testData, setTestData] = useState({
    type: 'task_reminder',
    title: 'Test Notification',
    message: 'This is a test notification to verify your settings are working correctly.',
    data: {}
  });

  const sendMutation = useSendNotificationMutation();

  const notificationTypes = [
    { value: 'task_reminder', label: 'Task Reminder', icon: '✅' },
    { value: 'health_reminder', label: 'Health Reminder', icon: '🏃' },
    { value: 'achievement', label: 'Achievement', icon: '🏆' },
    { value: 'social', label: 'Social', icon: '👥' },
    { value: 'system', label: 'System', icon: '⚙️' },
  ];

  const testTemplates = {
    task_reminder: {
      title: 'Task Reminder',
      message: 'Don\'t forget to complete your daily review task!',
      data: { taskId: 'test_task_123' }
    },
    health_reminder: {
      title: 'Health Check-in',
      message: 'Time to log your daily exercise and mood!',
      data: { reminderType: 'daily_checkin' }
    },
    achievement: {
      title: 'Achievement Unlocked! 🎉',
      message: 'Congratulations! You\'ve earned the "Early Bird" badge!',
      data: { badgeId: 'early_bird', points: 100 }
    },
    social: {
      title: 'Challenge Update',
      message: 'You\'re now in 2nd place in the "30-Day Fitness Challenge"!',
      data: { challengeId: 'fitness_30', rank: 2 }
    },
    system: {
      title: 'System Update',
      message: 'New features are now available! Check out the latest updates.',
      data: { updateVersion: '2.1.0' }
    }
  };

  const handleTypeChange = (type: string) => {
    const template = testTemplates[type as keyof typeof testTemplates];
    setTestData({
      type,
      ...template
    });
  };

  const handleSendTest = async () => {
    try {
      await sendMutation.mutateAsync(testData);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const sendBrowserNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(testData.title, {
        body: testData.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          sendBrowserNotification();
        }
      });
    } else {
      alert('Browser notifications are not supported or have been denied.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
          Notification Tester
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground">
          Test different types of notifications to ensure they're working correctly
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Type Selection */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            📋 Notification Type
          </h3>
          
          <div className="grid md:grid-cols-2 gap-3">
            {notificationTypes.map(type => (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  testData.type === type.value
                    ? 'bg-info-light dark:bg-info/20 border-blue-500 text-info dark:text-info-light'
                    : 'bg-muted dark:bg-muted border-gray-300 dark:border-gray-500 text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Notification Content */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            ✏️ Notification Content
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white"
                placeholder="Notification title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                Message
              </label>
              <textarea
                value={testData.message}
                onChange={(e) => setTestData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white resize-none"
                placeholder="Notification message"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-2">
                Additional Data (JSON)
              </label>
              <textarea
                value={JSON.stringify(testData.data, null, 2)}
                onChange={(e) => {
                  try {
                    const data = JSON.parse(e.target.value);
                    setTestData(prev => ({ ...prev, data }));
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-muted text-foreground dark:text-white font-mono text-sm resize-none"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            👀 Preview
          </h3>
          
          <div className="bg-muted dark:bg-muted rounded-lg p-4 border border-gray-200 dark:border-gray-500">
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {notificationTypes.find(t => t.value === testData.type)?.icon || '📢'}
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-foreground dark:text-white mb-1">
                  {testData.title}
                </h4>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {testData.message}
                </p>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                  Type: {testData.type} • Just now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            🧪 Test Actions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={handleSendTest}
              disabled={sendMutation.isPending || !testData.title || !testData.message}
              className="px-6 py-3 bg-info text-white rounded-lg hover:bg-info disabled:bg-muted transition-colors font-medium"
            >
              {sendMutation.isPending ? 'Sending...' : '📤 Send Push Notification'}
            </button>

            <button
              onClick={sendBrowserNotification}
              disabled={!testData.title || !testData.message}
              className="px-6 py-3 bg-success text-white rounded-lg hover:bg-success disabled:bg-muted transition-colors font-medium"
            >
              🌐 Test Browser Notification
            </button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground dark:text-muted-foreground">
            <p className="mb-2">
              <strong>Push Notification:</strong> Sends through the app's notification system and appears in your notification history.
            </p>
            <p>
              <strong>Browser Notification:</strong> Shows a native browser notification immediately (requires permission).
            </p>
          </div>
        </div>

        {/* Quick Tests */}
        <div className="bg-white dark:bg-muted rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">
            ⚡ Quick Tests
          </h3>
          
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(testTemplates).map(([type, template]) => {
              const typeInfo = notificationTypes.find(t => t.value === type);
              return (
                <button
                  key={type}
                  onClick={() => {
                    setTestData({ type, ...template });
                    setTimeout(() => handleSendTest(), 100);
                  }}
                  disabled={sendMutation.isPending}
                  className="p-3 text-left bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted rounded-lg border border-gray-300 dark:border-gray-500 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{typeInfo?.icon}</span>
                    <span className="font-medium text-foreground dark:text-white text-sm">
                      {typeInfo?.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground line-clamp-2">
                    {template.message}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 bg-warning-light dark:bg-warning/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="font-semibold text-warning dark:text-warning-light mb-3">
          💡 Testing Tips
        </h3>
        <ul className="text-sm text-warning dark:text-warning-light space-y-1">
          <li>• Make sure browser notifications are enabled for the best testing experience</li>
          <li>• Check your notification preferences to ensure the test type is enabled</li>
          <li>• Test during and outside of quiet hours to verify the settings work</li>
          <li>• Use different priority levels to see how they appear differently</li>
        </ul>
      </div>
    </div>
  );
};