import React, { useState, useEffect } from 'react';
import { useVoiceSettingsQuery, useUpdateVoiceSettingsMutation } from '../../../hooks/queries/useVoiceQueries';
import type { VoiceSettings as VoiceSettingsType } from '../../../types';

export const VoiceSettings: React.FC = () => {
  const { data: settings, isLoading } = useVoiceSettingsQuery();
  const updateMutation = useUpdateVoiceSettingsMutation();
  
  const [localSettings, setLocalSettings] = useState<Partial<VoiceSettingsType>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  };

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alert('✅ Microphone access granted! You can now record voice notes.');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      alert('❌ Could not access microphone. Please check your browser permissions.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Voice Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Configure your voice processing preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Settings */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🌍 Language & Region
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Voice Recognition Language
              </label>
              <select
                value={localSettings.language || 'en'}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="de">German (Deutsch)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose the primary language for voice recognition
              </p>
            </div>
          </div>
        </div>

        {/* Processing Settings */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚙️ Processing Options
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Transcribe
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically transcribe voice notes after recording
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('autoTranscribe', !localSettings.autoTranscribe)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.autoTranscribe
                    ? 'bg-purple-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoTranscribe ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Voice Commands
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable voice command interpretation and execution
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('commandsEnabled', !localSettings.commandsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.commandsEnabled
                    ? 'bg-purple-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.commandsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Noise Reduction
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Apply noise reduction during recording for better quality
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('noiseReduction', !localSettings.noiseReduction)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.noiseReduction
                    ? 'bg-purple-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.noiseReduction ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quality Settings */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Quality & Accuracy
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confidence Threshold
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={localSettings.confidenceThreshold || 0.8}
                  onChange={(e) => handleSettingChange('confidenceThreshold', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[3rem]">
                  {Math.round((localSettings.confidenceThreshold || 0.8) * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum confidence level required for command execution
              </p>
            </div>
          </div>
        </div>

        {/* Device Testing */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎤 Device Testing
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={testMicrophone}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>🎤</span>
              Test Microphone Access
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="mb-2">💡 <strong>Tips for better voice recognition:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Use a quiet environment when possible</li>
                <li>• Keep your microphone close but not too close</li>
                <li>• Enable noise reduction for noisy environments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You have unsaved changes. Don't forget to save your settings!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};