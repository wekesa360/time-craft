import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MeetingScheduler from '../components/features/calendar/MeetingScheduler';
import CalendarView from '../components/features/calendar/CalendarView';
import { MeetingRequests } from '../components/features/calendar/MeetingRequests';
import { AvailabilityPicker } from '../components/features/calendar/AvailabilityPicker';
import CalendarIntegrations from '../components/features/calendar/CalendarIntegrations';
import TabSwitcher from '../components/ui/TabSwitcher';
import type { TabItem } from '../components/ui/TabSwitcher';

type ViewMode = 'calendar' | 'scheduler' | 'requests' | 'availability' | 'integrations';

export default function CalendarPage() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ViewMode>('calendar');

  const views: TabItem[] = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'scheduler', label: 'Schedule Meeting' },
    { id: 'requests', label: 'Requests' },
    { id: 'availability', label: 'Availability' },
    { id: 'integrations', label: 'Integrations' },
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
      case 'integrations':
        return <CalendarIntegrations />;
      default:
        return <CalendarView />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {t('navigation.calendar')}
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered meeting scheduling and calendar management
            </p>
          </div>
        </div>

        {/* View Navigation */}
        <TabSwitcher
          tabs={views}
          activeTab={activeView}
          onTabChange={(tabId) => setActiveView(tabId as ViewMode)}
        />

        {/* Active View Content */}
        <div className="bg-card rounded-2xl border border-border p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}