import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon
} from 'react-native-heroicons/outline';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiClient } from '../../lib/api';
import { useAppTheme } from '../../constants/dynamicTheme';
import { showToast } from '../../lib/toast';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.number().min(1).max(4),
  dueDate: z.string().optional(),
  estimatedDuration: z.number().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function AddTaskModal() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const [selectedPriority, setSelectedPriority] = useState(2);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [durationUnit, setDurationUnit] = useState<'m' | 'h'>('m');
  const queryClient = useQueryClient();
  const isEditing = !!params?.id;

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

  // Load task for edit mode
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isEditing || !params.id) return;
      try {
        const t = await apiClient.getTask(String(params.id));
        if (!mounted) return;
        // Prefill form values
        setValue('title', t.title || '');
        setValue('description', t.description || '');
        const pr = Number((t as any).priority ?? 2);
        setSelectedPriority(isNaN(pr) ? 2 : pr);
        setValue('priority', isNaN(pr) ? 2 : pr);
        const est = (t as any).estimated_duration ?? (t as any).estimatedDuration;
        if (est !== undefined && est !== null) setValue('estimatedDuration', Number(est));
        const dueRaw = (t as any).due_date ?? (t as any).dueDate;
        if (dueRaw) {
          const ts = typeof dueRaw === 'number' ? dueRaw : Date.parse(String(dueRaw));
          if (!Number.isNaN(ts)) setValue('dueDate', new Date(ts).toISOString());
        }
      } catch (e) {
        showToast.error('Failed to load task');
      }
    };
    load();
    return () => { mounted = false; };
  }, [isEditing, params?.id]);

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
      showToast.success('Task created successfully');
      router.back();
    },
    onError: () => {
      showToast.error('Failed to create task');
    },
  });

  // Update task mutation (edit mode)
  const updateTaskMutation = useMutation({
    mutationFn: async (task: TaskForm) => {
      return apiClient.updateTask(String(params.id), {
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
      showToast.success('Task updated successfully');
      router.back();
    },
    onError: () => {
      showToast.error('Failed to update task');
    },
  });

  const onSubmit = (data: TaskForm) => {
    if (isEditing) updateTaskMutation.mutate(data);
    else createTaskMutation.mutate(data);
  };

  const priorityOptions = [
    { value: 1, label: 'Low', bg: '#E6F4EA', fg: '#16A34A', border: '#C8E6D4' },
    { value: 2, label: 'Medium', bg: '#FEF3C7', fg: '#D97706', border: '#FDE68A' },
    { value: 3, label: 'High', bg: '#FFEDD5', fg: '#EA580C', border: '#FED7AA' },
    { value: 4, label: 'Urgent', bg: '#FEE2E2', fg: '#DC2626', border: '#FCA5A5' },
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View
        className="px-6 py-4 flex-row items-center justify-between"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-2xl"
          style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
        >
          <ArrowLeftIcon size={20} color={theme.colors.muted} />
        </TouchableOpacity>

        <Text className="text-lg font-semibold" style={{ color: theme.colors.foreground }}>{isEditing ? 'Edit Task' : 'Add Task'}</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Task Title */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.foreground }}>Task Title</Text>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border px-6 py-3 text-base`}
                style={{ backgroundColor: theme.colors.card, color: theme.colors.foreground, borderColor: errors.title ? '#ef4444' : theme.colors.border, borderRadius: theme.radii.xl as any }}
                placeholder="What needs to be done?"
                placeholderTextColor={theme.colors.mutedAlt}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
              />
            )}
          />
          {errors.title && (
            <Text className="text-sm mt-2" style={{ color: '#ef4444' }}>
              {errors.title.message}
            </Text>
          )}
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.foreground }}>Description</Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border px-6 py-3 text-base"
                style={{ backgroundColor: theme.colors.card, color: theme.colors.foreground, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any, minHeight: 120 }}
                placeholder="Add more details (optional)"
                placeholderTextColor={theme.colors.mutedAlt}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            )}
          />
        </View>

        {/* Priority */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.foreground }}>Priority</Text>
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
                <View className="rounded-2xl" style={{ borderRadius: theme.radii.xl }}>
                  <View className="rounded-2xl items-center justify-center px-6 py-3" style={{ backgroundColor: option.bg, borderWidth: 1, borderColor: option.border, borderRadius: theme.radii.xl }}>
                    <Text className="font-semibold" style={{ color: option.fg }}>{option.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.foreground }}>Due Date</Text>
          <View>
            <TouchableOpacity
              className="rounded-2xl"
              onPress={() => setShowDatePicker(true)}
            >
              <View className="border px-6 py-3 rounded-2xl" style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
                <View className="flex-row items-center justify-center">
                  <CalendarIcon size={20} color={theme.colors.muted} />
                  <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>
                    {watch('dueDate') ? `Change date (${formatDate(new Date(watch('dueDate')!))})` : 'Pick a date'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={watch('dueDate') ? new Date(watch('dueDate')!) : new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setValue('dueDate', date.toISOString());
                }}
              />
            )}
          </View>
          
          {watch('dueDate') && (
            <View className="mt-3 rounded-2xl p-3" style={{ backgroundColor: theme.colors.infoBg, borderColor: theme.colors.infoBg, borderWidth: 1 }}>
              <View className="flex-row items-center">
                <CalendarIcon size={20} color={theme.colors.info} />
                <Text className="font-medium ml-2" style={{ color: theme.colors.info }}>
                  Due: {formatDate(new Date(watch('dueDate')!))}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Estimated Duration */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.foreground }}>Estimated Duration</Text>
          <View className="flex-row flex-wrap -mx-1">
            {durationOptions.map((duration) => (
              <TouchableOpacity
                key={duration}
                className="w-1/3 px-1 mb-2"
                onPress={() => setValue('estimatedDuration', duration)}
              >
                <View
                  className={`p-3 rounded-2xl border-2`}
                  style={{ borderColor: watch('estimatedDuration') === duration ? theme.colors.primary : theme.colors.border, backgroundColor: watch('estimatedDuration') === duration ? theme.colors.primaryLight : theme.colors.surface, borderRadius: theme.radii.xl, padding: theme.spacing.lg }}
                >
                  <Text
                    className={`text-center font-medium`}
                    style={{ color: watch('estimatedDuration') === duration ? theme.colors.primary : theme.colors.foreground }}
                  >
                    {duration}m
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="w-1/3 px-1 mb-2"
              onPress={() => setShowCustomDuration((s) => !s)}
            >
              <View className={`p-3 rounded-2xl border-2`} style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl, padding: theme.spacing.lg }}>
                <Text className="text-center font-medium" style={{ color: theme.colors.foreground }}>
                  Custom
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {showCustomDuration && (
            <View className="mt-3 flex-row items-center">
              <TextInput
                className="border px-4 py-3 mr-3"
                style={{ backgroundColor: theme.colors.card, color: theme.colors.foreground, borderColor: theme.colors.border, borderRadius: theme.radii.xl, minWidth: 100 }}
                placeholder="Amount"
                placeholderTextColor={theme.colors.mutedAlt}
                keyboardType="numeric"
                value={customDuration}
                onChangeText={setCustomDuration}
              />
              <View className="flex-row">
                <TouchableOpacity onPress={() => setDurationUnit('m')} className="px-4 py-3 mr-2 rounded-2xl" style={{ backgroundColor: durationUnit === 'm' ? theme.colors.primaryLight : theme.colors.surface, borderWidth: 1, borderColor: durationUnit === 'm' ? theme.colors.primary : theme.colors.border, borderRadius: theme.radii.xl }}>
                  <Text style={{ color: durationUnit === 'm' ? theme.colors.primary : theme.colors.foreground }}>min</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDurationUnit('h')} className="px-4 py-3 rounded-2xl" style={{ backgroundColor: durationUnit === 'h' ? theme.colors.primaryLight : theme.colors.surface, borderWidth: 1, borderColor: durationUnit === 'h' ? theme.colors.primary : theme.colors.border, borderRadius: theme.radii.xl }}>
                  <Text style={{ color: durationUnit === 'h' ? theme.colors.primary : theme.colors.foreground }}>hr</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="ml-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radii.xl }}
                onPress={() => {
                  const amt = parseFloat(customDuration);
                  if (!isNaN(amt) && amt > 0) {
                    const minutes = durationUnit === 'h' ? Math.round(amt * 60) : Math.round(amt);
                    setValue('estimatedDuration', minutes);
                    setShowCustomDuration(false);
                    setCustomDuration('');
                  }
                }}
              >
                <Text className="text-white font-semibold">Set</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {watch('estimatedDuration') && (
            <View className="mt-3 rounded-2xl p-3" style={{ backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryLight, borderWidth: 1 }}>
              <View className="flex-row items-center">
                <ClockIcon size={20} color={theme.colors.primary} />
                <Text className="font-medium ml-2" style={{ color: theme.colors.primary }}>
                  Estimated: {watch('estimatedDuration')} minutes
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Submit Button */}
        <View className="mt-4">
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
            className="w-full items-center justify-center rounded-2xl px-6 py-4"
            style={{ backgroundColor: theme.colors.primary, opacity: (createTaskMutation.isPending || updateTaskMutation.isPending) ? 0.7 : 1, borderRadius: theme.radii.xl }}
          >
            <Text className="text-white font-semibold">
              {isEditing ? (updateTaskMutation.isPending ? 'Updating...' : 'Update Task') : (createTaskMutation.isPending ? 'Creating...' : 'Create Task')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}