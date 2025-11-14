import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppTheme } from '../../constants/dynamicTheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api';
import { showToast } from '../../lib/toast';

export default function AddEventModal() {
  const theme = useAppTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [isAllDay, setIsAllDay] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      showToast.error('Please enter an event title', 'Error');
      return;
    }
    if (endDate <= startDate) {
      showToast.error('End time must be after start time', 'Error');
      return;
    }
    try {
      setIsLoading(true);
      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
        isAllDay,
        eventType: 'appointment',
      } as any;
      await apiClient.createEvent(eventData);
      showToast.success('Event created successfully', 'Success');
      router.back();
    } catch (error) {
      showToast.error('Failed to create event. Please try again.', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) =>
    date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const onStartDateChange = (_: any, selected?: Date) => {
    setShowStartDatePicker(false);
    if (selected) {
      const merged = new Date(startDate);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartDate(merged);
      if (merged >= endDate) setEndDate(new Date(merged.getTime() + 60 * 60 * 1000));
    }
  };
  const onStartTimeChange = (_: any, selected?: Date) => {
    setShowStartTimePicker(false);
    if (selected) {
      const merged = new Date(startDate);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartDate(merged);
      if (merged >= endDate) setEndDate(new Date(merged.getTime() + 60 * 60 * 1000));
    }
  };
  const onEndDateChange = (_: any, selected?: Date) => {
    setShowEndDatePicker(false);
    if (selected) {
      const merged = new Date(endDate);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEndDate(merged);
    }
  };
  const onEndTimeChange = (_: any, selected?: Date) => {
    setShowEndTimePicker(false);
    if (selected) {
      const merged = new Date(endDate);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEndDate(merged);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <View className="flex-row items-center justify-between px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <Text className="text-xl font-bold" style={{ color: theme.colors.foreground }}>New Event</Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-2xl" style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
          <ArrowLeftIcon size={20} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-6 py-6">
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>Event Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Enter event title" className="px-6 py-3 border" style={{ borderColor: theme.colors.border, borderRadius: theme.radii.xl, color: theme.colors.foreground, backgroundColor: theme.colors.card }} maxLength={100} />
        </View>
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Add event description (optional)" multiline numberOfLines={5} className="px-6 py-3 border" style={{ borderColor: theme.colors.border, borderRadius: theme.radii.xl, color: theme.colors.foreground, minHeight: 120, textAlignVertical: 'top' as any, backgroundColor: theme.colors.card }} maxLength={500} />
        </View>
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-4 py-3 rounded-2xl" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
            <View className="flex-row items-center">
              <CalendarIcon size={20} color={theme.colors.muted} />
              <Text className="text-lg font-medium ml-3" style={{ color: theme.colors.foreground }}>All Day Event</Text>
            </View>
            <Switch value={isAllDay} onValueChange={setIsAllDay} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} thumbColor={'#FFFFFF'} />
          </View>
        </View>
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>Start {isAllDay ? 'Date' : 'Date & Time'}</Text>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} className="px-6 py-3 border rounded-2xl flex-row items-center" style={{ borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card }}>
            <ClockIcon size={20} color={theme.colors.muted} />
            <Text className="ml-3 flex-1" style={{ color: theme.colors.foreground }}>{isAllDay ? formatDate(startDate) : formatDateTime(startDate)}</Text>
          </TouchableOpacity>
          {!isAllDay && (
            <TouchableOpacity onPress={() => setShowStartTimePicker(true)} className="mt-2 px-6 py-3 border rounded-2xl flex-row items-center" style={{ borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card }}>
              <ClockIcon size={20} color={theme.colors.muted} />
              <Text className="ml-3 flex-1" style={{ color: theme.colors.foreground }}>{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.foreground }}>End {isAllDay ? 'Date' : 'Date & Time'}</Text>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} className="px-6 py-3 border rounded-2xl flex-row items-center" style={{ borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card }}>
            <ClockIcon size={20} color={theme.colors.muted} />
            <Text className="ml-3 flex-1" style={{ color: theme.colors.foreground }}>{isAllDay ? formatDate(endDate) : formatDateTime(endDate)}</Text>
          </TouchableOpacity>
          {!isAllDay && (
            <TouchableOpacity onPress={() => setShowEndTimePicker(true)} className="mt-2 px-6 py-3 border rounded-2xl flex-row items-center" style={{ borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card }}>
              <ClockIcon size={20} color={theme.colors.muted} />
              <Text className="ml-3 flex-1" style={{ color: theme.colors.foreground }}>{endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="mb-6 p-4 rounded-2xl" style={{ backgroundColor: theme.colors.infoBg, borderWidth: 1, borderColor: theme.colors.infoBg }}>
          <View className="flex-row items-center mb-2">
            <DocumentTextIcon size={20} color={theme.colors.info} />
            <Text className="font-medium ml-2" style={{ color: theme.colors.info }}>Event Details</Text>
          </View>
          <Text className="text-sm" style={{ color: theme.colors.info }}>This event will be saved to your local calendar. You can sync it with external calendars through the integrations settings.</Text>
        </View>
        {showStartDatePicker && (
          <DateTimePicker value={startDate} mode={'date'} display="default" onChange={onStartDateChange} />
        )}
        {showStartTimePicker && !isAllDay && (
          <DateTimePicker value={startDate} mode={'time'} display="default" onChange={onStartTimeChange} />
        )}
        {showEndDatePicker && (
          <DateTimePicker value={endDate} mode={'date'} display="default" onChange={onEndDateChange} minimumDate={startDate} />
        )}
        {showEndTimePicker && !isAllDay && (
          <DateTimePicker value={endDate} mode={'time'} display="default" onChange={onEndTimeChange} />
        )}
        <View className="mt-2">
          <TouchableOpacity onPress={handleSave} disabled={isLoading || !title.trim()} className="w-full items-center justify-center rounded-2xl px-6 py-4" style={{ backgroundColor: theme.colors.primary, opacity: isLoading || !title.trim() ? 0.7 : 1, borderRadius: theme.radii.xl }}>
            <Text className="text-white font-semibold">{isLoading ? 'Saving...' : 'Save Event'}</Text>
          </TouchableOpacity>
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}