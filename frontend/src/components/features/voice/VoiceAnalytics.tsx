import React from 'react';
import { useVoiceAnalyticsQuery, useVoiceAccuracyAnalyticsQuery } from '../../../hooks/queries/useVoiceQueries';

export const VoiceAnalytics: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = useVoiceAnalyticsQuery();
  const { data: accuracyData, isLoading: accuracyLoading } = useVoiceAccuracyAnalyticsQuery();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  if (analyticsLoading || accuracyLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Voice Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Insights into your voice processing usage and accuracy
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Notes
            </h3>
            <span className="text-2xl">🎤</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics?.totalNotes || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Duration
            </h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatDuration(analytics?.totalDuration || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Avg Confidence
            </h3>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercentage(analytics?.averageConfidence || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Commands Executed
            </h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics?.commandsExecuted || 0}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Top Commands */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Used Commands
          </h3>
          
          {analytics?.topCommands && analytics.topCommands.length > 0 ? (
            <div className="space-y-3">
              {analytics.topCommands.map((command, index) => {
                const commandIcons: Record<string, string> = {
                  create_task: '✅',
                  complete_task: '✔️',
                  set_reminder: '⏰',
                  log_exercise: '🏃',
                  log_nutrition: '🍎',
                  start_focus: '🎯',
                  schedule_meeting: '📅',
                };
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {commandIcons[command] || '💬'}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {command.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🗣️</div>
              <p className="text-gray-500 dark:text-gray-400">
                No commands executed yet
              </p>
            </div>
          )}
        </div>

        {/* Accuracy Trend */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accuracy Trend
          </h3>
          
          {analytics?.accuracyTrend && analytics.accuracyTrend.length > 0 ? (
            <div className="space-y-4">
              {/* Simple trend visualization */}
              <div className="flex items-end gap-2 h-32">
                {analytics.accuracyTrend.slice(-7).map((accuracy, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-purple-200 dark:bg-purple-800 rounded-t"
                    style={{ height: `${accuracy * 100}%` }}
                    title={`Day ${index + 1}: ${formatPercentage(accuracy)}`}
                  />
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>7 days ago</span>
                <span>Today</span>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Current Accuracy
                </div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPercentage(analytics.accuracyTrend[analytics.accuracyTrend.length - 1] || 0)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-gray-500 dark:text-gray-400">
                Not enough data for trend analysis
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Insights */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Usage Insights
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Recording Habits
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <li>
                • Average note length: {analytics?.totalNotes ? formatDuration((analytics.totalDuration || 0) / analytics.totalNotes) : '0m'}
              </li>
              <li>
                • Command success rate: {analytics?.commandsExecuted && analytics?.totalNotes ? 
                  formatPercentage(analytics.commandsExecuted / analytics.totalNotes) : '0%'}
              </li>
              <li>
                • Most active feature: {analytics?.topCommands?.[0]?.replace(/_/g, ' ') || 'None'}
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Recommendations
            </h4>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {(analytics?.averageConfidence || 0) < 0.8 && (
                <li>• Try speaking more clearly for better accuracy</li>
              )}
              {(analytics?.totalNotes || 0) < 10 && (
                <li>• Record more notes to improve AI understanding</li>
              )}
              {(analytics?.commandsExecuted || 0) === 0 && (
                <li>• Try using voice commands to automate tasks</li>
              )}
              <li>• Use noise reduction for better transcription quality</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};