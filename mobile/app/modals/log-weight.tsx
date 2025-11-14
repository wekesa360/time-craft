import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeftIcon } from 'react-native-heroicons/outline';
import { useAppTheme } from '../../constants/dynamicTheme';
import WeightForm from '../../components/health/WeightForm';

export default function LogWeightModal() {
  const theme = useAppTheme();
  const handleSuccess = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View
        className="px-6 py-4 flex-row items-center justify-between"
        style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
      >
        <TouchableOpacity
          onPress={handleCancel}
          className="p-2 rounded-2xl"
          style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
        >
          <ArrowLeftIcon size={20} color={theme.colors.muted} />
        </TouchableOpacity>

        <Text className="text-lg font-semibold" style={{ color: theme.colors.foreground }}>
          Log Weight
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Weight Form */}
      <WeightForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  );
}
