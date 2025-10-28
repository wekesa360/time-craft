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
import type { CalendarEvent } from '../types';

export default function CalendarScreen() {
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
      
      setEvents(response.data || []);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
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

  const getEventTypeColor = (source: string) => {
    switch (source) {
      case 'google':
        return 'bg-blue-100 border-blue-300';
      case 'outlook':
        return 'bg-orange-100 border-orange-300';
      case 'manual':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getEventTypeIcon = (source: string) => {
    switch (source) {
      case 'google':
        return '📅';
      case 'outlook':
        return '📧';
      case 'manual':
        return '✏️';
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <ArrowLeftIcon size={20} color="#374151" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-900">Calendar</Text>
        
        <TouchableOpacity
          onPress={() => router.push('/modals/add-event')}
          className="p-2 rounded-full bg-blue-500"
        >
          <PlusIcon size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View className="px-6 py-4 bg-gray-50">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={navigateToPreviousDay}
            className="p-2 rounded-lg bg-white border border-gray-200"
          >
            <Text className="text-gray-600">←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={navigateToToday}
            className="px-4 py-2 rounded-lg bg-blue-500"
          >
            <Text className="text-white font-medium">Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={navigateToNextDay}
            className="p-2 rounded-lg bg-white border border-gray-200"
          >
            <Text className="text-gray-600">→</Text>
          </TouchableOpacity>
        </View>
        
        <Text className="text-lg font-semibold text-gray-900 text-center">
          {formatDate(selectedDate)}
        </Text>
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
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-2">Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <CalendarIcon size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No events today
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              Your calendar is clear for {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/modals/add-event')}
              className="mt-6 px-6 py-3 bg-blue-500 rounded-xl"
            >
              <Text className="text-white font-medium">Add Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="py-4 space-y-3">
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                className={`p-4 rounded-xl border-2 ${getEventTypeColor(event.source)}`}
                onPress={() => {
                  // Navigate to event details
                  Alert.alert('Event Details', `Title: ${event.title}\nTime: ${formatTime(event.start)} - ${formatTime(event.end)}`);
                }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-lg mr-2">
                        {getEventTypeIcon(event.source)}
                      </Text>
                      <Text className="text-lg font-semibold text-gray-900 flex-1">
                        {event.title}
                      </Text>
                    </View>
                    
                    {event.description && (
                      <Text className="text-gray-600 mb-2" numberOfLines={2}>
                        {event.description}
                      </Text>
                    )}
                    
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <ClockIcon size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-1">
                          {event.allDay 
                            ? 'All day' 
                            : `${formatTime(event.start)} - ${formatTime(event.end)}`
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Event source indicator */}
                <View className="absolute top-2 right-2">
                  <View className="px-2 py-1 rounded-full bg-white/80">
                    <Text className="text-xs font-medium text-gray-600 capitalize">
                      {event.source}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View className="px-6 py-4 border-t border-gray-200 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => router.push('/modals/calendar-integrations')}
            className="flex-1 py-3 px-4 bg-gray-100 rounded-xl flex-row items-center justify-center"
          >
            <CalendarIcon size={20} color="#374151" />
            <Text className="text-gray-700 font-medium ml-2">Integrations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/modals/add-event')}
            className="flex-1 py-3 px-4 bg-blue-500 rounded-xl flex-row items-center justify-center"
          >
            <PlusIcon size={20} color="white" />
            <Text className="text-white font-medium ml-2">Add Event</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}