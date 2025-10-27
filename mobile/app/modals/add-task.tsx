import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  DocumentTextIcon
} from 'react-native-heroicons/outline';
import { apiClient } from '../../lib/api-client';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.number().min(1).max(4),
  dueDate: z.string().optional(),
  estimatedDuration: z.number().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function AddTaskModal() {
  const [selectedPriority, setSelectedPriority] = useState(2);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 2,
      estimatedDuration: 30,
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: TaskForm) => {
      return apiClient.createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        estimatedDuration: task.estimatedDuration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Alert.alert('Success', 'Task created successfully!');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    },
  });

  const onSubmit = (data: TaskForm) => {
    createTaskMutation.mutate(data);
  };

  const priorityOptions = [
    { value: 1, label: 'Low', color: 'bg-green-100 text-green-700 border-green-200', emoji: '🟢' },
    { value: 2, label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', emoji: '🟡' },
    { value: 3, label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200', emoji: '🟠' },
    { value: 4, label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200', emoji: '🔴' },
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const setDueDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setValue('dueDate', date.toISOString());
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <XMarkIcon size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">Add Task</Text>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={createTaskMutation.isPending}
          className={`px-4 py-2 rounded-xl ${
            createTaskMutation.isPending ? 'bg-blue-400' : 'bg-blue-600'
          }`}
        >
          <Text className="text-white font-semibold">
            {createTaskMutation.isPending ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Task Title */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Task Title</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`bg-white border rounded-2xl px-4 py-4 text-base ${
                  errors.title ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="What needs to be done?"
                placeholderTextColor="#9CA3AF"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
              />
            )}
          />
          {errors.title && (
            <Text className="text-red-500 text-sm mt-2">
              {errors.title.message}
            </Text>
          )}
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-white border border-gray-200 rounded-2xl px-4 py-4 text-base"
                placeholder="Add more details (optional)"
                placeholderTextColor="#9CA3AF"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        {/* Priority */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Priority</Text>
          <View className="flex-row flex-wrap -mx-1">
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className="w-1/2 px-1 mb-2"
                onPress={() => {
                  setSelectedPriority(option.value);
                  setValue('priority', option.value);
                }}
              >
                <View
                  className={`p-4 rounded-2xl border-2 ${
                    selectedPriority === option.value
                      ? option.color
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-2xl mr-2">{option.emoji}</Text>
                    <Text
                      className={`font-semibold ${
                        selectedPriority === option.value
                          ? option.color.split(' ')[1]
                          : 'text-gray-600'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Due Date</Text>
          <View className="flex-row flex-wrap -mx-1">
            <TouchableOpacity
              className="w-1/3 px-1 mb-2"
              onPress={() => setDueDate(0)}
            >
              <View className="bg-white border border-gray-200 rounded-2xl p-3">
                <Text className="text-center font-medium text-gray-900">Today</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-1/3 px-1 mb-2"
              onPress={() => setDueDate(1)}
            >
              <View className="bg-white border border-gray-200 rounded-2xl p-3">
                <Text className="text-center font-medium text-gray-900">Tomorrow</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-1/3 px-1 mb-2"
              onPress={() => setDueDate(7)}
            >
              <View className="bg-white border border-gray-200 rounded-2xl p-3">
                <Text className="text-center font-medium text-gray-900">Next Week</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {watch('dueDate') && (
            <View className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-3">
              <View className="flex-row items-center">
                <CalendarIcon size={20} color="#3B82F6" />
                <Text className="text-blue-700 font-medium ml-2">
                  Due: {formatDate(new Date(watch('dueDate')!))}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Estimated Duration */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Estimated Duration</Text>
          <View className="flex-row flex-wrap -mx-1">
            {durationOptions.map((duration) => (
              <TouchableOpacity
                key={duration}
                className="w-1/3 px-1 mb-2"
                onPress={() => setValue('estimatedDuration', duration)}
              >
                <View
                  className={`p-3 rounded-2xl border-2 ${
                    watch('estimatedDuration') === duration
                      ? 'bg-purple-100 border-purple-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      watch('estimatedDuration') === duration
                        ? 'text-purple-700'
                        : 'text-gray-900'
                    }`}
                  >
                    {duration}m
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {watch('estimatedDuration') && (
            <View className="mt-3 bg-purple-50 border border-purple-200 rounded-2xl p-3">
              <View className="flex-row items-center">
                <ClockIcon size={20} color="#8B5CF6" />
                <Text className="text-purple-700 font-medium ml-2">
                  Estimated: {watch('estimatedDuration')} minutes
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Templates */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Templates</Text>
          <View className="space-y-2">
            {[
              { title: 'Review emails', priority: 2, duration: 15 },
              { title: 'Team meeting preparation', priority: 3, duration: 30 },
              { title: 'Weekly report', priority: 3, duration: 60 },
              { title: 'Exercise session', priority: 2, duration: 45 },
            ].map((template, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-4"
                onPress={() => {
                  setValue('title', template.title);
                  setValue('priority', template.priority);
                  setValue('estimatedDuration', template.duration);
                  setSelectedPriority(template.priority);
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="font-medium text-gray-900">{template.title}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 text-sm mr-2">{template.duration}m</Text>
                    <Text className="text-lg">
                      {priorityOptions.find(p => p.value === template.priority)?.emoji}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}