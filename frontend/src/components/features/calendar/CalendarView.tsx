import React, { useState } from 'react';
import { useCalendarEventsQuery, useDeleteEventMutation, useUpdateEventMutation } from '../../../hooks/queries/useCalendarQueries';
import type { CalendarEvent } from '../../../types';
import { Sheet } from '../../ui/Sheet';
import { Calendar, Clock, MapPin, User, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    location: '',
    eventType: 'appointment' as const,
    startTime: '',
    endTime: ''
  });

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
  const deleteEventMutation = useDeleteEventMutation();
  const updateEventMutation = useUpdateEventMutation();

  // Debug logging for calendar events
  React.useEffect(() => {
    console.log('CalendarView loaded events:', {
      viewMode,
      currentDate: currentDate.toISOString(),
      dateRange: getDateRange(),
      eventsCount: eventsData?.data?.length || 0,
      events: eventsData?.data
    });
  }, [eventsData, viewMode, currentDate]);

  // Helper functions for event management
  const handleEditEvent = (event: CalendarEvent) => {
    setEditForm({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      eventType: event.eventType,
      startTime: new Date(event.startTime).toISOString().slice(0, 16),
      endTime: new Date(event.endTime).toISOString().slice(0, 16)
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent) return;

    try {
      const updatedEvent = {
        ...selectedEvent,
        title: editForm.title,
        description: editForm.description,
        location: editForm.location,
        eventType: editForm.eventType,
        startTime: new Date(editForm.startTime).getTime(),
        endTime: new Date(editForm.endTime).getTime()
      };

      await updateEventMutation.mutateAsync({
        id: selectedEvent.id,
        data: updatedEvent
      });

      setSelectedEvent(updatedEvent);
      setIsEditing(false);
      toast.success('Event updated successfully!');
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      title: '',
      description: '',
      location: '',
      eventType: 'appointment',
      startTime: '',
      endTime: ''
    });
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEventMutation.mutateAsync(event.id);
        setSelectedEvent(null);
        toast.success('Event deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  };

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
    // Removed emoji icons - using text labels or lucide icons instead
    return '';
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      meeting: 'bg-primary/10 text-primary border-primary/20',
      appointment: 'bg-success/10 text-success border-success/20',
      task: 'bg-warning/10 text-warning border-warning/20',
      reminder: 'bg-info/10 text-info border-info/20',
      break: 'bg-muted text-muted-foreground border-border',
      lecture: 'bg-primary/10 text-primary border-primary/20',
      study: 'bg-success/10 text-success border-success/20',
      personal: 'bg-warning/10 text-warning border-warning/20',
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
          className={`min-h-[120px] p-2 border border-border ${
            current.getMonth() !== currentDate.getMonth()
              ? 'bg-muted text-muted-foreground'
              : 'bg-card'
          } ${
            current.toDateString() === new Date().toDateString()
              ? 'ring-2 ring-primary'
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
                onClick={() => setSelectedEvent(event)}
                className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.eventType)}`}
                title={`${event.title} - ${new Date(event.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}`}
              >
                {event.title.length > 15 ? `${event.title.substring(0, 15)}...` : event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );

      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-border rounded-xl overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-muted p-3 text-center font-medium text-muted-foreground">
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
        <div key={i} className="border-r border-border last:border-r-0">
          <div className={`p-3 text-center font-medium border-b border-border ${
            day.toDateString() === new Date().toDateString()
              ? 'bg-primary/10 text-primary'
              : 'bg-muted'
          }`}>
            <div className="text-sm text-muted-foreground">
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
                onClick={() => setSelectedEvent(event)}
                className={`p-2 rounded border text-sm cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.eventType)}`}
              >
                <div className="font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
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
      <div className="grid grid-cols-7 border border-border rounded-xl overflow-hidden">
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
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-muted p-4 border-b border-border">
          <h3 className="font-medium text-foreground">
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
              <div key={hour} className="flex border-b border-border/50">
                <div className="w-20 p-3 text-sm text-muted-foreground bg-muted border-r border-border">
                  {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                </div>
                <div className="flex-1 p-2 min-h-[60px]">
                  {hourEvents.map((event, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-2 rounded border mb-1 cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.eventType)}`}
                    >
                      <div className="font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
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
                        <div className="text-xs opacity-75">Location: {event.location}</div>
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
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-3 text-muted-foreground">Loading calendar...</span>
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
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-foreground">
            {formatDateHeader()}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
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
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:bg-card/80'
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
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Event Details Sheet */}
      <Sheet
        isOpen={!!selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          setIsEditing(false);
        }}
        title={isEditing ? "Edit Event" : "Event Details"}
        className=""
      >
        {selectedEvent && (
          <div className="h-full flex flex-col">
            {!isEditing ? (
              // View Mode
              <>
                {/* Header Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${getEventTypeColor(selectedEvent.eventType)}`}>
                    <span className="w-3 h-3 rounded-full bg-current opacity-75 mr-2"></span>
                    {selectedEvent.eventType.charAt(0).toUpperCase() + selectedEvent.eventType.slice(1)}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground dark:text-white leading-tight">
                    {selectedEvent.title}
                  </h3>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Time & Date Card */}
                  <div className="bg-white dark:bg-muted rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-info-light dark:bg-info/30 rounded-lg">
                        <Clock className="w-6 h-6 text-info dark:text-info" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground dark:text-white mb-1">When</h4>
                        <div className="text-muted-foreground dark:text-muted-foreground">
                          <div className="font-medium text-foreground dark:text-white">
                            {new Date(selectedEvent.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-mono">
                              {new Date(selectedEvent.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-lg font-mono">
                              {new Date(selectedEvent.endTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-2 flex items-center gap-1">
                            <span>Duration: {Math.round((selectedEvent.endTime - selectedEvent.startTime) / (1000 * 60))} minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Card */}
                  {selectedEvent.location && (
                    <div className="bg-white dark:bg-muted rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-success-light dark:bg-success/30 rounded-lg">
                          <MapPin className="w-6 h-6 text-success dark:text-success-light" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground dark:text-white mb-1">Location</h4>
                          <p className="text-muted-foreground dark:text-muted-foreground">{selectedEvent.location}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description Card */}
                  {selectedEvent.description && (
                    <div className="bg-white dark:bg-muted rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground dark:text-white mb-1">Description</h4>
                          <p className="text-muted-foreground dark:text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Source Card */}
                  <div className="bg-white dark:bg-muted rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted dark:bg-muted rounded-lg">
                        <User className="w-6 h-6 text-muted-foreground dark:text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground dark:text-white mb-1">Source</h4>
                        <p className="text-muted-foreground dark:text-muted-foreground capitalize">{selectedEvent.source || 'Manual'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-muted dark:bg-muted">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditEvent(selectedEvent)}
                      className="flex-1 flex items-center justify-center gap-2 bg-info text-white py-3 px-4 rounded-xl hover:bg-info transition-all duration-200 font-medium shadow-sm"
                    >
                      <Edit className="w-5 h-5" />
                      Edit Event
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent)}
                      disabled={deleteEventMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-error text-white py-3 px-4 rounded-xl hover:bg-error transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                      {deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              // Edit Mode
              <>
                {/* Edit Form */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter event title"
                    />
                  </div>

                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Event Type
                    </label>
                    <select
                      value={editForm.eventType}
                      onChange={(e) => setEditForm(prev => ({ ...prev, eventType: e.target.value as any }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="appointment">Appointment</option>
                      <option value="task">Task</option>
                      <option value="reminder">Reminder</option>
                      <option value="break">Break</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter location (optional)"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Enter event description (optional)"
                    />
                  </div>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-muted dark:bg-muted">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateEventMutation.isPending || !editForm.title || !editForm.startTime || !editForm.endTime}
                      className="flex-1 flex items-center justify-center gap-2 bg-success text-white py-3 px-4 rounded-xl hover:bg-success transition-all duration-200 font-medium shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 bg-muted text-white py-3 px-4 rounded-xl hover:bg-muted transition-all duration-200 font-medium shadow-sm"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Sheet>

    </div>
  );
};

export default CalendarView;