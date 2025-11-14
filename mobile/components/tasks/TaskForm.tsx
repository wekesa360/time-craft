import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaskStore } from '../../stores/tasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.number().min(1).max(4).default(2),
  contextType: z.enum(['work', 'personal', 'health', 'learning', 'social']).optional(),
  estimatedDuration: z.number().positive().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSuccess, onCancel }) => {
  const { createTask, isMutating } = useTaskStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 2,
      contextType: undefined,
      estimatedDuration: undefined,
    },
  });

  const selectedPriority = watch('priority');

  const onSubmit = async (data: TaskFormData) => {
    try {
      await createTask(data);
      reset();
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const priorityOptions = [
    { value: 1, label: 'Low', color: 'bg-green-100 border-green-300', textColor: 'text-green-700' },
    { value: 2, label: 'Medium', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-700' },
    { value: 3, label: 'High', color: 'bg-orange-100 border-orange-300', textColor: 'text-orange-700' },
    { value: 4, label: 'Urgent', color: 'bg-red-100 border-red-300', textColor: 'text-red-700' },
  ];

  const contextOptions = [
    { value: 'work', label: '💼 Work', emoji: '💼' },
    { value: 'personal', label: '👤 Personal', emoji: '👤' },
    { value: 'health', label: '💚 Health', emoji: '💚' },
    { value: 'learning', label: '📚 Learning', emoji: '📚' },
    { value: 'social', label: '👥 Social', emoji: '👥' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Create New Task
          </Text>

          {/* Title Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-base ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="What needs to be done?"
                  multiline
                  numberOfLines={2}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </Text>
            )}
          </View>

          {/* Description Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholder="Add more details (optional)"
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>

          {/* Priority Selection */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Priority Level
            </Text>
            <Controller
              control={control}
              name="priority"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {priorityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-2 rounded-xl border ${
                        value === option.value
                          ? option.color
                          : 'bg-gray-100 border-gray-300'
                      }`}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        className={`font-medium ${
                          value === option.value
                            ? option.textColor
                            : 'text-gray-600'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Context Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Category
            </Text>
            <Controller
              control={control}
              name="contextType"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {contextOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-2 rounded-xl border flex-row items-center ${
                        value === option.value
                          ? 'bg-primary-100 border-primary-300'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                      onPress={() => 
                        onChange(value === option.value ? undefined : option.value)
                      }
                    >
                      <Text className="mr-2">{option.emoji}</Text>
                      <Text
                        className={`font-medium ${
                          value === option.value
                            ? 'text-primary-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {option.label.split(' ')[1]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Estimated Duration */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (minutes)
            </Text>
            <Controller
              control={control}
              name="estimatedDuration"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholder="e.g., 30"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    const num = parseInt(text);
                    onChange(isNaN(num) ? undefined : num);
                  }}
                  value={value ? value.toString() : ''}
                />
              )}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            {onCancel && (
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-xl py-4"
                onPress={onCancel}
                disabled={isMutating}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-1 rounded-xl py-4 ${
                isMutating ? 'bg-primary-400' : 'bg-primary-600'
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={isMutating}
            >
              {isMutating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  Create Task
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default TaskForm;