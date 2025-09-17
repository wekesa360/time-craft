import React from 'react';
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

export const FocusAnalytics: React.FC = () => {
  // Mock data - in real app this would come from API
  const mockStats = {
    totalSessions: 47,
    totalFocusTime: 1420, // minutes
    averageRating: 7.8,
    streakDays: 12,
    completionRate: 85,
    favoriteTemplate: 'Classic Pomodoro',
    weeklyData: [
      { day: 'Mon', sessions: 3, minutes: 75 },
      { day: 'Tue', sessions: 4, minutes: 100 },
      { day: 'Wed', sessions: 2, minutes: 50 },
      { day: 'Thu', sessions: 5, minutes: 125 },
      { day: 'Fri', sessions: 3, minutes: 75 },
      { day: 'Sat', sessions: 1, minutes: 25 },
      { day: 'Sun', sessions: 2, minutes: 50 }
    ],
    templateStats: [
      { name: 'Classic Pomodoro', sessions: 25, percentage: 53 },
      { name: 'Deep Work', sessions: 12, percentage: 26 },
      { name: 'Quick Sprint', sessions: 7, percentage: 15 },
      { name: 'Extended', sessions: 3, percentage: 6 }
    ]
  };

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
              <p className="text-2xl font-bold text-foreground">{mockStats.totalSessions}</p>
              <p className="text-xs text-green-600">+12% this week</p>
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
              <p className="text-2xl font-bold text-foreground">{formatTime(mockStats.totalFocusTime)}</p>
              <p className="text-xs text-green-600">+8% this week</p>
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
              <p className="text-2xl font-bold text-foreground">{mockStats.averageRating}/10</p>
              <p className="text-xs text-green-600">+0.3 this week</p>
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
              <p className="text-2xl font-bold text-foreground">{mockStats.streakDays} days</p>
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
          {mockStats.weeklyData.map((day, index) => (
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
            {mockStats.templateStats.map((template, index) => (
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
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Great Progress!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Your focus time increased by 8% this week. Keep up the momentum!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Peak Performance
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    You're most productive on Thursdays. Consider scheduling important tasks then.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start space-x-2">
                <Activity className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Try Deep Work
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Your ratings are highest with longer sessions. Try the Deep Work template.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Trends */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Productivity Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {mockStats.completionRate}%
            </div>
            <p className="text-sm text-foreground-secondary">Completion Rate</p>
            <p className="text-xs text-green-600 mt-1">+5% from last month</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              30.2m
            </div>
            <p className="text-sm text-foreground-secondary">Avg Session Length</p>
            <p className="text-xs text-blue-600 mt-1">+2.5m from last month</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              6.7
            </div>
            <p className="text-sm text-foreground-secondary">Sessions per Day</p>
            <p className="text-xs text-purple-600 mt-1">+1.2 from last month</p>
          </div>
        </div>
      </div>
    </div>
  );
};