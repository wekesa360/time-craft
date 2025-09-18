import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Activity, 
  Heart, 
  Droplets, 
  Smile,
  Brain,
  TrendingUp,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';

// Components
import HealthDashboard from '../components/features/health/HealthDashboard';
import ExerciseLogger from '../components/features/health/ExerciseLogger';
import { NutritionTracker } from '../components/features/health/NutritionTracker';
import MoodTracker from '../components/features/health/MoodTracker';
import { HydrationLogger } from '../components/features/health/HydrationLogger';
import HealthInsights from '../components/features/health/HealthInsights';

// Hooks and API
import { useHealthQueries } from '../hooks/queries/useHealthQueries';
import type { ExerciseData, NutritionData, MoodData, HydrationData } from '../types';

type ViewMode = 'dashboard' | 'insights' | 'logs' | 'goals';
type LoggerType = 'exercise' | 'nutrition' | 'mood' | 'hydration' | null;

export default function HealthPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeLogger, setActiveLogger] = useState<LoggerType>(null);

  // Queries
  const {
    useHealthSummaryQuery,
    useHealthInsightsQuery,
    useHealthLogsQuery,
    useHealthGoalsQuery,
    useLogExerciseMutation,
    useLogNutritionMutation,
    useLogMoodMutation,
    useLogHydrationMutation
  } = useHealthQueries();

  const { data: summary, isLoading: summaryLoading } = useHealthSummaryQuery();
  const { data: insights, isLoading: insightsLoading } = useHealthInsightsQuery();
  const { data: logs = [], isLoading: logsLoading } = useHealthLogsQuery();
  const { data: goals = [], isLoading: goalsLoading } = useHealthGoalsQuery();

  // Mutations
  const logExerciseMutation = useLogExerciseMutation();
  const logNutritionMutation = useLogNutritionMutation();
  const logMoodMutation = useLogMoodMutation();
  const logHydrationMutation = useLogHydrationMutation();

  // Handlers
  const handleLogExercise = async (data: ExerciseData) => {
    try {
      await logExerciseMutation.mutateAsync(data);
      toast.success('Exercise logged successfully!');
      setActiveLogger(null);
    } catch (error) {
      toast.error('Failed to log exercise');
    }
  };

  const handleLogNutrition = async (data: NutritionData) => {
    try {
      await logNutritionMutation.mutateAsync(data);
      toast.success('Nutrition logged successfully!');
      setActiveLogger(null);
    } catch (error) {
      toast.error('Failed to log nutrition');
    }
  };

  const handleLogMood = async (data: MoodData) => {
    try {
      await logMoodMutation.mutateAsync(data);
      toast.success('Mood logged successfully!');
      setActiveLogger(null);
    } catch (error) {
      toast.error('Failed to log mood');
    }
  };

  const handleLogHydration = async (data: HydrationData) => {
    try {
      await logHydrationMutation.mutateAsync(data);
      toast.success('Hydration logged successfully!');
      setActiveLogger(null);
    } catch (error) {
      toast.error('Failed to log hydration');
    }
  };

  const isLoading = summaryLoading || insightsLoading || logsLoading || goalsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t('navigation.health')}
          </h1>
          <p className="text-foreground-secondary mt-1">
            Track your wellness journey with AI-powered insights
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'dashboard' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Dashboard"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('insights')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'insights' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="AI Insights"
            >
              <Brain className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('logs')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'logs' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Health Logs"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('goals')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'goals' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
              title="Goals"
            >
              <Target className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Log Buttons */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveLogger('exercise')}
              className="btn-outline text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              title="Log Exercise"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveLogger('nutrition')}
              className="btn-outline text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20"
              title="Log Nutrition"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveLogger('hydration')}
              className="btn-outline text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              title="Log Hydration"
            >
              <Droplets className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveLogger('mood')}
              className="btn-outline text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              title="Log Mood"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'dashboard' && summary && insights && (
        <HealthDashboard
          summary={summary}
          insights={insights}
          goals={goals}
        />
      )}

      {viewMode === 'insights' && insights && (
        <HealthInsights
          insights={insights}
          isLoading={insightsLoading}
        />
      )}

      {viewMode === 'logs' && (
        <div className="space-y-6">
          {/* Recent Logs */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Health Logs</h3>
              <Calendar className="w-5 h-5 text-foreground-secondary" />
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No health logs yet</h3>
                <p className="text-foreground-secondary mb-4">
                  Start tracking your health by logging your first activity
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <button 
                    onClick={() => setActiveLogger('exercise')}
                    className="btn-primary"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Log Exercise
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        log.type === 'exercise' ? 'bg-orange-100 dark:bg-orange-950' :
                        log.type === 'nutrition' ? 'bg-green-100 dark:bg-green-950' :
                        log.type === 'mood' ? 'bg-purple-100 dark:bg-purple-950' :
                        'bg-blue-100 dark:bg-blue-950'
                      }`}>
                        {log.type === 'exercise' && <Activity className="w-4 h-4 text-orange-600" />}
                        {log.type === 'nutrition' && <Heart className="w-4 h-4 text-green-600" />}
                        {log.type === 'mood' && <Smile className="w-4 h-4 text-purple-600" />}
                        {log.type === 'hydration' && <Droplets className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{log.type}</p>
                        <p className="text-sm text-foreground-secondary">
                          {new Date(log.recordedAt).toLocaleDateString()} at {new Date(log.recordedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground-secondary">
                        {log.source === 'manual' ? '✋ Manual' : '🤖 Auto'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'goals' && (
        <div className="space-y-6">
          {/* Health Goals */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Health Goals</h3>
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </button>
            </div>
            
            {goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-foreground-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No health goals set</h3>
                <p className="text-foreground-secondary mb-4">
                  Set health goals to track your progress and stay motivated
                </p>
                <button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{goal.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        goal.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {goal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground-secondary">Progress</span>
                        <span className="text-foreground">
                          {goal.progress.current}/{goal.targetValue}
                        </span>
                      </div>
                      <div className="w-full bg-background-secondary rounded-full h-2">
                        <div 
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, goal.progress.percentage)}%` }}
                        />
                      </div>
                      <div className="text-xs text-foreground-secondary">
                        {goal.progress.percentage.toFixed(0)}% complete
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Loggers */}
      <ExerciseLogger
        isOpen={activeLogger === 'exercise'}
        onClose={() => setActiveLogger(null)}
        onSave={handleLogExercise}
      />

      <NutritionTracker
        isOpen={activeLogger === 'nutrition'}
        onClose={() => setActiveLogger(null)}
        onSave={handleLogNutrition}
      />

      <MoodTracker
        isOpen={activeLogger === 'mood'}
        onClose={() => setActiveLogger(null)}
        onSave={handleLogMood}
      />

      <HydrationLogger
        isOpen={activeLogger === 'hydration'}
        onClose={() => setActiveLogger(null)}
        onSave={handleLogHydration}
      />
    </div>
  );
}