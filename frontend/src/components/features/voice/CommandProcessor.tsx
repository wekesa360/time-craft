import React, { useState } from 'react';
import { useInterpretVoiceCommandMutation, useExecuteVoiceCommandMutation } from '../../../hooks/queries/useVoiceQueries';
import type { VoiceCommand } from '../../../types';

export const CommandProcessor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedContext, setSelectedContext] = useState('general');
  const [lastInterpretation, setLastInterpretation] = useState<VoiceCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<Array<{
    input: string;
    interpretation: VoiceCommand;
    result?: any;
    timestamp: number;
  }>>([]);

  const interpretMutation = useInterpretVoiceCommandMutation();
  const executeMutation = useExecuteVoiceCommandMutation();

  const contexts = [
    { id: 'general', label: 'General', icon: '💬' },
    { id: 'task_management', label: 'Tasks', icon: '✅' },
    { id: 'health_tracking', label: 'Health', icon: '🏃' },
    { id: 'focus_sessions', label: 'Focus', icon: '🎯' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
  ];

  const exampleCommands = {
    general: [
      'What\'s my schedule for today?',
      'Show me my recent activity',
      'How am I doing this week?'
    ],
    task_management: [
      'Create a task to review the project proposal',
      'Mark my presentation task as complete',
      'Show me my high priority tasks',
      'Set a reminder for the meeting tomorrow'
    ],
    health_tracking: [
      'Log 30 minutes of running',
      'Add a glass of water to my hydration',
      'Record my mood as happy',
      'Set a goal to walk 10000 steps'
    ],
    focus_sessions: [
      'Start a 25 minute focus session',
      'Begin a deep work session',
      'Take a 5 minute break',
      'Show my focus statistics'
    ],
    calendar: [
      'Schedule a meeting with John next Tuesday',
      'Find time for a 1 hour meeting this week',
      'Cancel my 3pm appointment',
      'Show my availability tomorrow'
    ]
  };

  const handleInterpret = async () => {
    if (!inputText.trim()) return;

    try {
      const interpretation = await interpretMutation.mutateAsync({
        transcription: inputText,
        context: selectedContext
      });
      
      setLastInterpretation(interpretation);
      
      // Add to history
      const historyItem = {
        input: inputText,
        interpretation,
        timestamp: Date.now()
      };
      setCommandHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
      
    } catch (error) {
      console.error('Error interpreting command:', error);
    }
  };

  const handleExecute = async () => {
    if (!lastInterpretation) return;

    try {
      const result = await executeMutation.mutateAsync({
        intent: lastInterpretation.intent,
        parameters: lastInterpretation.parameters
      });

      // Update history with result
      setCommandHistory(prev => {
        const updated = [...prev];
        if (updated[0]) {
          updated[0] = { ...updated[0], result };
        }
        return updated;
      });

      setLastInterpretation(null);
      setInputText('');
      
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const useExampleCommand = (command: string) => {
    setInputText(command);
  };

  const getIntentIcon = (intent: string) => {
    const iconMap: Record<string, string> = {
      create_task: '✅',
      complete_task: '✔️',
      set_reminder: '⏰',
      log_exercise: '🏃',
      log_nutrition: '🍎',
      log_mood: '😊',
      start_focus: '🎯',
      schedule_meeting: '📅',
      show_stats: '📊',
      default: '💬'
    };
    return iconMap[intent] || iconMap.default;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Voice Command Processor
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Test voice commands by typing them or use the examples below
        </p>
      </div>

      {/* Command Input */}
      <div className="bg-white dark:bg-gray-700 rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-600">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Context
          </label>
          <div className="flex flex-wrap gap-2">
            {contexts.map((context) => (
              <button
                key={context.id}
                onClick={() => setSelectedContext(context.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedContext === context.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                <span className="mr-1">{context.icon}</span>
                {context.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Command Text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a voice command to test..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInterpret}
            disabled={!inputText.trim() || interpretMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {interpretMutation.isPending ? 'Interpreting...' : '🧠 Interpret'}
          </button>
          
          {lastInterpretation && (
            <button
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {executeMutation.isPending ? 'Executing...' : '⚡ Execute'}
            </button>
          )}
        </div>
      </div>

      {/* Current Interpretation */}
      {lastInterpretation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Interpretation Result
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getIntentIcon(lastInterpretation.intent)}</span>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Intent: {lastInterpretation.intent}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-300">
                (Confidence: {Math.round(lastInterpretation.confidence * 100)}%)
              </span>
            </div>
            
            {Object.keys(lastInterpretation.parameters).length > 0 && (
              <div>
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Parameters:
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm">
                  <pre className="text-gray-900 dark:text-white">
                    {JSON.stringify(lastInterpretation.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Example Commands */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Example Commands
          </h3>
          <div className="space-y-2">
            {exampleCommands[selectedContext as keyof typeof exampleCommands]?.map((command, index) => (
              <button
                key={index}
                onClick={() => useExampleCommand(command)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors text-gray-700 dark:text-gray-300"
              >
                "{command}"
              </button>
            ))}
          </div>
        </div>

        {/* Command History */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Recent Commands
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {commandHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No commands executed yet
              </p>
            ) : (
              commandHistory.map((item, index) => (
                <div key={index} className="border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getIntentIcon(item.interpretation.intent)}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.interpretation.intent}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                    "{item.input}"
                  </p>
                  {item.result && (
                    <div className="text-xs">
                      <span className={`px-2 py-1 rounded ${
                        item.result.success 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {item.result.success ? '✅ Success' : '❌ Failed'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          💡 Tips for Better Voice Commands
        </h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• Be specific with your requests (e.g., "Create a high priority task" instead of "Add task")</li>
          <li>• Include context when possible (e.g., "Schedule a 30-minute meeting with John next Tuesday")</li>
          <li>• Use natural language - the AI understands conversational commands</li>
          <li>• Select the appropriate context for better interpretation accuracy</li>
        </ul>
      </div>
    </div>
  );
};