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
import { useHealthStore } from '../../stores/health';

const exerciseSchema = z.object({
  activity: z.string().min(1, 'Activity is required'),
  durationMinutes: z.number().positive('Duration must be positive'),
  intensity: z.number().min(1).max(10).default(5),
  caloriesBurned: z.number().positive().optional(),
  distance: z.number().positive().optional(),
  heartRateAvg: z.number().positive().optional(),
  heartRateMax: z.number().positive().optional(),
  notes: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface ExerciseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ onSuccess, onCancel }) => {
  const { logExercise, isLoading } = useHealthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      activity: '',
      durationMinutes: undefined,
      intensity: 5,
      notes: '',
    },
  });

  const selectedIntensity = watch('intensity');

  const onSubmit = async (data: ExerciseFormData) => {
    try {
      await logExercise(data);
      reset();
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to log exercise. Please try again.');
    }
  };

  const activitySuggestions = [
    { name: 'Running', emoji: '🏃‍♂️' },
    { name: 'Walking', emoji: '🚶‍♂️' },
    { name: 'Cycling', emoji: '🚴‍♂️' },
    { name: 'Swimming', emoji: '🏊‍♂️' },
    { name: 'Weightlifting', emoji: '🏋️‍♂️' },
    { name: 'Yoga', emoji: '🧘‍♀️' },
    { name: 'Tennis', emoji: '🎾' },
    { name: 'Basketball', emoji: '🏀' },
  ];

  const intensityLevels = [
    { value: 1, label: 'Very Light', color: 'bg-green-100', textColor: 'text-green-700' },
    { value: 2, label: 'Light', color: 'bg-green-100', textColor: 'text-green-700' },
    { value: 3, label: 'Light', color: 'bg-green-100', textColor: 'text-green-700' },
    { value: 4, label: 'Moderate', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    { value: 5, label: 'Moderate', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    { value: 6, label: 'Moderate', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
    { value: 7, label: 'Vigorous', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { value: 8, label: 'Vigorous', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { value: 9, label: 'Very Hard', color: 'bg-red-100', textColor: 'text-red-700' },
    { value: 10, label: 'Max Effort', color: 'bg-red-100', textColor: 'text-red-700' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Log Your Workout
          </Text>

          {/* Activity Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Activity *
            </Text>
            <Controller
              control={control}
              name="activity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-base ${
                    errors.activity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Running, Swimming, Yoga"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.activity && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.activity.message}
              </Text>
            )}

            {/* Activity Suggestions */}
            <View className="flex-row flex-wrap gap-2 mt-3">
              {activitySuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.name}
                  className="bg-gray-100 rounded-full px-3 py-2 flex-row items-center"
                  onPress={() => {
                    const currentValue = watch('activity');
                    if (currentValue !== suggestion.name) {
                      // Use setValue directly from form methods
                      reset({ ...watch(), activity: suggestion.name });
                    }
                  }}
                >
                  <Text className="mr-1">{suggestion.emoji}</Text>
                  <Text className="text-sm text-gray-700">{suggestion.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration and Basic Info */}
          <View className="mb-6">
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </Text>
                <Controller
                  control={control}
                  name="durationMinutes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className={`border rounded-xl px-4 py-3 text-base ${
                        errors.durationMinutes ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="30"
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const num = parseInt(text);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      value={value ? value.toString() : ''}
                    />
                  )}
                />
                {errors.durationMinutes && (
                  <Text className="text-red-500 text-sm mt-1">
                    {errors.durationMinutes.message}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Distance (km)
                </Text>
                <Controller
                  control={control}
                  name="distance"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="5.0"
                      keyboardType="decimal-pad"
                      onChangeText={(text) => {
                        const num = parseFloat(text);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      value={value ? value.toString() : ''}
                    />
                  )}
                />
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Calories Burned
                </Text>
                <Controller
                  control={control}
                  name="caloriesBurned"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="300"
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const num = parseInt(text);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      value={value ? value.toString() : ''}
                    />
                  )}
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Avg Heart Rate
                </Text>
                <Controller
                  control={control}
                  name="heartRateAvg"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                      placeholder="150"
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const num = parseInt(text);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      value={value ? value.toString() : ''}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* Intensity Scale */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Intensity Level: {selectedIntensity}/10 ({intensityLevels[selectedIntensity - 1]?.label})
            </Text>
            <Controller
              control={control}
              name="intensity"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {[...Array(10)].map((_, index) => {
                    const level = index + 1;
                    const config = intensityLevels[index];
                    return (
                      <TouchableOpacity
                        key={level}
                        className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                          level <= value
                            ? `${config.color} border-gray-400`
                            : 'bg-gray-100 border-gray-300'
                        }`}
                        onPress={() => onChange(level)}
                      >
                        <Text
                          className={`font-semibold text-sm ${
                            level <= value ? config.textColor : 'text-gray-500'
                          }`}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Notes Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholder="How did it feel? Any achievements?"
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
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
                disabled={isLoading}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`flex-1 rounded-xl py-4 ${
                isLoading ? 'bg-primary-400' : 'bg-primary-600'
              }`}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  Log Workout
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default ExerciseForm;