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
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-error" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-success bg-success-light dark:bg-success/20';
      case 'declining':
        return 'text-error bg-error-light dark:bg-error/20';
      default:
        return 'text-muted-foreground bg-muted dark:bg-muted/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    if (score >= 4) return 'text-primary';
    return 'text-error';
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
        return <AlertTriangle className="w-4 h-4 text-error" />;
      case 'medium':
        return <Target className="w-4 h-4 text-warning" />;
      default:
        return <CheckCircle className="w-4 h-4 text-info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-error bg-error-light dark:bg-error/20';
      case 'medium':
        return 'text-warning bg-warning-light dark:bg-warning/20';
      default:
        return 'text-info bg-info-light dark:bg-info/20';
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
                  rec.priority === 'high' ? 'bg-error-light dark:bg-error/20 border-l-red-500' :
                  rec.priority === 'medium' ? 'bg-warning-light dark:bg-warning/20 border-l-yellow-500' :
                  'bg-info-light dark:bg-info/20 border-l-blue-500'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {getPriorityIcon(rec.priority)}
                  <div>
                    <p className={`font-medium ${
                      rec.priority === 'high' ? 'text-error dark:text-error-light' :
                      rec.priority === 'medium' ? 'text-warning dark:text-warning-light' :
                      'text-info dark:text-info-light'
                    }`}>
                      {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} Recommendation
                    </p>
                    <p className={`text-sm mt-1 ${
                      rec.priority === 'high' ? 'text-error dark:text-error-light' :
                      rec.priority === 'medium' ? 'text-warning dark:text-warning-light' :
                      'text-info dark:text-info-light'
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
              <div key={index} className="p-4 bg-muted dark:bg-muted rounded-lg">
                <p className="text-sm text-foreground-secondary">
                  <span className="font-medium">{correlation.factor1}</span> and{' '}
                  <span className="font-medium">{correlation.factor2}</span> show a{' '}
                  <span className={`font-medium ${
                    correlation.strength === 'strong' ? 'text-success' :
                    correlation.strength === 'moderate' ? 'text-warning' :
                    'text-info'
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
