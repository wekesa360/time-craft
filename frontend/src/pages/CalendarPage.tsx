import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MeetingScheduler from '../components/features/calendar/MeetingScheduler';
import CalendarView from '../components/features/calendar/CalendarView';
import { MeetingRequests } from '../components/features/calendar/MeetingRequests';
import { AvailabilityPicker } from '../components/features/calendar/AvailabilityPicker';

type ViewMode = 'calendar' | 'scheduler' | 'requests' | 'availability';

export default function CalendarPage() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ViewMode>('calendar');

  const views = [
    { id: 'calendar' as const, label: 'Calendar', icon: '📅' },
    { id: 'scheduler' as const, label: 'Schedule Meeting', icon: '🤝' },
    { id: 'requests' as const, label: 'Requests', icon: '📬' },
    { id: 'availability' as const, label: 'Availability', icon: '⏰' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'calendar':
        return <CalendarView />;
      case 'scheduler':
        return <MeetingScheduler />;
      case 'requests':
        return <MeetingRequests />;
      case 'availability':
        return <AvailabilityPicker />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('navigation.calendar')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered meeting scheduling and calendar management
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
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
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
}