import React, { useState } from 'react';
import { VoiceRecorder } from '../components/features/voice/VoiceRecorder';
import { VoiceNotesList } from '../components/features/voice/VoiceNotesList';
import { VoiceAnalytics } from '../components/features/voice/VoiceAnalytics';
import { VoiceSettings } from '../components/features/voice/VoiceSettings';
import { CommandProcessor } from '../components/features/voice/CommandProcessor';

type ViewMode = 'recorder' | 'notes' | 'analytics' | 'settings' | 'commands';

export const VoicePage: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('recorder');

  const views = [
    { id: 'recorder' as const, label: 'Record', icon: '🎤' },
    { id: 'notes' as const, label: 'Notes', icon: '📝' },
    { id: 'commands' as const, label: 'Commands', icon: '🗣️' },
    { id: 'analytics' as const, label: 'Analytics', icon: '📊' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙️' },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'recorder':
        return <VoiceRecorder />;
      case 'notes':
        return <VoiceNotesList />;
      case 'commands':
        return <CommandProcessor />;
      case 'analytics':
        return <VoiceAnalytics />;
      case 'settings':
        return <VoiceSettings />;
      default:
        return <VoiceRecorder />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Record voice notes, execute commands, and analyze your voice interactions
          </p>
        </div>

        {/* View Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeView === view.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Active View Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};