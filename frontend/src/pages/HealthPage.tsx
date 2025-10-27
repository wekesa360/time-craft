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
  Target,
  TrendingUp
} from 'lucide-react';
import TabSwitcher from '../components/ui/TabSwitcher';
import type { TabItem } from '../components/ui/TabSwitcher';

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
      setActiveLogger(null); // Close the logger sheet on success
    } catch (error) {
      // Error toast is already shown by the mutation
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

  // Tab configuration
  const healthTabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'insights', label: 'AI Insights' },
    { id: 'logs', label: 'Health Logs' },
    { id: 'goals', label: 'Goals' },
  ];

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
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Health & Fitness</h1>
        <p className="text-muted-foreground mt-1">Track your nutrition, exercise, and wellness</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Activity,
            label: "Log Exercise",
            color: "bg-primary/10 text-primary",
            action: () => setActiveLogger('exercise'),
          },
          {
            icon: Heart,
            label: "Log Nutrition",
            color: "bg-orange-100 text-orange-600",
            action: () => setActiveLogger('nutrition'),
          },
          { 
            icon: Droplets, 
            label: "Log Water", 
            color: "bg-blue-100 text-blue-600", 
            action: () => setActiveLogger('hydration') 
          },
          { 
            icon: Smile, 
            label: "Log Mood", 
            color: "bg-purple-100 text-purple-600", 
            action: () => setActiveLogger('mood') 
          },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.action}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border hover:border-primary transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>

      {/* View Navigation */}
      <TabSwitcher
        tabs={healthTabs}
        activeTab={viewMode}
        onTabChange={(tabId) => setViewMode(tabId as ViewMode)}
      />

      {/* Content based on view mode */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Nutrition Overview */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Today's Nutrition</h2>
              <span className="text-sm text-muted-foreground">
                {summary?.nutritionCount || 0} / 2,300 kcal
              </span>
            </div>

            {/* Calorie Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Calories</span>
                <span className="text-sm text-primary font-medium">
                  {Math.round(((summary?.nutritionCount || 0) / 2300) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${Math.min(100, ((summary?.nutritionCount || 0) / 2300) * 100)}%` }} 
                />
              </div>
            </div>

            {/* Macros */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Carbs</span>
                  <span className="text-xs text-muted-foreground">112 / 240g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: "47%" }} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Protein</span>
                  <span className="text-xs text-muted-foreground">48 / 140g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: "34%" }} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Fats</span>
                  <span className="text-xs text-muted-foreground">32 / 110g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: "29%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Nutrition Logs */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Recent Nutrition</h2>
                <button
                  onClick={() => setActiveLogger('nutrition')}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add meal
                </button>
              </div>

              <div className="space-y-3">
                {logs.filter(log => log.type === 'nutrition').slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Nutrition Entry</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.recordedAt).toLocaleDateString()} at {new Date(log.recordedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">--</p>
                      <p className="text-xs text-muted-foreground">kcal</p>
                    </div>
                  </div>
                ))}
                {logs.filter(log => log.type === 'nutrition').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No nutrition logs yet
                  </div>
                )}
              </div>
            </div>

            {/* Recent Exercise Logs */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Recent Workouts</h2>
                <button
                  onClick={() => setActiveLogger('exercise')}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Log workout
                </button>
              </div>

              <div className="space-y-3">
                {logs.filter(log => log.type === 'exercise').slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Exercise Session</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.recordedAt).toLocaleDateString()} at {new Date(log.recordedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">--</p>
                      <p className="text-xs text-muted-foreground">-- kcal</p>
                    </div>
                  </div>
                ))}
                {logs.filter(log => log.type === 'exercise').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No exercise logs yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Weekly Progress</h2>
              <div className="flex items-center gap-2 text-sm text-primary">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from last week</span>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { 
                  label: "Exercise Sessions", 
                  value: summary?.exerciseCount?.toString() || "0", 
                  unit: "sessions", 
                  color: "text-primary", 
                  bg: "bg-primary/10" 
                },
                { 
                  label: "Hydration", 
                  value: summary?.hydrationTotal?.toString() || "0", 
                  unit: "glasses", 
                  color: "text-blue-600", 
                  bg: "bg-blue-100" 
                },
                { 
                  label: "Mood Average", 
                  value: summary?.moodAverage?.toFixed(1) || "5.0", 
                  unit: "/10", 
                  color: "text-purple-600", 
                  bg: "bg-purple-100" 
                },
                { 
                  label: "Nutrition Logs", 
                  value: summary?.nutritionCount?.toString() || "0", 
                  unit: "entries", 
                  color: "text-orange-600", 
                  bg: "bg-orange-100" 
                },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-border">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <TrendingUp className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
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
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Recent Health Logs</h3>
            </div>
            
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">No health logs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your health by logging your first activity
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.type === 'exercise' ? 'bg-primary/10' :
                      log.type === 'nutrition' ? 'bg-orange-100' :
                      log.type === 'mood' ? 'bg-purple-100' :
                      'bg-blue-100'
                    }`}>
                      {log.type === 'exercise' && <Activity className="w-6 h-6 text-primary" />}
                      {log.type === 'nutrition' && <Heart className="w-6 h-6 text-orange-600" />}
                      {log.type === 'mood' && <Smile className="w-6 h-6 text-purple-600" />}
                      {log.type === 'hydration' && <Droplets className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground capitalize">{log.type} Entry</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.recordedAt).toLocaleDateString()} at {new Date(log.recordedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
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
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Health Goals</h3>
              <button 
                onClick={() => setActiveLogger('goal')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {goals.length === 0 ? 'Create Your First Goal' : 'Add Goal'}
              </button>
            </div>
            
            {goals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No health goals set</h3>
                <p className="text-muted-foreground mb-4">
                  Set health goals to track your progress and stay motivated
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{goal.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        goal.isActive ? 'bg-green-100 text-green-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {goal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground">
                          {goal.progress.current}/{goal.targetValue}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, goal.progress.percentage)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
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
    </div>
  );
}