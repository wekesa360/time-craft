import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme } from '../constants/dynamicTheme';
import { router } from 'expo-router';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/auth';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  bio: z.string().max(240, 'Max 240 characters').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const { user } = useAuthStore();
  // Initialize form with current user data
  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      firstName: user?.firstName || '', 
      lastName: user?.lastName || '', 
      email: user?.email || '', 
      bio: (user as any)?.bio || '' 
    },
  });
  
  // Track which fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  
  // Update modified fields when values change
  const handleChange = (field: keyof FormValues, value: string) => {
    setValue(field, value, { shouldValidate: true });
    setModifiedFields(prev => ({ ...prev, [field]: true }));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Only include modified fields in the update
      const updates: Partial<FormValues> = {};
      
      // Check each field to see if it was modified
      (Object.keys(values) as Array<keyof FormValues>).forEach(key => {
        if (modifiedFields[key] || isDirty) {
          updates[key] = values[key];
        }
      });
      
      // Only make the API call if there are actual changes
      if (Object.keys(updates).length > 0) {
        const updatedUser = await apiClient.updateProfile(updates);
        
        // Update the auth store with the updated user data
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user,
          ...updates
        });
        
        // Show success message and navigate back
        Alert.alert('Success', 'Profile updated successfully');
        router.replace('/(tabs)/profile');
      } else {
        Alert.alert('No changes', 'No changes were made to your profile');
        router.back();
      }
    } catch (e: any) {
      console.error('Update profile error:', e);
      Alert.alert('Error', e?.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ width: 72 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.foreground }}>Edit Profile</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 10, borderRadius: theme.radii.xl, borderWidth: 1, borderColor: theme.colors.border }}
            >
              <Text style={{ color: theme.colors.muted }}>‹</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingBottom: 120 }}>
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>First Name</Text>
          <TextInput
            value={watch('firstName')}
            onChangeText={(t) => handleChange('firstName', t)}
            placeholder={user?.firstName || 'First name'}
            placeholderTextColor={theme.colors.muted}
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.foreground }}
          />
          {errors.firstName && <Text style={{ color: theme.colors.danger, marginTop: 6 }}>{errors.firstName.message}</Text>}

          <View style={{ height: 16 }} />
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Last Name</Text>
          <TextInput
            value={watch('lastName')}
            onChangeText={(t) => handleChange('lastName', t)}
            placeholder={user?.lastName || 'Last name'}
            placeholderTextColor={theme.colors.muted}
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.foreground }}
          />
          {errors.lastName && <Text style={{ color: theme.colors.danger, marginTop: 6 }}>{errors.lastName.message}</Text>}

          <View style={{ height: 16 }} />
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Email</Text>
          <TextInput
            value={watch('email')}
            onChangeText={(t) => handleChange('email', t)}
            placeholder={user?.email || 'Email'}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.colors.muted}
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.foreground }}
          />
          {errors.email && <Text style={{ color: theme.colors.danger, marginTop: 6 }}>{errors.email.message}</Text>}

          <View style={{ height: 16 }} />
          <Text style={{ color: theme.colors.muted, marginBottom: 6 }}>Bio</Text>
          <TextInput
            value={watch('bio')}
            onChangeText={(t) => handleChange('bio', t)}
            placeholder={(user as any)?.bio || 'Tell us about yourself'}
            placeholderTextColor={theme.colors.muted}
            multiline
            numberOfLines={4}
            style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.foreground, minHeight: 96, textAlignVertical: 'top' }}
          />
          {errors.bio && <Text style={{ color: theme.colors.danger, marginTop: 6 }}>{errors.bio.message}</Text>}
        </ScrollView>

        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: theme.spacing.xl, backgroundColor: theme.colors.card, borderTopWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ flex: 1, paddingVertical: 14, borderRadius: theme.radii.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center' }}
            >
              <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{ flex: 1, paddingVertical: 14, borderRadius: theme.radii.xl, backgroundColor: theme.colors.primary, alignItems: 'center' }}
            >
              <Text style={{ color: theme.colors.primaryForeground, fontWeight: '700' }}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
