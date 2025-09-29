import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusQueries } from '../../../hooks/queries/useFocusQueries';
import {
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Award,
  BarChart3,
  Activity,
  Zap
} from 'lucide-react';

const FocusAnalytics: React.FC = () => {
  const { useFocusAnalyticsQuery, useFocusSessionsQuery } = useFocusQueries();

  // Get analytics data from backend
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useFocusAnalyticsQuery('7d');
  const { data: sessionsData = [], isLoading: sessionsLoading } = useFocusSessionsQuery();

  // Calculate real stats from backend data
  const calculateStats = () => {
    if (!sessionsData || sessionsData.length === 0) {
      return {
        totalSessions: 0,
        totalFocusTime: 0,
        averageRating: 0,
        streakDays: 0,
        completionRate: 0,
        favoriteTemplate: 'None',
        weeklyData: [],
        templateStats: []
      };
    }

    const totalSessions = sessionsData.length;
    const completedSessions = sessionsData.filter(s => s.completed_at);
    const totalFocusTime = completedSessions.reduce((total, session) =>
      total + (session.actual_duration || session.planned_duration || 0), 0
    );

    const sessionsWithRating = completedSessions.filter(s => s.productivity_rating);
    const averageRating = sessionsWithRating.length > 0
      ? sessionsWithRating.reduce((sum, s) => sum + (s.productivity_rating || 0), 0) / sessionsWithRating.length
      : 0;

    const completionRate = totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0;

    // Calculate weekly data
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const recentSessions = sessionsData.filter(s => s.started_at >= weekAgo);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);

      const daySessions = recentSessions.filter(s =>
        s.started_at >= dayStart && s.started_at < dayEnd
      );

      return {
        day: dayNames[new Date(dayStart).getDay()],
        sessions: daySessions.length,
        minutes: daySessions.reduce((total, s) =>
          total + (s.actual_duration || s.planned_duration || 0), 0
        )
      };
    });

    // Calculate template usage
    const templateCounts = {};
    sessionsData.forEach(session => {
      const type = session.session_type || 'unknown';
      templateCounts[type] = (templateCounts[type] || 0) + 1;
    });

    const templateStats = Object.entries(templateCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
        sessions: count as number,
        percentage: totalSessions > 0 ? Math.round(((count as number) / totalSessions) * 100) : 0
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const favoriteTemplate = templateStats.length > 0 ? templateStats[0].name : 'None';

    return {
      totalSessions,
      totalFocusTime,
      averageRating: Math.round(averageRating * 10) / 10,
      streakDays: 0, // Would need more complex calculation for streaks
      completionRate: Math.round(completionRate),
      favoriteTemplate,
      weeklyData,
      templateStats
    };
  };

  const stats = calculateStats();

  // Loading state
  if (analyticsLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Focus Analytics</h2>
        <p className="text-foreground-secondary">
          Track your productivity patterns and improve your focus habits
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Total Sessions</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
              <p className="text-xs text-green-600">Focus sessions completed</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Focus Time</p>
              <p className="text-2xl font-bold text-foreground">{formatTime(stats.totalFocusTime)}</p>
              <p className="text-xs text-green-600">Total focused time</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground">{stats.averageRating}/10</p>
              <p className="text-xs text-green-600">Average productivity rating</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Streak</p>
              <p className="text-2xl font-bold text-foreground">{stats.streakDays} days</p>
              <p className="text-xs text-orange-600">Keep it up!</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Weekly Activity</h3>
          <div className="flex items-center space-x-4 text-sm text-foreground-secondary">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary-500 rounded"></div>
              <span>Sessions</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Minutes</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {stats.weeklyData.map((day, index) => (
            <div key={day.day} className="flex items-center space-x-4">
              <div className="w-12 text-sm font-medium text-foreground-secondary">
                {day.day}
              </div>
              
              {/* Sessions Bar */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-foreground-secondary">Sessions</span>
                  <span className="text-xs font-medium text-foreground">{day.sessions}</span>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(day.sessions / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Minutes Bar */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-foreground-secondary">Minutes</span>
                  <span className="text-xs font-medium text-foreground">{day.minutes}m</span>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(day.minutes / 125) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Usage & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Usage */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Template Usage</h3>
          <div className="space-y-4">
            {stats.templateStats.map((template, index) => (
              <div key={template.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{template.name}</span>
                  <span className="text-foreground-secondary">
                    {template.sessions} sessions ({template.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-purple-500' :
                      index === 2 ? 'bg-orange-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${template.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Insights & Recommendations</h3>
          <div className="space-y-4">
            {stats.totalSessions > 0 ? (
              <>
                {stats.completionRate >= 80 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Excellent Completion Rate!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          You're completing {stats.completionRate}% of your sessions. Keep up the great work!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stats.totalFocusTime > 60 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Total Focus Time
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          You've focused for {formatTime(stats.totalFocusTime)} total. Great dedication!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {stats.favoriteTemplate !== 'None' && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start space-x-2">
                      <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          Favorite Template
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          You prefer {stats.favoriteTemplate} sessions. Consider optimizing your schedule around this.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-start space-x-2">
                  <Activity className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Get Started!
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      Start your first focus session to see personalized insights and recommendations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Productivity Trends */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Productivity Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {stats.completionRate}%
            </div>
            <p className="text-sm text-foreground-secondary">Completion Rate</p>
            <p className="text-xs text-green-600 mt-1">Keep up the great work!</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {stats.totalSessions > 0 ? formatTime(Math.round(stats.totalFocusTime / stats.totalSessions)) : '0m'}
            </div>
            <p className="text-sm text-foreground-secondary">Avg Session Length</p>
            <p className="text-xs text-blue-600 mt-1">Based on your sessions</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {stats.totalSessions > 0 ? Math.round(stats.totalSessions / 7 * 10) / 10 : '0'}
            </div>
            <p className="text-sm text-foreground-secondary">Sessions per Day</p>
            <p className="text-xs text-purple-600 mt-1">Weekly average</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusAnalytics;