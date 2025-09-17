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

const moodSchema = z.object({
  score: z.number().min(1).max(10).default(5),
  energy: z.number().min(1).max(10).default(5),
  stress: z.number().min(1).max(10).default(5),
  sleep: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type MoodFormData = z.infer<typeof moodSchema>;

interface MoodFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MoodForm: React.FC<MoodFormProps> = ({ onSuccess, onCancel }) => {
  const { logMood, isLoading } = useHealthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodSchema),
    defaultValues: {
      score: 5,
      energy: 5,
      stress: 5,
      notes: '',
      tags: [],
    },
  });

  const [score, energy, stress, tags] = watch(['score', 'energy', 'stress', 'tags']);

  const onSubmit = async (data: MoodFormData) => {
    try {
      await logMood(data);
      reset();
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to log mood. Please try again.');
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 9) return '😁';
    if (score >= 8) return '😊';
    if (score >= 7) return '🙂';
    if (score >= 6) return '😐';
    if (score >= 5) return '😐';
    if (score >= 4) return '😕';
    if (score >= 3) return '😟';
    if (score >= 2) return '😢';
    return '😭';
  };

  const getEnergyEmoji = (energy: number) => {
    if (energy >= 8) return '⚡';
    if (energy >= 6) return '💪';
    if (energy >= 4) return '😊';
    if (energy >= 2) return '😴';
    return '🔋';
  };

  const getStressEmoji = (stress: number) => {
    if (stress >= 8) return '😰';
    if (stress >= 6) return '😬';
    if (stress >= 4) return '😐';
    if (stress >= 2) return '😌';
    return '😇';
  };

  const moodTags = [
    '😊 Happy', '😢 Sad', '😠 Angry', '😰 Anxious',
    '😴 Tired', '💪 Motivated', '🤔 Thoughtful', '😌 Calm',
    '🎉 Excited', '😤 Frustrated', '💝 Grateful', '🤗 Social'
  ];

  const toggleTag = (tag: string) => {
    const currentTags = tags || [];
    const tagExists = currentTags.includes(tag);
    
    if (tagExists) {
      setValue('tags', currentTags.filter(t => t !== tag));
    } else {
      setValue('tags', [...currentTags, tag]);
    }
  };

  const ScaleSelector = ({ 
    label, 
    value, 
    onChange, 
    emoji, 
    lowLabel, 
    highLabel 
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    emoji: string;
    lowLabel: string;
    highLabel: string;
  }) => (
    <View className="mb-6">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {label}: {value}/10 {emoji}
      </Text>
      
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs text-gray-500">{lowLabel}</Text>
        <Text className="text-xs text-gray-500">{highLabel}</Text>
      </View>
      
      <View className="flex-row justify-between">
        {[...Array(10)].map((_, index) => {
          const level = index + 1;
          return (
            <TouchableOpacity
              key={level}
              className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                level <= value
                  ? 'bg-primary-100 border-primary-300'
                  : 'bg-gray-100 border-gray-300'
              }`}
              onPress={() => onChange(level)}
            >
              <Text
                className={`font-semibold text-xs ${
                  level <= value ? 'text-primary-700' : 'text-gray-500'
                }`}
              >
                {level}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            How are you feeling?
          </Text>

          {/* Mood Score */}
          <Controller
            control={control}
            name="score"
            render={({ field: { onChange, value } }) => (
              <ScaleSelector
                label="Overall Mood"
                value={value}
                onChange={onChange}
                emoji={getMoodEmoji(value)}
                lowLabel="Very Bad"
                highLabel="Amazing"
              />
            )}
          />

          {/* Energy Level */}
          <Controller
            control={control}
            name="energy"
            render={({ field: { onChange, value } }) => (
              <ScaleSelector
                label="Energy Level"
                value={value}
                onChange={onChange}
                emoji={getEnergyEmoji(value)}
                lowLabel="Exhausted"
                highLabel="Energized"
              />
            )}
          />

          {/* Stress Level */}
          <Controller
            control={control}
            name="stress"
            render={({ field: { onChange, value } }) => (
              <ScaleSelector
                label="Stress Level"
                value={value}
                onChange={onChange}
                emoji={getStressEmoji(value)}
                lowLabel="Very Calm"
                highLabel="Very Stressed"
              />
            )}
          />

          {/* Sleep Quality */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Sleep Quality (Optional)
            </Text>
            <Controller
              control={control}
              name="sleep"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-xl border ${
                      !value ? 'bg-gray-200 border-gray-300' : 'bg-gray-100 border-gray-300'
                    }`}
                    onPress={() => onChange(undefined)}
                  >
                    <Text className="text-gray-600 text-sm">Skip</Text>
                  </TouchableOpacity>
                  
                  {[...Array(10)].map((_, index) => {
                    const level = index + 1;
                    return (
                      <TouchableOpacity
                        key={level}
                        className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                          level <= (value || 0)
                            ? 'bg-purple-100 border-purple-300'
                            : 'bg-gray-100 border-gray-300'
                        }`}
                        onPress={() => onChange(level)}
                      >
                        <Text
                          className={`font-semibold text-xs ${
                            level <= (value || 0) ? 'text-purple-700' : 'text-gray-500'
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

          {/* Mood Tags */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              What describes your mood? (Select all that apply)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {moodTags.map((tag) => {
                const isSelected = (tags || []).includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    className={`px-3 py-2 rounded-full border ${
                      isSelected
                        ? 'bg-primary-100 border-primary-300'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? 'text-primary-700' : 'text-gray-600'
                      }`}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholder="What's on your mind? Any events affecting your mood?"
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
                  Log Mood
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default MoodForm;