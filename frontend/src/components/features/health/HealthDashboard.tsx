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
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({
  summary,
  insights,
  goals
}) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600 rotate-90" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
            <div className="text-4xl font-bold text-blue-600 mb-1">
              {insights.overallScore}/10
            </div>
            <div className="flex items-center justify-center space-x-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm text-foreground-secondary">
                {insights.overallScore >= 8 ? 'Excellent' : 
                 insights.overallScore >= 6 ? 'Good' : 
                 insights.overallScore >= 4 ? 'Fair' : 'Needs Attention'}
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
              <p className="text-2xl font-bold text-foreground">{summary.exerciseCount}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(insights.trends.exercise)}
                <span className={`text-xs ${getTrendColor(insights.trends.exercise)}`}>
                  {insights.trends.exercise}
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Nutrition Logs</p>
              <p className="text-2xl font-bold text-foreground">{summary.nutritionCount}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(insights.trends.nutrition)}
                <span className={`text-xs ${getTrendColor(insights.trends.nutrition)}`}>
                  {insights.trends.nutrition}
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Hydration */}
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Hydration</p>
              <p className="text-2xl font-bold text-foreground">{formatHydration(summary.hydrationTotal)}</p>
              <p className="text-xs text-blue-600">This week</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Droplets className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Mood */}
        <div className="card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Avg Mood</p>
              <p className="text-2xl font-bold text-foreground">{summary.moodAverage.toFixed(1)}/10</p>
              <div className="flex items-center space-x-1 mt-1">
                {getTrendIcon(insights.trends.mood)}
                <span className={`text-xs ${getTrendColor(insights.trends.mood)}`}>
                  {insights.trends.mood}
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
      {goals.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Health Goals</h3>
            <Target className="w-5 h-5 text-foreground-secondary" />
          </div>
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => (
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

      {/* AI Recommendations */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
          <Award className="w-5 h-5 text-foreground-secondary" />
        </div>
        <div className="space-y-3">
          {insights.recommendations.slice(0, 3).map((rec, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-l-red-500' :
                rec.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500' :
                'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    rec.priority === 'high' ? 'text-red-800 dark:text-red-200' :
                    rec.priority === 'medium' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-blue-800 dark:text-blue-200'
                  }`}>
                    {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} Recommendation
                  </p>
                  <p className={`text-xs mt-1 ${
                    rec.priority === 'high' ? 'text-red-700 dark:text-red-300' :
                    rec.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-300' :
                    'text-blue-700 dark:text-blue-300'
                  }`}>
                    {rec.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="card p-4 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Log Exercise</p>
              <p className="text-xs text-foreground-secondary">Track your workout</p>
            </div>
          </div>
        </button>

        <button className="card p-4 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <Heart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Log Meal</p>
              <p className="text-xs text-foreground-secondary">Record nutrition</p>
            </div>
          </div>
        </button>

        <button className="card p-4 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Log Water</p>
              <p className="text-xs text-foreground-secondary">Track hydration</p>
            </div>
          </div>
        </button>

        <button className="card p-4 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Smile className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Log Mood</p>
              <p className="text-xs text-foreground-secondary">Track wellbeing</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};