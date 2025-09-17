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
  const { logHydration, isLoading } = useHealthStore();

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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Log Hydration
          </Text>

          {/* Drink Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
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
                      className={`px-4 py-3 rounded-xl border flex-row items-center ${
                        value === drink.value
                          ? `${drink.color} border-current`
                          : 'bg-gray-100 border-gray-300'
                      }`}
                      onPress={() => onChange(drink.value)}
                    >
                      <Text className="mr-2 text-lg">{drink.emoji}</Text>
                      <Text
                        className={`font-medium ${
                          value === drink.value
                            ? drink.textColor
                            : 'text-gray-600'
                        }`}
                      >
                        {drink.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Amount Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              How much did you drink?
            </Text>
            
            {/* Quick Amount Buttons */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  className={`px-4 py-2 rounded-xl border ${
                    selectedAmount === amount
                      ? 'bg-primary-100 border-primary-300'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                  onPress={() => setValue('amount', amount)}
                >
                  <Text
                    className={`font-medium ${
                      selectedAmount === amount
                        ? 'text-primary-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {amount}ml
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visual Amount Display */}
            <View className="bg-gray-50 rounded-xl p-4 items-center">
              <Text className="text-4xl mb-2">🥤</Text>
              <Text className="text-2xl font-bold text-primary-600">
                {selectedAmount}ml
              </Text>
              <Text className="text-gray-600 text-sm">
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
              <Text className="text-sm font-medium text-gray-700 mb-3">
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
                        className={`px-3 py-2 rounded-xl border flex-row items-center ${
                          value === temp.value
                            ? 'bg-primary-100 border-primary-300'
                            : 'bg-gray-100 border-gray-300'
                        }`}
                        onPress={() => onChange(temp.value)}
                      >
                        <Text className="mr-1">{temp.emoji}</Text>
                        <Text
                          className={`font-medium text-sm ${
                            value === temp.value
                              ? 'text-primary-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {temp.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          )}

          {/* Daily Progress Indicator */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <Text className="font-semibold text-blue-900 mb-2">
              💧 Daily Hydration Goal
            </Text>
            <Text className="text-blue-800 text-sm mb-3">
              Recommended: 2000ml (8 glasses) per day
            </Text>
            
            {/* Progress bar would go here - simplified for now */}
            <View className="bg-blue-200 rounded-full h-3 overflow-hidden">
              <View 
                className="bg-blue-500 h-full rounded-full" 
                style={{ width: '45%' }} // This would be calculated based on daily total
              />
            </View>
            <Text className="text-blue-700 text-xs mt-2">
              900ml / 2000ml today (45%)
            </Text>
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