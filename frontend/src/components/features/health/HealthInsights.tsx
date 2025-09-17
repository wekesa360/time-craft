import React from 'react';
import { HealthInsights as HealthInsightsType } from '../../../types';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Heart,
  Droplets,
  Smile
} from 'lucide-react';

interface HealthInsightsProps {
  insights: HealthInsightsType;
  isLoading?: boolean;
}

export const HealthInsights: React.FC<HealthInsightsProps> = ({
  insights,
  isLoading = false
}) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'declining':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 8) return 'Excellent health status';
    if (score >= 6) return 'Good health status';
    if (score >= 4) return 'Fair health status';
    return 'Needs attention';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exercise':
        return <Activity className="w-4 h-4" />;
      case 'nutrition':
        return <Heart className="w-4 h-4" />;
      case 'hydration':
        return <Droplets className="w-4 h-4" />;
      case 'mood':
        return <Smile className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-background-secondary rounded w-1/3"></div>
            <div className="h-4 bg-background-secondary rounded w-2/3"></div>
            <div className="h-20 bg-background-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Health Score */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Health Analysis</h3>
              <p className="text-foreground-secondary">Based on your recent health data</p>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(insights.overallScore)}`}>
              {insights.overallScore.toFixed(1)}/10
            </div>
            <p className="text-sm text-foreground-secondary">
              {getScoreDescription(insights.overallScore)}
            </p>
          </div>
        </div>
      </div>

      {/* Health Trends */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-foreground-secondary" />
          Health Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Exercise Trend */}
          <div className={`p-4 rounded-lg border ${getTrendColor(insights.trends.exercise)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span className="font-medium">Exercise</span>
              </div>
              {getTrendIcon(insights.trends.exercise)}
            </div>
            <p className="text-sm capitalize">{insights.trends.exercise}</p>
          </div>

          {/* Nutrition Trend */}
          <div className={`p-4 rounded-lg border ${getTrendColor(insights.trends.nutrition)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span className="font-medium">Nutrition</span>
              </div>
              {getTrendIcon(insights.trends.nutrition)}
            </div>
            <p className="text-sm capitalize">{insights.trends.nutrition}</p>
          </div>

          {/* Mood Trend */}
          <div className={`p-4 rounded-lg border ${getTrendColor(insights.trends.mood)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Smile className="w-4 h-4" />
                <span className="font-medium">Mood</span>
              </div>
              {getTrendIcon(insights.trends.mood)}
            </div>
            <p className="text-sm capitalize">{insights.trends.mood}</p>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-foreground-secondary" />
          AI Recommendations
        </h3>
        <div className="space-y-4">
          {insights.recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-foreground">Great job! No specific recommendations at this time.</p>
              <p className="text-foreground-secondary text-sm">Keep up your healthy habits!</p>
            </div>
          ) : (
            insights.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPriorityIcon(rec.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTypeIcon(rec.type)}
                      <span className="font-medium text-foreground capitalize">
                        {rec.type} Recommendation
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-foreground-secondary text-sm">{rec.message}</p>
                    {rec.actionable && (
                      <button className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Take Action →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Health Correlations */}
      {insights.correlations && insights.correlations.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-foreground-secondary" />
            Health Correlations
          </h3>
          <div className="space-y-4">
            {insights.correlations.map((correlation, index) => (
              <div key={index} className="p-4 bg-background-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">
                      {correlation.metric1} ↔ {correlation.metric2}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      correlation.significance === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      correlation.significance === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {correlation.significance} significance
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${
                      correlation.correlation > 0.5 ? 'text-green-600' :
                      correlation.correlation > 0.2 ? 'text-yellow-600' :
                      correlation.correlation > -0.2 ? 'text-gray-600' :
                      correlation.correlation > -0.5 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {correlation.correlation > 0 ? '+' : ''}{(correlation.correlation * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-foreground-secondary">{correlation.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Summary */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
          💡 Key Insights Summary
        </h3>
        <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
          <p>• Your health data shows {insights.overallScore >= 7 ? 'excellent' : insights.overallScore >= 5 ? 'good' : 'room for improvement'} overall wellness patterns</p>
          <p>• {insights.recommendations.filter(r => r.priority === 'high').length} high-priority recommendations need attention</p>
          <p>• Most improving area: {Object.entries(insights.trends).find(([_, trend]) => trend === 'improving')?.[0] || 'Keep tracking to see trends'}</p>
          {insights.correlations && insights.correlations.length > 0 && (
            <p>• Found {insights.correlations.filter(c => c.significance === 'high').length} significant health correlations</p>
          )}
        </div>
      </div>
    </div>
  );
};