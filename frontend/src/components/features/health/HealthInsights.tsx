import React from 'react';
import type { HealthInsights as HealthInsightsType } from '../../../types';
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

const HealthInsights: React.FC<HealthInsightsProps> = ({
  insights,
  isLoading = false
}) => {
  // Add null checks and fallbacks
  const safeInsights = {
    overallScore: insights?.overallScore ?? 5,
    trends: {
      exercise: insights?.trends?.exercise ?? 'stable' as const,
      nutrition: insights?.trends?.nutrition ?? 'stable' as const,
      mood: insights?.trends?.mood ?? 'stable' as const
    },
    recommendations: insights?.recommendations ?? [],
    correlations: insights?.correlations ?? []
  };

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
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
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
            <div
              className={`text-4xl font-bold ${getScoreColor(safeInsights.overallScore)}`}
            >
              {safeInsights.overallScore.toFixed(1)}
            </div>
            <div className="text-sm text-foreground-secondary">
              {getScoreDescription(safeInsights.overallScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Health Trends */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Health Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(safeInsights.trends).map(([key, trend]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border ${getTrendColor(trend)}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {key === 'exercise' && <Activity className="w-5 h-5" />}
                {key === 'nutrition' && <Heart className="w-5 h-5" />}
                {key === 'mood' && <Smile className="w-5 h-5" />}
                <span className="font-medium capitalize">{key}</span>
                {getTrendIcon(trend)}
              </div>
              <p className="text-sm capitalize">
                {trend === 'improving' ? 'Trending up' : 
                 trend === 'declining' ? 'Needs attention' : 'Stable'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
        </div>
        <div className="space-y-3">
          {safeInsights.recommendations.length > 0 ? (
            safeInsights.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-l-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500' :
                  'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {getPriorityIcon(rec.priority)}
                  <div>
                    <p className={`font-medium ${
                      rec.priority === 'high' ? 'text-red-800 dark:text-red-200' :
                      rec.priority === 'medium' ? 'text-yellow-800 dark:text-yellow-200' :
                      'text-blue-800 dark:text-blue-200'
                    }`}>
                      {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} Recommendation
                    </p>
                    <p className={`text-sm mt-1 ${
                      rec.priority === 'high' ? 'text-red-700 dark:text-red-300' :
                      rec.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-300' :
                      'text-blue-700 dark:text-blue-300'
                    }`}>
                      {rec.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-foreground-secondary">
              <p>No AI insights available yet</p>
              <p className="text-sm">Log more health activities to get personalized recommendations</p>
            </div>
          )}
        </div>
      </div>

      {/* Health Correlations */}
      {safeInsights.correlations.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Health Correlations</h3>
          <div className="space-y-3">
            {safeInsights.correlations.map((correlation, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-foreground-secondary">
                  <span className="font-medium">{correlation.factor1}</span> and{' '}
                  <span className="font-medium">{correlation.factor2}</span> show a{' '}
                  <span className={`font-medium ${
                    correlation.strength === 'strong' ? 'text-green-600' :
                    correlation.strength === 'moderate' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {correlation.strength}
                  </span>{' '}
                  correlation
                </p>
                <p className="text-xs text-foreground-secondary mt-1">
                  {correlation.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthInsights;
