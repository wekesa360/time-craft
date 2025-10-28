import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api';
import type { CalendarEvent } from '../../types';

export default function AddEventModal() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [isAllDay, setIsAllDay] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      setIsLoading(true);
      
      const eventData: Partial<CalendarEvent> = {
        title: title.trim(),
        description: description.trim() || undefined,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: isAllDay,
        source: 'manual',
        aiGenerated: false,
      };

      await apiClient.createEvent(eventData);
      
      Alert.alert('Success', 'Event created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // Auto-adjust end date to be 1 hour after start date
      if (selectedDate >= endDate) {
        setEndDate(new Date(selectedDate.getTime() + 60 * 60 * 1000));
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <XMarkIcon size={20} color="#374151" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-900">New Event</Text>
        
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading || !title.trim()}
          className={`px-4 py-2 rounded-xl ${
            isLoading || !title.trim()
              ? 'bg-gray-300'
              : 'bg-blue-500'
          }`}
        >
          <Text className={`font-medium ${
            isLoading || !title.trim()
              ? 'text-gray-500'
              : 'text-white'
          }`}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Title */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Event Title *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            className="p-4 border border-gray-300 rounded-xl text-gray-900 bg-white"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add event description (optional)"
            multiline
            numberOfLines={3}
            className="p-4 border border-gray-300 rounded-xl text-gray-900 bg-white"
            maxLength={500}
            textAlignVertical="top"
          />
        </View>

        {/* All Day Toggle */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl">
            <View className="flex-row items-center">
              <CalendarIcon size={20} color="#374151" />
              <Text className="text-lg font-medium text-gray-900 ml-3">
                All Day Event
              </Text>
            </View>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={isAllDay ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Start Date/Time */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Start {isAllDay ? 'Date' : 'Date & Time'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            className="p-4 border border-gray-300 rounded-xl bg-white flex-row items-center"
          >
            <ClockIcon size={20} color="#374151" />
            <Text className="text-gray-900 ml-3 flex-1">
              {isAllDay ? formatDate(startDate) : formatDateTime(startDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* End Date/Time */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            End {isAllDay ? 'Date' : 'Date & Time'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            className="p-4 border border-gray-300 rounded-xl bg-white flex-row items-center"
          >
            <ClockIcon size={20} color="#374151" />
            <Text className="text-gray-900 ml-3 flex-1">
              {isAllDay ? formatDate(endDate) : formatDateTime(endDate)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Event Info */}
        <View className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <View className="flex-row items-center mb-2">
            <DocumentTextIcon size={20} color="#3B82F6" />
            <Text className="text-blue-700 font-medium ml-2">Event Details</Text>
          </View>
          <Text className="text-blue-600 text-sm">
            This event will be saved to your local calendar. You can sync it with external calendars through the integrations settings.
          </Text>
        </View>

        {/* Date/Time Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode={isAllDay ? 'date' : 'datetime'}
            display="default"
            onChange={onStartDateChange}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode={isAllDay ? 'date' : 'datetime'}
            display="default"
            onChange={onEndDateChange}
            minimumDate={startDate}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}