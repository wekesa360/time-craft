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
  const theme = useAppTheme();
  const { logMood, isMutating } = useHealthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<MoodFormData>({
    resolver: zodResolver(moodSchema) as any,
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

  const EmojiSelector = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    options: { value: number; emoji: string; title?: string }[];
  }) => (
    <View className="mb-6">
      <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              className="px-4 py-3 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: active ? theme.colors.primaryLight : theme.colors.card,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radii.xl,
              }}
              onPress={() => onChange(opt.value)}
            >
              <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
              {opt.title ? (
                <Text className="mt-1 text-xs" style={{ color: active ? theme.colors.primary : theme.colors.muted }}>
                  {opt.title}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-6" style={{ color: theme.colors.foreground }}>
            How are you feeling?
          </Text>

          {/* Mood Score */}
          <Controller
            control={control}
            name="score"
            render={({ field: { onChange, value } }) => (
              <EmojiSelector
                label="Overall Mood"
                value={value}
                onChange={onChange}
                options={[
                  { value: 1, emoji: '😭', title: 'Terrible' },
                  { value: 3, emoji: '😢', title: 'Bad' },
                  { value: 5, emoji: '😐', title: 'Okay' },
                  { value: 7, emoji: '🙂', title: 'Good' },
                  { value: 9, emoji: '😁', title: 'Great' },
                ]}
              />
            )}
          />

          {/* Energy Level */}
          <Controller
            control={control}
            name="energy"
            render={({ field: { onChange, value } }) => (
              <EmojiSelector
                label="Energy Level"
                value={value}
                onChange={onChange}
                options={[
                  { value: 2, emoji: '😴', title: 'Low' },
                  { value: 4, emoji: '😊', title: 'Okay' },
                  { value: 6, emoji: '💪', title: 'Good' },
                  { value: 8, emoji: '⚡', title: 'High' },
                ]}
              />
            )}
          />

          {/* Stress Level */}
          <Controller
            control={control}
            name="stress"
            render={({ field: { onChange, value } }) => (
              <EmojiSelector
                label="Stress Level"
                value={value}
                onChange={onChange}
                options={[
                  { value: 2, emoji: '😇', title: 'Calm' },
                  { value: 4, emoji: '😌', title: 'Easy' },
                  { value: 6, emoji: '😐', title: 'Neutral' },
                  { value: 8, emoji: '😬', title: 'High' },
                  { value: 10, emoji: '😰', title: 'Severe' },
                ]}
              />
            )}
          />

          {/* Sleep Quality */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
              Sleep Quality (Optional)
            </Text>
            <Controller
              control={control}
              name="sleep"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="px-4 py-2 rounded-xl"
                    style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
                    onPress={() => onChange(undefined)}
                  >
                    <Text className="text-sm" style={{ color: theme.colors.muted }}>Skip</Text>
                  </TouchableOpacity>
                  
                  {[...Array(10)].map((_, index) => {
                    const level = index + 1;
                    return (
                      <TouchableOpacity
                        key={level}
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: level <= (value || 0) ? theme.colors.primaryLight : theme.colors.card,
                          borderWidth: 1,
                          borderColor: level <= (value || 0) ? theme.colors.primary : theme.colors.border,
                        }}
                        onPress={() => onChange(level)}
                      >
                        <Text className="font-semibold text-xs" style={{ color: level <= (value || 0) ? theme.colors.primary : theme.colors.muted }}>
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
            <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
              What describes your mood? (Select all that apply)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {moodTags.map((tag) => {
                const isSelected = (tags || []).includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    className="px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radii.xl,
                    }}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text className="text-sm" style={{ color: isSelected ? theme.colors.primary : theme.colors.foreground }}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>
              Additional Notes (Optional)
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="px-4 py-3 text-base"
                  style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any }}
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
                className="flex-1 rounded-2xl py-4"
                style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
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