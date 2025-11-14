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
import { useAppTheme } from '../../constants/dynamicTheme';

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
  const theme = useAppTheme();
  const { logExercise, isMutating } = useHealthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema) as any,
    defaultValues: {
      activity: '',
      durationMinutes: 30,
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
    <ScrollView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-6" style={{ color: theme.colors.foreground }}>
            Log Your Workout
          </Text>

          {/* Activity Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
              Activity *
            </Text>
            <Controller
              control={control}
              name="activity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`px-4 py-3 text-base`}
                  style={{
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: errors.activity ? '#ef4444' : theme.colors.border,
                    borderRadius: theme.radii.xl as any,
                  }}
                  placeholder="e.g., Running, Swimming, Yoga"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.activity && (
              <Text className="text-sm mt-1" style={{ color: '#ef4444' }}>
                {errors.activity.message}
              </Text>
            )}

            {/* Activity Suggestions */}
            <View className="flex-row flex-wrap gap-3 mt-3">
              {activitySuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.name}
                  className="rounded-full px-5 py-3 flex-row items-center"
                  style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={() => {
                    const currentValue = watch('activity');
                    if (currentValue !== suggestion.name) {
                      // Use setValue directly from form methods
                      reset({ ...watch(), activity: suggestion.name });
                    }
                  }}
                >
                  <Text className="mr-2">{suggestion.emoji}</Text>
                  <Text className="text-base font-medium" style={{ color: theme.colors.foreground }}>{suggestion.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration and Basic Info */}
          <View className="mb-6">
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
                  Duration (minutes) *
                </Text>
                <Controller
                  control={control}
                  name="durationMinutes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className={`px-4 py-3 text-base`}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: errors.durationMinutes ? '#ef4444' : theme.colors.border,
                        borderRadius: theme.radii.xl as any,
                      }}
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
                  <Text className="text-sm mt-1" style={{ color: '#ef4444' }}>
                    {errors.durationMinutes.message}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
                  Distance (km)
                </Text>
                <Controller
                  control={control}
                  name="distance"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="px-4 py-3 text-base"
                      style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any }}
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
                <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
                  Calories Burned
                </Text>
                <Controller
                  control={control}
                  name="caloriesBurned"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="px-4 py-3 text-base"
                      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any }}
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
                <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
                  Avg Heart Rate
                </Text>
                <Controller
                  control={control}
                  name="heartRateAvg"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="px-4 py-3 text-base"
                      style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any }}
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
            <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
              Intensity Level: {selectedIntensity}/10 ({intensityLevels[selectedIntensity - 1]?.label})
            </Text>
            <Controller
              control={control}
              name="intensity"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {[...Array(10)].map((_, index) => {
                    const level = index + 1;
                    const isActive = level <= value;
                    return (
                      <TouchableOpacity
                        key={level}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: isActive ? theme.colors.primaryLight : theme.colors.card,
                          borderWidth: 1,
                          borderColor: isActive ? theme.colors.primary : theme.colors.border,
                        }}
                        onPress={() => onChange(level)}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: isActive ? theme.colors.primary : theme.colors.muted }}
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
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
              Notes (Optional)
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="px-4 py-3 text-base"
                  style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any }}
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
                className="flex-1 rounded-2xl py-4"
                style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
                onPress={onCancel}
                disabled={isMutating}
              >
                <Text className="font-semibold text-center" style={{ color: theme.colors.foreground }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-1 rounded-2xl py-4"
              style={{ backgroundColor: theme.colors.primary, opacity: isMutating ? 0.7 : 1, borderRadius: theme.radii.xl }}
              onPress={handleSubmit(onSubmit as any)}
              disabled={isMutating}
            >
              {isMutating ? (
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