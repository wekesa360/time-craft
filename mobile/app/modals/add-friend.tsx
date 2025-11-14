import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/dynamicTheme';
import Button from '../../components/ui/Button';
import { apiClient } from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

export default function AddFriendModal() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const sendRequest = useMutation({
    mutationFn: async () => {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email');
      }
      return apiClient.sendConnectionRequest({ email, message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      router.back();
      Alert.alert('Sent', 'Connection request sent');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.error || e?.message || 'Failed to send request'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.foreground, fontSize: 22, fontWeight: '800' }}>Add Friend</Text>

        <View>
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="friend@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.md,
              color: theme.colors.foreground,
            }}
          />
        </View>

        <View>
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Message (optional)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Say hello..."
            multiline
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.radii.xl,
              padding: theme.spacing.md,
              color: theme.colors.foreground,
              minHeight: 80,
            }}
          />
        </View>


        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button title="Cancel" variant="outline" onPress={() => router.back()} />
          <Button title={sendRequest.isPending ? 'Sending...' : 'Send Request'} onPress={() => sendRequest.mutate()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
