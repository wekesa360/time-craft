import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '../lib/api';
import { 
  Plus, 
  Activity, 
  Heart, 
  Droplets, 
  Smile,
  Calendar,
  Target
} from 'lucide-react';

// Components
import HealthDashboard from '../components/features/health/HealthDashboard';
import ExerciseLogger from '../components/features/health/ExerciseLogger';
import { NutritionTracker } from '../components/features/health/NutritionTracker';
import MoodTracker from '../components/features/health/MoodTracker';
import { HydrationLogger } from '../components/features/health/HydrationLogger';
import { GoalCreationSheet } from '../components/features/health/GoalCreationSheet';
import HealthInsights from '../components/features/health/HealthInsights';

// Hooks and API
import { 
  useHealthSummaryQuery,
  useHealthInsightsQuery,
  useHealthLogsQuery,
  useHealthGoalsQuery,
  useLogExerciseMutation,
  useLogNutritionMutation,
  useLogMoodMutation,
  useLogHydrationMutation
} from '../hooks/queries/useHealthQueries';
import type { ExerciseData, NutritionData, MoodData, HydrationData } from '../types';

type ViewMode = 'dashboard' | 'insights' | 'logs' | 'goals';
type LoggerType = 'exercise' | 'nutrition' | 'mood' | 'hydration' | 'goal' | null;

export default function HealthPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [activeLogger, setActiveLogger] = useState<LoggerType>(null);

  // Queries
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

  const handleCreateGoal = async (data: any) => {
    try {
      await apiClient.createHealthGoal(data);
      toast.success('Health goal created successfully!');
      setActiveLogger(null);
      // Refresh goals data
      queryClient.invalidateQueries({ queryKey: ['health-goals'] });
    } catch (error) {
      toast.error('Failed to create health goal');
    }
  };

  const isLoading = summaryLoading || insightsLoading || logsLoading || goalsLoading;

  // Fallback data for when API calls fail or return undefined
  const fallbackSummary = {
    exerciseCount: 0,
    nutritionCount: 0,
    hydrationTotal: 0,
    moodAverage: 5
  };

  const fallbackInsights = {
    overallScore: 5,
    trends: {
      exercise: 'stable' as const,
      nutrition: 'stable' as const,
      mood: 'stable' as const
    },
    recommendations: [],
    correlations: []
  };

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
          {/* View Mode Tabs */}
          <div className="flex items-center bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'dashboard' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('insights')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'insights' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              AI Insights
            </button>
            <button
              onClick={() => setViewMode('logs')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'logs' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Health Logs
            </button>
            <button
              onClick={() => setViewMode('goals')}
              className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                viewMode === 'goals' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
              }`}
            >
              Goals
            </button>
          </div>

        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'dashboard' && (
        <HealthDashboard
          summary={summary || fallbackSummary}
          insights={insights || fallbackInsights}
          goals={goals || []}
          onLogExercise={() => setActiveLogger('exercise')}
          onLogNutrition={() => setActiveLogger('nutrition')}
          onLogHydration={() => setActiveLogger('hydration')}
          onLogMood={() => setActiveLogger('mood')}
        />
      )}

      {viewMode === 'insights' && (
        <HealthInsights
          insights={insights || fallbackInsights}
          isLoading={insightsLoading}
        />
      )}

      {viewMode === 'logs' && (
        <div className="space-y-6">
          {/* Recent Logs */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Health Logs</h3>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">No health logs yet</h3>
                <p className="text-foreground-secondary mb-4">
                  Start tracking your health by logging your first activity
                </p>
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
              <button 
                onClick={() => setActiveLogger('goal')}
                className="btn btn-primary"
              >
                {goals.length === 0 ? 'Create Your First Goal' : 'Add Goal'}
              </button>
            </div>
            
            {goals.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">No health goals set</h3>
                <p className="text-foreground-secondary mb-4">
                  Set health goals to track your progress and stay motivated
                </p>
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

      <GoalCreationSheet
        isOpen={activeLogger === 'goal'}
        onClose={() => setActiveLogger(null)}
        onSave={handleCreateGoal}
      />
    </div>
  );
}