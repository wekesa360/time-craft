import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFocusStore } from '../../stores/focus';

const completionSchema = z.object({
  wasProductive: z.boolean().default(true),
  notes: z.string().optional(),
});

type CompletionFormData = z.infer<typeof completionSchema>;

interface SessionCompleteProps {
  sessionDuration: number; // in minutes
  onComplete: () => void;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({
  sessionDuration,
  onComplete,
}) => {
  const { completeFocusSession, isMutating } = useFocusStore();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
    defaultValues: {
      wasProductive: true,
      notes: '',
    },
  });

  const wasProductive = watch('wasProductive');

  const onSubmit = async (data: CompletionFormData) => {
    try {
      await completeFocusSession({
        actualDuration: sessionDuration,
        wasProductive: data.wasProductive,
        notes: data.notes,
      });
      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete session. Please try again.');
    }
  };

  const productivityOptions = [
    {
      value: true,
      label: 'Productive',
      emoji: '🎯',
      description: 'I stayed focused and accomplished my goals',
      color: 'bg-green-100 border-green-300',
      textColor: 'text-green-700',
    },
    {
      value: false,
      label: 'Distracted',
      emoji: '😅',
      description: 'I had some distractions but that\'s okay',
      color: 'bg-yellow-100 border-yellow-300',
      textColor: 'text-yellow-700',
    },
  ];

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <View className="items-center mb-6">
        <Text className="text-4xl mb-2">🎉</Text>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Session Complete!
        </Text>
        <Text className="text-gray-600 text-center">
          Great job on completing your {sessionDuration}-minute focus session
        </Text>
      </View>

      {/* Productivity Rating */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          How was your focus?
        </Text>
        
        <Controller
          control={control}
          name="wasProductive"
          render={({ field: { onChange, value } }) => (
            <View className="space-y-3">
              {productivityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value.toString()}
                  className={`p-4 rounded-xl border-2 ${
                    value === option.value
                      ? option.color
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={() => onChange(option.value)}
                >
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{option.emoji}</Text>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold text-lg ${
                          value === option.value
                            ? option.textColor
                            : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </Text>
                      <Text
                        className={`text-sm mt-1 ${
                          value === option.value
                            ? option.textColor.replace('700', '600')
                            : 'text-gray-500'
                        }`}
                      >
                        {option.description}
                      </Text>
                    </View>
                    {value === option.value && (
                      <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                        <Text className="text-white font-bold text-sm">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </View>

      {/* Notes */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Session Notes (Optional)
        </Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-base"
              placeholder={
                wasProductive
                  ? "What did you accomplish? Any insights?"
                  : "What caused the distractions? How can you improve next time?"
              }
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>

      {/* Quick Stats */}
      <View className="bg-gray-50 rounded-xl p-4 mb-6">
        <Text className="font-semibold text-gray-900 mb-2">Session Summary</Text>
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-600 text-sm">Duration</Text>
            <Text className="font-semibold text-gray-900">{sessionDuration} min</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-sm">Focus Quality</Text>
            <Text className="font-semibold text-gray-900">
              {wasProductive ? 'Productive' : 'Distracted'}
            </Text>
          </View>
          <View>
            <Text className="text-gray-600 text-sm">Points Earned</Text>
            <Text className="font-semibold text-primary-600">
              +{wasProductive ? sessionDuration : Math.floor(sessionDuration / 2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        className={`rounded-xl py-4 px-6 ${
          isMutating ? 'bg-primary-400' : 'bg-primary-600'
        }`}
        onPress={handleSubmit(onSubmit)}
        disabled={isMutating}
      >
        {isMutating ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-white font-semibold text-center text-lg">
            Complete Session
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default SessionComplete;