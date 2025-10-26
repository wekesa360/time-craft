import React, { useState } from 'react';
import { NotificationPreferences } from '../components/features/notifications/NotificationPreferences';
import { NotificationHistory } from '../components/features/notifications/NotificationHistory';
import { NotificationTester } from '../components/features/notifications/NotificationTester';

type ViewMode = 'preferences' | 'history' | 'tester';

const NotificationsPage: React.FC = () => {
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
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Push Notifications
          </h1>
          <p className="text-muted-foreground">
            Manage your notification preferences, view history, and test notifications
          </p>
        </div>

        {/* View Navigation */}
        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === view.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white dark:bg-muted text-muted-foreground dark:text-muted-foreground hover:bg-indigo-50 dark:hover:bg-muted'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Active View Content */}
        <div className="bg-card rounded-2xl border border-border p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;