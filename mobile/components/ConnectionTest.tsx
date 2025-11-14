import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { showConnectionTest } from '../lib/toast';

export default function ConnectionTest() {
  return (
    <View className="p-4 bg-white rounded-lg shadow-sm mb-4" style={{ borderWidth: 1, borderColor: '#e8e8e8' }}>
      <Text className="text-sm font-medium mb-2" style={{ color: '#2d2d2d' }}>
        Backend Connection
      </Text>
      <Text className="text-xs mb-3" style={{ color: '#6b6b6b' }}>
        Test connection to configured backend base URL
      </Text>
      <TouchableOpacity
        onPress={showConnectionTest}
        className="py-2 px-4 bg-blue-500 rounded-lg"
      >
        <Text className="text-white text-center text-sm font-medium">
          Test Connection
        </Text>
      </TouchableOpacity>
    </View>
  );
}