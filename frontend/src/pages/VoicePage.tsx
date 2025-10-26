import React, { useState } from 'react';
import VoiceRecorder from '../components/features/voice/VoiceRecorder';
import { VoiceNotesList } from '../components/features/voice/VoiceNotesList';
import VoiceAnalytics from '../components/features/voice/VoiceAnalytics';
import { VoiceSettings } from '../components/features/voice/VoiceSettings';
import { CommandProcessor } from '../components/features/voice/CommandProcessor';

type ViewMode = 'recorder' | 'notes' | 'analytics' | 'settings' | 'commands';

const VoicePage: React.FC = () => {
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
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Voice Processing
          </h1>
          <p className="text-muted-foreground">
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
                  : 'bg-white dark:bg-muted text-muted-foreground dark:text-muted-foreground hover:bg-purple-50 dark:hover:bg-muted'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {/* Active View Content */}
        <div className="bg-card rounded-2xl border border-border p-6">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
};

export default VoicePage;