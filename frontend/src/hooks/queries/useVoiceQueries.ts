// React Query hooks for voice processing
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import type { VoiceNote, VoiceCommand, VoiceSettings, VoiceAnalytics } from '../../types';
import { toast } from 'react-hot-toast';

// Query keys
export const voiceKeys = {
  all: ['voice'] as const,
  notes: () => [...voiceKeys.all, 'notes'] as const,
  notesList: (filters: Record<string, any>) => [...voiceKeys.notes(), { filters }] as const,
  note: (id: string) => [...voiceKeys.notes(), id] as const,
  settings: () => [...voiceKeys.all, 'settings'] as const,
  analytics: () => [...voiceKeys.all, 'analytics'] as const,
  accuracyAnalytics: () => [...voiceKeys.all, 'accuracy-analytics'] as const,
};

// Voice notes query
export const useVoiceNotesQuery = (params?: {
  limit?: number;
  offset?: number;
  startDate?: number;
  endDate?: number;
}) => {
  return useQuery({
    queryKey: voiceKeys.notesList(params || {}),
    queryFn: () => apiClient.getVoiceNotes(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Single voice note query
export const useVoiceNoteQuery = (id: string) => {
  return useQuery({
    queryKey: voiceKeys.note(id),
    queryFn: () => apiClient.getVoiceNote(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// Voice settings query
export const useVoiceSettingsQuery = () => {
  return useQuery({
    queryKey: voiceKeys.settings(),
    queryFn: () => apiClient.getVoiceSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Voice analytics query
export const useVoiceAnalyticsQuery = () => {
  return useQuery({
    queryKey: voiceKeys.analytics(),
    queryFn: () => apiClient.getVoiceAnalytics(),
    staleTime: 5 * 60 * 1000,
  });
};

// Voice accuracy analytics query
export const useVoiceAccuracyAnalyticsQuery = () => {
  return useQuery({
    queryKey: voiceKeys.accuracyAnalytics(),
    queryFn: () => apiClient.getVoiceAccuracyAnalytics(),
    staleTime: 10 * 60 * 1000,
  });
};

// Upload voice note mutation
export const useUploadVoiceNoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ audioFile, language }: { audioFile: File; language?: string }) =>
      apiClient.uploadVoiceNote(audioFile, language),
    onSuccess: () => {
      toast.success('🎤 Voice note uploaded and transcribed!');
      queryClient.invalidateQueries({ queryKey: voiceKeys.notes() });
      queryClient.invalidateQueries({ queryKey: voiceKeys.analytics() });
    },
    onError: () => {
      toast.error('Failed to upload voice note');
    },
  });
};

// Interpret voice command mutation
export const useInterpretVoiceCommandMutation = () => {
  return useMutation({
    mutationFn: (data: { transcription: string; context?: string }) =>
      apiClient.interpretVoiceCommand(data),
    onError: () => {
      toast.error('Failed to interpret voice command');
    },
  });
};

// Execute voice command mutation
export const useExecuteVoiceCommandMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { intent: string; parameters: Record<string, any> }) =>
      apiClient.executeVoiceCommand(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('✅ Voice command executed!');
        // Invalidate relevant queries based on command type
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['health'] });
      } else {
        toast.error('Voice command failed to execute');
      }
    },
    onError: () => {
      toast.error('Failed to execute voice command');
    },
  });
};

// Update voice settings mutation
export const useUpdateVoiceSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<VoiceSettings>) =>
      apiClient.updateVoiceSettings(settings),
    onSuccess: () => {
      toast.success('Voice settings updated!');
      queryClient.invalidateQueries({ queryKey: voiceKeys.settings() });
    },
    onError: () => {
      toast.error('Failed to update voice settings');
    },
  });
};