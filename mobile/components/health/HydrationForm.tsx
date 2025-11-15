import React from 'react';
import {
  View,
  Text,
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

const hydrationSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  drinkType: z.enum(['water', 'coffee', 'tea', 'juice', 'sports_drink', 'other']),
  temperature: z.enum(['hot', 'warm', 'room_temp', 'cold', 'ice_cold']).optional(),
});

type HydrationFormData = z.infer<typeof hydrationSchema>;

interface HydrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const HydrationForm: React.FC<HydrationFormProps> = ({ onSuccess, onCancel }) => {
  const theme = useAppTheme();
  const { logHydration, isMutating } = useHealthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<HydrationFormData>({
    resolver: zodResolver(hydrationSchema),
    defaultValues: {
      amount: 250,
      drinkType: 'water',
      temperature: 'room_temp',
    },
  });

  const [selectedDrinkType, selectedAmount] = watch(['drinkType', 'amount']);

  const onSubmit = async (data: HydrationFormData) => {
    try {
      await logHydration(data);
      reset();
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to log hydration. Please try again.');
    }
  };

  const drinkTypes = [
    { value: 'water', label: 'Water', emoji: '💧', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { value: 'coffee', label: 'Coffee', emoji: '☕', color: 'bg-amber-100', textColor: 'text-amber-700' },
    { value: 'tea', label: 'Tea', emoji: '🍵', color: 'bg-green-100', textColor: 'text-green-700' },
    { value: 'juice', label: 'Juice', emoji: '🧃', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { value: 'sports_drink', label: 'Sports', emoji: '🥤', color: 'bg-purple-100', textColor: 'text-purple-700' },
    { value: 'other', label: 'Other', emoji: '🥛', color: 'bg-gray-100', textColor: 'text-gray-700' },
  ];

  const quickAmounts = [125, 250, 350, 500, 750, 1000]; // in ml

  const temperatures = [
    { value: 'ice_cold', label: 'Ice Cold', emoji: '🧊' },
    { value: 'cold', label: 'Cold', emoji: '❄️' },
    { value: 'room_temp', label: 'Room Temp', emoji: '🌡️' },
    { value: 'warm', label: 'Warm', emoji: '☀️' },
    { value: 'hot', label: 'Hot', emoji: '🔥' },
  ];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-6" style={{ color: theme.colors.foreground }}>
            Log Hydration
          </Text>

          {/* Drink Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
              What did you drink?
            </Text>
            <Controller
              control={control}
              name="drinkType"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {drinkTypes.map((drink) => (
                    <TouchableOpacity
                      key={drink.value}
                      className="px-4 py-3 rounded-xl flex-row items-center"
                      style={{
                        backgroundColor: value === drink.value ? theme.colors.primaryLight : theme.colors.surface,
                        borderWidth: 1,
                        borderColor: value === drink.value ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radii.xl,
                      }}
                      onPress={() => onChange(drink.value)}
                    >
                      <Text className="mr-2 text-lg">{drink.emoji}</Text>
                      <Text className="font-medium" style={{ color: value === drink.value ? theme.colors.primary : theme.colors.foreground }}>{drink.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Amount Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
              How much did you drink?
            </Text>
            
            {/* Quick Amount Buttons */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: selectedAmount === amount ? theme.colors.primaryLight : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: selectedAmount === amount ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radii.xl,
                  }}
                  onPress={() => setValue('amount', amount)}
                >
                  <Text className="font-medium" style={{ color: selectedAmount === amount ? theme.colors.primary : theme.colors.foreground }}>{amount}ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visual Amount Display */}
            <View className="rounded-xl p-4 items-center" style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl }}>
              <Text className="text-4xl mb-2">🥤</Text>
              <Text className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                {selectedAmount}ml
              </Text>
              <Text className="text-sm" style={{ color: theme.colors.primary }}>
                {selectedAmount >= 1000 
                  ? `${(selectedAmount / 1000).toFixed(1)} liters`
                  : `${Math.round(selectedAmount / 29.5735)} fl oz`
                }
              </Text>
            </View>
          </View>

          {/* Temperature (Optional for certain drinks) */}
          {(selectedDrinkType === 'coffee' || selectedDrinkType === 'tea' || selectedDrinkType === 'water') && (
            <View className="mb-6">
              <Text className="text-sm font-medium mb-3" style={{ color: theme.colors.muted }}>
                Temperature (Optional)
              </Text>
              <Controller
                control={control}
                name="temperature"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {temperatures.map((temp) => (
                      <TouchableOpacity
                        key={temp.value}
                        className="px-3 py-2 rounded-xl flex-row items-center"
                        style={{
                          backgroundColor: value === temp.value ? theme.colors.primaryLight : theme.colors.surface,
                          borderWidth: 1,
                          borderColor: value === temp.value ? theme.colors.primary : theme.colors.border,
                          borderRadius: theme.radii.xl,
                        }}
                        onPress={() => onChange(temp.value)}
                      >
                        <Text className="mr-1">{temp.emoji}</Text>
                        <Text className="font-medium text-sm" style={{ color: value === temp.value ? theme.colors.primary : theme.colors.foreground }}>{temp.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          )}


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
              onPress={handleSubmit(onSubmit)}
              disabled={isMutating}
            >
              {isMutating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  Log Hydration
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HydrationForm;