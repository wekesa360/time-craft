import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/dynamicTheme';
import Button from '../../components/ui/Button';
import { apiClient } from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

export default function CreateChallengeModal() {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'habit' | 'goal' | 'fitness' | 'mindfulness'>('habit');
  const [durationDays, setDurationDays] = useState('7');
  const [isPublic, setIsPublic] = useState(true);

  const createMutation = useMutation({
    mutationFn: async () => {
      const now = Date.now();
      const start = now;
      const end = now + Math.max(1, Number(durationDays)) * 24 * 60 * 60 * 1000;
      return apiClient.createChallenge({
        title,
        description,
        challenge_type: type,
        start_date: start,
        end_date: end,
        is_public: isPublic,
        max_participants: 20,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-challenges'] });
      router.back();
      Alert.alert('Created', 'Challenge created successfully');
    },
    onError: (e: any) => Alert.alert('Error', e?.response?.data?.error || 'Failed to create challenge'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.foreground, fontSize: 22, fontWeight: '800' }}>Create Challenge</Text>

        <View>
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Challenge title"
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
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What is this challenge about?"
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

        <View>
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Type</Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {(['habit','goal','fitness','mindfulness'] as const).map((k) => (
              <Button
                key={k}
                title={k}
                variant={type === k ? 'primary' : 'outline'}
                onPress={() => setType(k)}
              />
            ))}
          </View>
        </View>

        <View>
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Duration (days)</Text>
          <TextInput
            value={durationDays}
            onChangeText={setDurationDays}
            keyboardType="numeric"
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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button title="Cancel" variant="outline" onPress={() => router.back()} />
          <Button title={createMutation.isPending ? 'Creating...' : 'Create'} onPress={() => createMutation.mutate()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
