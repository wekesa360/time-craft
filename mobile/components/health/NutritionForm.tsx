import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useHealthStore } from '../../stores/health';

const nutritionSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  description: z.string().min(1, 'Description is required'),
  calories: z.number().positive().optional(),
  protein: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  fat: z.number().positive().optional(),
  fiber: z.number().positive().optional(),
  sugar: z.number().positive().optional(),
});

type NutritionFormData = z.infer<typeof nutritionSchema>;

interface NutritionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NutritionForm: React.FC<NutritionFormProps> = ({ onSuccess, onCancel }) => {
  const { logNutrition, isLoading } = useHealthStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<NutritionFormData>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: {
      mealType: 'lunch',
      description: '',
    },
  });

  const selectedMealType = watch('mealType');

  const onSubmit = async (data: NutritionFormData) => {
    try {
      await logNutrition(data);
      reset();
      setSelectedImage(null);
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Camera permission is required to take photos of your meals.'
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Photo library permission is required to select meal photos.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Photo',
      'Would you like to take a photo or choose from gallery?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
      ]
    );
  };

  const mealTypeOptions = [
    { value: 'breakfast', label: 'Breakfast', emoji: '🍳' },
    { value: 'lunch', label: 'Lunch', emoji: '🥗' },
    { value: 'dinner', label: 'Dinner', emoji: '🍽️' },
    { value: 'snack', label: 'Snack', emoji: '🍎' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            Log Your Meal
          </Text>

          {/* Meal Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Meal Type
            </Text>
            <Controller
              control={control}
              name="mealType"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {mealTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`px-4 py-3 rounded-xl border flex-row items-center ${
                        value === option.value
                          ? 'bg-primary-100 border-primary-300'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                      onPress={() => onChange(option.value)}
                    >
                      <Text className="mr-2 text-lg">{option.emoji}</Text>
                      <Text
                        className={`font-medium ${
                          value === option.value
                            ? 'text-primary-700'
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

          {/* Photo Section */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Meal Photo (Optional)
            </Text>
            
            {selectedImage ? (
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 items-center justify-center"
                  onPress={() => setSelectedImage(null)}
                >
                  <Text className="text-white font-bold">×</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="absolute bottom-2 right-2 bg-blue-500 rounded-full px-3 py-1"
                  onPress={showImageOptions}
                >
                  <Text className="text-white text-xs font-medium">Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 items-center"
                onPress={showImageOptions}
              >
                <Text className="text-4xl mb-2">📷</Text>
                <Text className="text-gray-600 font-medium">Add Photo</Text>
                <Text className="text-gray-500 text-sm">Tap to take or select</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              What did you eat? *
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-base ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Grilled chicken salad with mixed vegetables"
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.description && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </Text>
            )}
          </View>

          {/* Nutrition Facts (Optional) */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Nutrition Facts (Optional)
            </Text>
            
            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-xs text-gray-600 mb-1">Calories</Text>
                <Controller
                  control={control}
                  name="calories"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
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

              <View>
                <Text className="text-xs text-gray-600 mb-1">Protein (g)</Text>
                <Controller
                  control={control}
                  name="protein"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
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

              <View>
                <Text className="text-xs text-gray-600 mb-1">Carbs (g)</Text>
                <Controller
                  control={control}
                  name="carbs"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
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

              <View>
                <Text className="text-xs text-gray-600 mb-1">Fat (g)</Text>
                <Controller
                  control={control}
                  name="fat"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="0"
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
                  Log Meal
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default NutritionForm;