import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus, X, Calendar, Clock, MapPin } from 'lucide-react';
import MeetingScheduler from '../components/features/calendar/MeetingScheduler';
import CalendarView from '../components/features/calendar/CalendarView';
import { MeetingRequests } from '../components/features/calendar/MeetingRequests';
import { AvailabilityPicker } from '../components/features/calendar/AvailabilityPicker';
import CalendarIntegrations from '../components/features/calendar/CalendarIntegrations';
import TabSwitcher from '../components/ui/TabSwitcher';
import type { TabItem } from '../components/ui/TabSwitcher';
import { useCalendarEventsQuery } from '../hooks/queries/useCalendarQueries';

type ViewMode = 'calendar' | 'scheduler' | 'requests' | 'availability' | 'integrations';

export default function CalendarPage() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('calendar');

  // Get today's events
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  
  const { data: todayEventsData } = useCalendarEventsQuery({
    start: todayStart,
    end: todayEnd
  });

  // Get upcoming events for this week
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data: weekEventsData } = useCalendarEventsQuery({
    start: weekStart.getTime(),
    end: weekEnd.getTime()
  });

  const todayEvents = todayEventsData?.data || [];
  const upcomingEvents = weekEventsData?.data?.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate > today;
  }).slice(0, 6) || [];

  const getEventColor = (eventType: string) => {
    const colors = {
      meeting: 'bg-red-500',
      appointment: 'bg-primary',
      task: 'bg-orange-500',
      reminder: 'bg-blue-500',
      break: 'bg-purple-500',
      lecture: 'bg-teal-500',
      study: 'bg-green-500',
      personal: 'bg-pink-500',
    };
    return colors[eventType as keyof typeof colors] || 'bg-primary';
  };

  const formatEventDay = (timestamp: number) => {
    const eventDate = new Date(timestamp);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (eventDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
  };

  // Tab configuration
  const calendarTabs: TabItem[] = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'scheduler', label: 'Schedule Meeting' },
    { id: 'requests', label: 'Requests' },
    { id: 'availability', label: 'Availability' },
    { id: 'integrations', label: 'Integrations' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'calendar':
        return (
          <>
            <div className={`grid gap-6 ${todayEvents.length > 0 ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
              {/* Calendar */}
              <div className={`bg-card rounded-2xl p-6 border border-border ${todayEvents.length > 0 ? 'lg:col-span-2' : ''}`}>
                <CalendarView />
              </div>

              {/* Today's Schedule - Only show if there are events */}
              {todayEvents.length > 0 && (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="text-lg font-bold text-foreground mb-4">Today's Schedule</h2>

                  <div className="space-y-3">
                    {todayEvents.map((event, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-border hover:border-primary transition-colors cursor-pointer"
                      >
                        <div className={`w-1 h-full ${getEventColor(event.eventType)} rounded-full`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(event.endTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upcoming Events - Only show if there are events */}
            {upcomingEvents.length > 0 && (
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">Upcoming This Week</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingEvents.map((event, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-border hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getEventColor(event.eventType)}`} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatEventDay(event.startTime)}
                        </span>
                      </div>
                      <p className="font-medium text-foreground mb-1">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(event.endTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      case 'scheduler':
        return (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <MeetingScheduler />
          </div>
        );
      case 'requests':
        return (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <MeetingRequests />
          </div>
        );
      case 'availability':
        return (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <AvailabilityPicker />
          </div>
        );
      case 'integrations':
        return (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <CalendarIntegrations />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              {activeView === 'calendar' && 'Manage your schedule and appointments'}
              {activeView === 'scheduler' && 'AI-powered meeting scheduling'}
              {activeView === 'requests' && 'Manage meeting requests and invitations'}
              {activeView === 'availability' && 'Set your availability preferences'}
              {activeView === 'integrations' && 'Connect external calendar services'}
            </p>
          </div>
          {activeView === 'calendar' && (
            <button
              onClick={() => setShowAddEvent(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <TabSwitcher
          tabs={calendarTabs}
          activeTab={activeView}
          onTabChange={(tabId) => setActiveView(tabId as ViewMode)}
        />

        {/* Active View Content */}
        {renderActiveView()}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 border border-border max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Add Event</h3>
              <button 
                onClick={() => setShowAddEvent(false)} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Event title..."
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="datetime-local"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <input
                type="text"
                placeholder="Location (optional)..."
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              <textarea
                placeholder="Description (optional)..."
                rows={3}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 py-2 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement add event functionality
                    setShowAddEvent(false);
                  }}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}