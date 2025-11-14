import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useHealthStore } from '../../stores/health';

const sleepSchema = z.object({
  durationHours: z.number().min(0).max(24).default(7),
  durationMinutes: z.number().min(0).max(59).default(0),
  quality: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
});

type SleepFormData = z.infer<typeof sleepSchema>;

interface SleepFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SleepForm: React.FC<SleepFormProps> = ({ onSuccess, onCancel }) => {
  const theme = useAppTheme();
  const { logSleep, isMutating } = useHealthStore() as any;

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SleepFormData>({
    resolver: zodResolver(sleepSchema) as any,
    defaultValues: { durationHours: 7, durationMinutes: 0, quality: 3, notes: '' },
  });

  const quality = watch('quality');

  const onSubmit = async (data: SleepFormData) => {
    const totalMinutes = (data.durationHours || 0) * 60 + (data.durationMinutes || 0);
    try {
      if (typeof logSleep === 'function') {
        await logSleep({ durationMinutes: totalMinutes, quality: data.quality, notes: data.notes });
      }
      reset();
      onSuccess?.();
    } catch (e) {}
  };

  const qualityOptions = [
    { value: 1, emoji: '😫', title: 'Very Poor' },
    { value: 2, emoji: '😕', title: 'Poor' },
    { value: 3, emoji: '😐', title: 'Okay' },
    { value: 4, emoji: '🙂', title: 'Good' },
    { value: 5, emoji: '😄', title: 'Great' },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="p-6">
          <View className="mb-6">
            <Text className="text-2xl font-bold mb-6" style={{ color: theme.colors.foreground }}>Log Sleep</Text>
          </View>

          {/* Duration */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>Duration</Text>
            <View className="flex-row gap-4">
              <View style={{ flex: 1 }}>
                <Text className="text-xs mb-1" style={{ color: theme.colors.muted }}>Hours</Text>
                <Controller
                  control={control}
                  name="durationHours"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="px-4 py-3 text-base"
                      style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: errors.durationHours ? '#ef4444' : theme.colors.border, borderRadius: theme.radii.xl as any }}
                      placeholder="7"
                      keyboardType="numeric"
                      onChangeText={(t) => onChange(isNaN(parseInt(t)) ? 0 : parseInt(t))}
                      value={value?.toString() || ''}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-xs mb-1" style={{ color: theme.colors.muted }}>Minutes</Text>
                <Controller
                  control={control}
                  name="durationMinutes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="px-4 py-3 text-base"
                      style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: errors.durationMinutes ? '#ef4444' : theme.colors.border, borderRadius: theme.radii.xl as any }}
                      placeholder="0"
                      keyboardType="numeric"
                      onChangeText={(t) => onChange(isNaN(parseInt(t)) ? 0 : parseInt(t))}
                      value={value?.toString() || ''}
                    />
                  )}
                />
              </View>
            </View>
            <Text className="text-xs mt-2" style={{ color: theme.colors.muted }}>
              Tip: Hours 0–24 and minutes 0–59. We’ll compute total sleep time.
            </Text>
          </View>

          {/* Quality */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>Sleep Quality</Text>
            <View className="flex-row flex-wrap gap-3">
              {qualityOptions.map((opt) => {
                const active = quality === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    className="px-4 py-3 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: active ? theme.colors.primaryLight : theme.colors.card, borderWidth: 1, borderColor: active ? theme.colors.primary : theme.colors.border, borderRadius: theme.radii.xl }}
                    onPress={() => setValue('quality', opt.value)}
                  >
                    <Text style={{ fontSize: 20 }}>{opt.emoji}</Text>
                    <Text className="mt-1 text-xs" style={{ color: active ? theme.colors.primary : theme.colors.muted }}>{opt.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>Notes (Optional)</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="px-4 py-3 text-base"
                  style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl as any }}
                  placeholder="Any dreams? Woke up at night?"
                  multiline
                  numberOfLines={3}
                  onChangeText={onChange}
                  value={value || ''}
                />
              )}
            />
          </View>

        </View>
      </ScrollView>
      {/* Sticky Footer */}
      <View
        className="px-6 py-4"
        style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card }}
      >
        <View className="flex-row gap-3">
          {onCancel && (
            <TouchableOpacity
              className="flex-1 rounded-2xl py-4"
              style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
              onPress={onCancel}
              disabled={isMutating}
            >
              <Text className="font-semibold text-center" style={{ color: theme.colors.foreground }}>Cancel</Text>
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
              <Text className="text-white font-semibold text-center">Log Sleep</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SleepForm;
