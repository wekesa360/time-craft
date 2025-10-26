import React from 'react';
import { 
  Heart, 
  Activity, 
  Droplets, 
  Smile, 
  TrendingUp,
  Target,
  Calendar,
  Award
} from 'lucide-react';

interface HealthDashboardProps {
  summary: {
    exerciseCount: number;
    nutritionCount: number;
    hydrationTotal: number;
    moodAverage: number;
  };
  insights: {
    overallScore: number;
    trends: {
      exercise: 'improving' | 'stable' | 'declining';
      nutrition: 'improving' | 'stable' | 'declining';
      mood: 'improving' | 'stable' | 'declining';
    };
    recommendations: Array<{
      type: string;
      priority: 'low' | 'medium' | 'high';
      message: string;
    }>;
  };
  goals: Array<{
    id: string;
    type: string;
    description: string;
    progress: {
      current: number;
      percentage: number;
    };
    targetValue: number;
  }>;
  onLogExercise?: () => void;
  onLogNutrition?: () => void;
  onLogHydration?: () => void;
  onLogMood?: () => void;
}

const HealthDashboard: React.FC<HealthDashboardProps> = ({
  summary,
  insights,
  goals,
  onLogExercise,
  onLogNutrition,
  onLogHydration,
  onLogMood
}) => {
  // Debug logging
  console.log('HealthDashboard received:', { summary, insights, goals });
  
  // Add null checks and fallbacks
  const safeInsights = {
    overallScore: insights?.overallScore ?? 5,
    trends: {
      exercise: (insights?.trends && typeof insights.trends === 'object' && insights.trends.exercise) ? insights.trends.exercise : 'stable' as const,
      nutrition: (insights?.trends && typeof insights.trends === 'object' && insights.trends.nutrition) ? insights.trends.nutrition : 'stable' as const,
      mood: (insights?.trends && typeof insights.trends === 'object' && insights.trends.mood) ? insights.trends.mood : 'stable' as const
    },
    recommendations: Array.isArray(insights?.recommendations) ? insights.recommendations : []
  };

  const safeSummary = {
    exerciseCount: summary?.exerciseCount ?? 0,
    nutritionCount: summary?.nutritionCount ?? 0,
    hydrationTotal: summary?.hydrationTotal ?? 0,
    moodAverage: summary?.moodAverage ?? 5
  };

  const safeGoals = goals ?? [];
  
  // Debug logging for safe data
  console.log('HealthDashboard safe data:', { safeInsights, safeSummary, safeGoals });
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-error rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-muted-foreground rotate-90" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-success';
      case 'declining':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatHydration = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Health Score</h2>
            <p className="text-foreground-secondary">Your overall wellness rating</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-info mb-1">
              {safeInsights.overallScore}/10
            </div>
            <div className="flex items-center justify-center space-x-1">
              <Heart className="w-4 h-4 text-error-light0" />
              <span className="text-sm text-foreground-secondary">
                {safeInsights.overallScore >= 8 ? 'Excellent' : 
                 safeInsights.overallScore >= 6 ? 'Good' : 
                 safeInsights.overallScore >= 4 ? 'Fair' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Exercise */}
        <div className="card p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Exercise Sessions</p>
              <p className="text-2xl font-bold text-foreground">{safeSummary.exerciseCount}</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Nutrition Logs</p>
              <p className="text-2xl font-bold text-foreground">{safeSummary.nutritionCount}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(safeInsights.trends.nutrition)}
                <span className={`text-xs ${getTrendColor(safeInsights.trends.nutrition)}`}>
                  {safeInsights.trends.nutrition}
                </span>
              </div>
            </div>
            <div className="p-3 bg-success-light dark:bg-success rounded-lg">
              <Heart className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        {/* Hydration */}
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Hydration</p>
              <p className="text-2xl font-bold text-foreground">{formatHydration(safeSummary.hydrationTotal)}</p>
              <p className="text-xs text-info">This week</p>
            </div>
            <div className="p-3 bg-info-light dark:bg-info rounded-lg">
              <Droplets className="w-6 h-6 text-info" />
            </div>
          </div>
        </div>

        {/* Mood */}
        <div className="card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Avg Mood</p>
              <p className="text-2xl font-bold text-foreground">{safeSummary.moodAverage.toFixed(1)}/10</p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(safeInsights.trends.mood)}
                <span className={`text-xs ${getTrendColor(safeInsights.trends.mood)}`}>
                  {safeInsights.trends.mood}
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Smile className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Progress */}
      {safeGoals.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Health Goals</h3>
            <Target className="w-5 h-5 text-foreground-secondary" />
          </div>
          <div className="space-y-4">
            {safeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{goal.description}</span>
                  <span className="text-foreground-secondary">
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
            ))}
          </div>
        </div>
      )}


      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={onLogExercise}
          className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-muted p-4 text-left transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary transition-colors">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-primary dark:group-hover:text-primary-300 transition-colors">Log Exercise</p>
              <p className="text-xs text-foreground-secondary">Track your workout</p>
            </div>
          </div>
        </button>

        <button 
          onClick={onLogNutrition}
          className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-muted p-4 text-left transition-all duration-200 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-light dark:bg-success rounded-lg group-hover:bg-success-light dark:group-hover:bg-success transition-colors">
              <Heart className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-success dark:group-hover:text-success-light transition-colors">Log Meal</p>
              <p className="text-xs text-foreground-secondary">Record nutrition</p>
            </div>
          </div>
        </button>

        <button 
          onClick={onLogHydration}
          className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-muted p-4 text-left transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-info-light dark:bg-info rounded-lg group-hover:bg-info-light dark:group-hover:bg-info transition-colors">
              <Droplets className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-info dark:group-hover:text-info-light transition-colors">Log Water</p>
              <p className="text-xs text-foreground-secondary">Track hydration</p>
            </div>
          </div>
        </button>

        <button 
          onClick={onLogMood}
          className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-muted p-4 text-left transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900 transition-colors">
              <Smile className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Log Mood</p>
              <p className="text-xs text-foreground-secondary">Track wellbeing</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HealthDashboard;