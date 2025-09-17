import React, { useState } from 'react';
import { useCalendarEventsQuery } from '../../../hooks/queries/useCalendarQueries';
import type { CalendarEvent } from '../../../types';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Calculate date range for API query
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        break;
      case 'day':
        end.setDate(end.getDate() + 1);
        break;
    }

    return {
      start: start.getTime(),
      end: end.getTime(),
    };
  };

  const { data: eventsData, isLoading } = useCalendarEventsQuery(getDateRange());

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
      case 'week':
        const weekStart = new Date(currentDate);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        return `${weekStart.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${weekEnd.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    const icons = {
      meeting: '🤝',
      appointment: '📅',
      task: '✅',
      reminder: '⏰',
      break: '☕',
    };
    return icons[eventType as keyof typeof icons] || '📅';
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
      appointment: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
      task: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
      reminder: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
      break: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    };
    return colors[eventType as keyof typeof colors] || colors.appointment;
  };

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayEvents = eventsData?.data?.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === current.toDateString();
      }) || [];

      days.push(
        <div
          key={i}
          className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-600 ${
            current.getMonth() !== currentDate.getMonth()
              ? 'bg-gray-50 dark:bg-gray-800 text-gray-400'
              : 'bg-white dark:bg-gray-700'
          } ${
            current.toDateString() === new Date().toDateString()
              ? 'ring-2 ring-blue-500'
              : ''
          }`}
        >
          <div className="font-medium text-sm mb-1">
            {current.getDate()}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                className={`text-xs p-1 rounded border ${getEventTypeColor(event.eventType)}`}
                title={`${event.title} - ${new Date(event.startTime).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}`}
              >
                <span className="mr-1">{getEventTypeIcon(event.eventType)}</span>
                {event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );

      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 dark:bg-gray-600 p-3 text-center font-medium text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    const dayOfWeek = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      
      const dayEvents = eventsData?.data?.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === day.toDateString();
      }) || [];

      days.push(
        <div key={i} className="border-r border-gray-200 dark:border-gray-600 last:border-r-0">
          <div className={`p-3 text-center font-medium border-b border-gray-200 dark:border-gray-600 ${
            day.toDateString() === new Date().toDateString()
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'bg-gray-50 dark:bg-gray-700'
          }`}>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-lg">
              {day.getDate()}
            </div>
          </div>
          <div className="p-2 space-y-2 min-h-[400px]">
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border text-sm ${getEventTypeColor(event.eventType)}`}
              >
                <div className="font-medium flex items-center gap-1">
                  <span>{getEventTypeIcon(event.eventType)}</span>
                  {event.title}
                </div>
                <div className="text-xs opacity-75">
                  {new Date(event.startTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} - {new Date(event.endTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {days}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = eventsData?.data?.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    }) || [];

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = new Date(event.startTime).getHours();
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-100 dark:border-gray-700">
                <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-600">
                  {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                </div>
                <div className="flex-1 p-2 min-h-[60px]">
                  {hourEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border mb-1 ${getEventTypeColor(event.eventType)}`}
                    >
                      <div className="font-medium flex items-center gap-1">
                        <span>{getEventTypeIcon(event.eventType)}</span>
                        {event.title}
                      </div>
                      <div className="text-xs opacity-75">
                        {new Date(event.startTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - {new Date(event.endTime).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-75">📍 {event.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {formatDateHeader()}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            →
          </button>
        </div>

        <div className="flex gap-2">
          {(['month', 'week', 'day'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="mb-6">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      {/* Today Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📅 Today
        </button>
      </div>

      {/* Event Summary */}
      {eventsData?.data && eventsData.data.length > 0 && (
        <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            📊 Event Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {Object.entries(
              eventsData.data.reduce((acc, event) => {
                acc[event.eventType] = (acc[event.eventType] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-lg">{getEventTypeIcon(type)}</div>
                <div className="font-medium text-gray-900 dark:text-white">{count}</div>
                <div className="text-gray-600 dark:text-gray-300 capitalize">{type}s</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};