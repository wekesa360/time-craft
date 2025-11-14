import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useHealthStore } from '../../stores/health';

const weightSchema = z
  .object({
    weight: z
      .number()
      .positive('Weight must be positive'),
    unit: z.enum(['kg', 'lb']).default('kg'),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (typeof data.weight !== 'number') return;
    const max = data.unit === 'kg' ? 400 : 882; // sensible upper bounds
    if (data.weight > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        type: 'number',
        maximum: max,
        inclusive: true,
        path: ['weight'],
        message: `Weight seems too high (max ${max} ${data.unit})`,
      } as any);
    }
  });

type WeightFormData = z.infer<typeof weightSchema>;

interface WeightFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const WeightForm: React.FC<WeightFormProps> = ({ onSuccess, onCancel }) => {
  const theme = useAppTheme();
  const { logWeight, isMutating, preferredWeightUnit, setPreferredWeightUnit } = useHealthStore() as any;

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<WeightFormData>({
    resolver: zodResolver(weightSchema) as any,
    defaultValues: { weight: undefined as any, unit: preferredWeightUnit || 'kg', notes: '' },
  });

  const unit = watch('unit');

  const onSubmit = async (data: WeightFormData) => {
    try {
      if (typeof logWeight === 'function') {
        await logWeight(data);
      }
      reset();
      onSuccess?.();
    } catch (e) {}
  };

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="p-6">
          <View className="mb-6">
          <Text className="text-2xl font-bold mb-6" style={{ color: theme.colors.foreground }}>Log Weight</Text>

          {/* Weight */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.muted }}>Weight</Text>
            <View className="flex-row gap-4">
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="weight"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="px-4 py-3 text-base"
                      style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: errors.weight ? '#ef4444' : theme.colors.border, borderRadius: theme.radii.xl as any }}
                      placeholder={unit === 'kg' ? '70.0' : '154.3'}
                      keyboardType="decimal-pad"
                      onChangeText={(t) => {
                        const num = parseFloat(t);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      value={value?.toString() || ''}
                    />
                  )}
                />
                {errors.weight ? (
                  <Text className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.weight.message as any}</Text>
                ) : (
                  <Text className="text-xs mt-1" style={{ color: theme.colors.muted }}>
                    Typical human range up to {unit === 'kg' ? '400 kg' : '882 lb'}.
                  </Text>
                )}
              </View>
              <View style={{ width: 120 }}>
                <Text className="text-xs mb-1" style={{ color: theme.colors.muted }}>Unit</Text>
                <View className="flex-row gap-2">
                  {(['kg','lb'] as const).map((u) => {
                    const active = unit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        className="px-4 py-3 rounded-2xl items-center justify-center flex-1"
                        style={{ backgroundColor: active ? theme.colors.primaryLight : theme.colors.card, borderWidth: 1, borderColor: active ? theme.colors.primary : theme.colors.border, borderRadius: theme.radii.xl }}
                        onPress={() => {
                          setValue('unit', u);
                          if (typeof setPreferredWeightUnit === 'function') setPreferredWeightUnit(u);
                        }}
                      >
                        <Text className="font-medium" style={{ color: active ? theme.colors.primary : theme.colors.foreground }}>{u.toUpperCase()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text className="text-xs mt-2" style={{ color: theme.colors.muted }}>
                  Tip: Choose your preferred unit. This preference will be remembered.
                </Text>
              </View>
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
                  placeholder="Any context e.g., time of day, after meal, etc."
                  multiline
                  numberOfLines={3}
                  onChangeText={onChange}
                  value={value || ''}
                />
              )}
            />
          </View>

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
            onPress={handleSubmit(async (d) => onSubmit(d) as any)}
            disabled={isMutating}
          >
            {isMutating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-center">Log Weight</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WeightForm;
