import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  CalendarIcon,
  PlusIcon,
  ArrowLeftIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
} from 'react-native-heroicons/outline';
import { apiClient } from '../lib/api';
import { useAppTheme } from '../constants/dynamicTheme';

// Local CalendarEvent shape to satisfy usage in this screen
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType?: string;
  startTime?: string | number;
  endTime?: string | number;
  isAllDay?: boolean;
  allDay?: boolean;
  location?: string;
}

export default function CalendarScreen() {
  const theme = useAppTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await apiClient.getEvents({
        start: startOfDay.getTime(),
        end: endOfDay.getTime(),
      });
      
      // Backend returns { data: CalendarEvent[] } or { events: CalendarEvent[] }
      const eventsData = response.data || response.events || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Failed to load events:', error);
      Alert.alert('Error', 'Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  const formatTime = (timestamp: string | number | undefined) => {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEventTypeColor = (eventType?: string) => {
    switch (eventType) {
      case 'meeting':
        return 'bg-red-100 border-red-300';
      case 'appointment':
        return 'bg-blue-100 border-blue-300';
      case 'task':
        return 'bg-orange-100 border-orange-300';
      case 'reminder':
        return 'bg-yellow-100 border-yellow-300';
      case 'break':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getEventTypeIcon = (eventType?: string) => {
    switch (eventType) {
      case 'meeting':
        return '🤝';
      case 'appointment':
        return '📅';
      case 'task':
        return '✅';
      case 'reminder':
        return '🔔';
      case 'break':
        return '☕';
      default:
        return '📋';
    }
  };

  const navigateToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const navigateToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const navigateToToday = () => {
    setSelectedDate(new Date());
  };

  // Month helpers
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const startWeekday = startOfMonth.getDay(); // 0=Sun
  const daysInMonth = endOfMonth.getDate();

  const weeks: Array<Array<Date | null>> = (() => {
    const cells: Array<Date | null> = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  })();

  const goPrevMonth = () => {
    const prev = new Date(selectedDate);
    prev.setMonth(prev.getMonth() - 1);
    setSelectedDate(prev);
  };

  const goNextMonth = () => {
    const next = new Date(selectedDate);
    next.setMonth(next.getMonth() + 1);
    setSelectedDate(next);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-2xl"
          style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
        >
          <ArrowLeftIcon size={20} color={theme.colors.muted} />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold" style={{ color: theme.colors.foreground }}>Calendar</Text>
        
        <TouchableOpacity
          onPress={() => router.push('/modals/add-event')}
          className="p-2 rounded-2xl"
          style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl }}
        >
          <PlusIcon size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Month Header + Controls */}
      <View className="px-6 py-4" style={{ backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={goPrevMonth} className="px-3 py-2 rounded-2xl" style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
            <Text style={{ color: theme.colors.muted }}>←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: theme.colors.foreground }}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={goNextMonth} className="px-3 py-2 rounded-2xl" style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
            <Text style={{ color: theme.colors.muted }}>→</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between mt-4">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <Text key={d} className="flex-1 text-center text-xs font-medium" style={{ color: theme.colors.muted }}>{d}</Text>
          ))}
        </View>
        {/* Month Grid */}
        <View className="mt-2">
          {weeks.map((row, rIdx) => (
            <View key={rIdx} className="flex-row">
              {row.map((date, cIdx) => {
                const isSelected = !!date && date.toDateString() === selectedDate.toDateString();
                return (
                  <View key={cIdx} className="flex-1 p-1">
                    {date ? (
                      <TouchableOpacity
                        className="items-center justify-center px-3 py-3 rounded-2xl"
                        style={{
                          borderWidth: 1,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.card,
                          borderRadius: theme.radii.xl,
                        }}
                        onPress={() => setSelectedDate(date)}
                      >
                        <Text className="text-sm" style={{ color: isSelected ? theme.colors.primary : theme.colors.foreground }}>{date.getDate()}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="px-3 py-3" />
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Events List */}
      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-2" style={{ color: theme.colors.muted }}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <CalendarIcon size={64} color={theme.colors.muted} />
            <Text className="text-xl font-semibold mt-4" style={{ color: theme.colors.foreground }}>
              No events today
            </Text>
            <Text className="mt-2 text-center" style={{ color: theme.colors.muted }}>
              Your calendar is clear for {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/modals/add-event')}
              className="mt-6 px-6 py-3 rounded-2xl"
              style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl }}
            >
              <Text className="font-medium text-center" style={{ color: theme.colors.primary }}>Add Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="py-4 space-y-3">
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                className={`p-4 rounded-xl border-2 ${getEventTypeColor(event.eventType)}`}
                onPress={() => {
                  // Navigate to event details
                  Alert.alert('Event Details', `Title: ${event.title}\nTime: ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`);
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-lg mr-2">
                        {getEventTypeIcon(event.eventType)}
                      </Text>
                      <Text className="text-lg font-semibold flex-1" style={{ color: theme.colors.foreground }}>
                        {event.title}
                      </Text>
                    </View>
                    
                    {event.description && (
                      <Text className="mb-2" numberOfLines={2} style={{ color: theme.colors.muted }}>
                        {event.description}
                      </Text>
                    )}
                    
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <ClockIcon size={16} color={theme.colors.muted} />
                        <Text className="ml-1" style={{ color: theme.colors.muted }}>
                          {event.isAllDay 
                            ? 'All day' 
                            : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                          }
                        </Text>
                      </View>
                      {event.location && (
                        <View className="flex-row items-center">
                          <MapPinIcon size={16} color={theme.colors.muted} />
                          <Text className="ml-1" numberOfLines={1} style={{ color: theme.colors.muted }}>
                            {event.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Event type indicator */}
                <View className="absolute top-2 right-2">
                  <View className="px-2 py-1 rounded-full" style={{ backgroundColor: theme.colors.card }}>
                    <Text className="text-xs font-medium capitalize" style={{ color: theme.colors.muted }}>
                      {event.eventType || 'event'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View className="px-6 py-2" style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card, paddingBottom: 6 }}>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => router.push('/modals/calendar-integrations')}
            className="flex-1 py-2.5 px-4 rounded-2xl flex-row items-center justify-center"
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
          >
            <CalendarIcon size={20} color={theme.colors.muted} />
            <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>Integrations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/modals/add-event')}
            className="flex-1 py-2.5 px-4 rounded-2xl flex-row items-center justify-center"
            style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl }}
          >
            <PlusIcon size={20} color={theme.colors.primary} />
            <Text className="font-medium ml-2" style={{ color: theme.colors.primary }}>Add Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}