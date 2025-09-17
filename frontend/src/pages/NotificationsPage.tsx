import React, { useState } from 'react';
import { NotificationPreferences } from '../components/features/notifications/NotificationPreferences';
import { NotificationHistory } from '../components/features/notifications/NotificationHistory';
import { NotificationTester } from '../components/features/notifications/NotificationTester';

type ViewMode = 'preferences' | 'history' | 'tester';

export const NotificationsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('preferences');

  const views = [
    { id: 'preferences' as const, label: 'Preferences', icon: '⚙️' },
    { id: 'history' as const, label: 'History', icon: '📋' },
    { id: 'tester' as const, label: 'Test', icon: '🧪' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'preferences':
        return <NotificationPreferences />;
      case 'history':
        return <NotificationHistory />;
      case 'tester':
        return <NotificationTester />;
      default:
        return <NotificationPreferences />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Push Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your notification preferences, view history, and test notifications
          </p>
        </div>

        {/* View Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === view.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Active View Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};