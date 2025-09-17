// Voice processing store with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../lib/api';
import type { VoiceNote, VoiceCommand, VoiceSettings, VoiceAnalytics } from '../types';

interface VoiceState {
  notes: VoiceNote[];
  settings: VoiceSettings;
  analytics: VoiceAnalytics | null;
  isRecording: boolean;
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;
}

interface VoiceStore extends VoiceState {
  // Actions
  uploadVoiceNote: (audioFile: File, language?: string) => Promise<VoiceNote>;
  fetchVoiceNotes: (params?: any) => Promise<void>;
  getVoiceNote: (id: string) => Promise<VoiceNote>;
  interpretCommand: (transcription: string, context?: string) => Promise<VoiceCommand>;
  executeCommand: (intent: string, parameters: Record<string, any>) => Promise<any>;
  fetchAnalytics: () => Promise<void>;
  getSettings: () => Promise<void>;
  updateSettings: (settings: Partial<VoiceSettings>) => Promise<void>;
  setRecording: (recording: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultSettings: VoiceSettings = {
  language: 'en',
  autoTranscribe: true,
  commandsEnabled: true,
  noiseReduction: true,
  confidenceThreshold: 0.8,
};

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      settings: defaultSettings,
      analytics: null,
      isRecording: false,
      isProcessing: false,
      isLoading: false,
      error: null,

      // Actions
      setRecording: (isRecording) => set({ isRecording }),
      setProcessing: (isProcessing) => set({ isProcessing }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      uploadVoiceNote: async (audioFile, language) => {
        try {
          set({ isProcessing: true, error: null });
          const voiceNote = await apiClient.uploadVoiceNote(audioFile, language);
          const { notes } = get();
          set({
            notes: [voiceNote, ...notes],
            isProcessing: false,
          });
          return voiceNote;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to upload voice note',
            isProcessing: false,
          });
          throw error;
        }
      },

      fetchVoiceNotes: async (params) => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.getVoiceNotes(params);
          set({
            notes: response.notes,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch voice notes',
            isLoading: false,
          });
        }
      },

      getVoiceNote: async (id) => {
        try {
          const voiceNote = await apiClient.getVoiceNote(id);
          return voiceNote;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to get voice note',
          });
          throw error;
        }
      },

      interpretCommand: async (transcription, context) => {
        try {
          set({ isProcessing: true, error: null });
          const command = await apiClient.interpretVoiceCommand({
            transcription,
            context,
          });
          set({ isProcessing: false });
          return command;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to interpret command',
            isProcessing: false,
          });
          throw error;
        }
      },

      executeCommand: async (intent, parameters) => {
        try {
          set({ isProcessing: true, error: null });
          const result = await apiClient.executeVoiceCommand({ intent, parameters });
          set({ isProcessing: false });
          return result;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to execute command',
            isProcessing: false,
          });
          throw error;
        }
      },

      fetchAnalytics: async () => {
        try {
          set({ isLoading: true, error: null });
          const analytics = await apiClient.getVoiceAnalytics();
          set({ analytics, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch analytics',
            isLoading: false,
          });
        }
      },

      getSettings: async () => {
        try {
          const settings = await apiClient.getVoiceSettings();
          set({ settings });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to get settings',
          });
        }
      },

      updateSettings: async (newSettings) => {
        try {
          const settings = await apiClient.updateVoiceSettings(newSettings);
          set({ settings });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update settings',
          });
          throw error;
        }
      },
    }),
    {
      name: 'voice-store',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);