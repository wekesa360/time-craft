import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth';
import { useTheme } from '../hooks/useTheme';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { 
  CheckSquare, 
  Heart, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Clock,
  Zap,
  Plus,
  Play,
  Activity,
  Users,
  Mic,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Query hooks for real-time data
import { useQuery } from '@tanstack/react-query';
import { useTaskQueries } from '../hooks/queries/useTaskQueries';
import { useHealthQueries } from '../hooks/queries/useHealthQueries';
import { useFocusQueries } from '../hooks/queries/useFocusQueries';
import { useBadgeQueries } from '../hooks/queries/useBadgeQueries';
import { useSocialQueries } from '../hooks/queries/useSocialQueries';
import { useCalendarQueries } from '../hooks/queries/useCalendarQueries';
import { apiClient } from '../lib/api';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';

// Components
import { MetricCard } from '../components/ui/charts/MetricCard';
import { ProgressRing } from '../components/ui/charts/ProgressRing';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const { mode, colorTheme, isDark } = useTheme();

  // Real-time data queries
  const { data: taskStats, isLoading: taskStatsLoading } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => apiClient.getTaskStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: matrixData, isLoading: matrixLoading } = useQuery({
    queryKey: ['eisenhower-matrix'],
    queryFn: () => apiClient.getEisenhowerMatrix(),
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: healthSummary, isLoading: healthLoading } = useQuery({
    queryKey: ['health-summary'],
    queryFn: () => apiClient.getHealthSummary(7), // Last 7 days
    refetchInterval: 60000,
  });

  const { data: focusAnalytics, isLoading: focusLoading } = useQuery({
    queryKey: ['focus-analytics'],
    queryFn: () => apiClient.getFocusAnalytics('7d'),
    refetchInterval: 60000,
  });

  const { data: badgeData, isLoading: badgesLoading } = useQuery({
    queryKey: ['user-badges'],
    queryFn: () => apiClient.getBadges(),
    refetchInterval: 120000, // Refetch every 2 minutes
  });

  const { data: socialFeed, isLoading: socialLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => apiClient.getActivityFeed(),
    refetchInterval: 60000,
  });

  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => {
      const today = Date.now();
      const endOfWeek = today + (7 * 24 * 60 * 60 * 1000);
      return apiClient.getEvents({ start: today, end: endOfWeek });
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const { data: recentTasks, isLoading: recentTasksLoading } = useQuery({
    queryKey: ['recent-tasks'],
    queryFn: () => apiClient.getTasks({ limit: 5, status: 'completed' }),
    refetchInterval: 60000,
  });

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => apiClient.getDashboardData(),
    refetchInterval: 30000,
  });

  // Helper functions
  const getTimeAgo = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: i18n.language === 'de' ? de : undefined,
    });
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) return { icon: ArrowUp, color: 'text-success', text: '+' };
    if (current < previous) return { icon: ArrowDown, color: 'text-error', text: '-' };
    return { icon: Minus, color: 'text-foreground-secondary', text: '' };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const isLoading = taskStatsLoading || healthLoading || focusLoading || badgesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-background-tertiary rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-background-tertiary rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-background-tertiary rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-background-tertiary rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-background-tertiary rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-foreground-secondary">
              Here's what's happening with your productivity today
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="text-right">
              <p className="text-sm text-foreground-secondary">Current theme</p>
              <p className="text-lg font-semibold text-primary-600 capitalize">
                {colorTheme} • {mode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Today's Tasks</p>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-success">+2 from yesterday</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-950 rounded-lg">
              <CheckSquare className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-accent-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Focus Time</p>
              <p className="text-2xl font-bold text-foreground">2h 45m</p>
              <p className="text-xs text-success">+15m from yesterday</p>
            </div>
            <div className="p-3 bg-accent-100 dark:bg-accent-950 rounded-lg">
              <Target className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Health Score</p>
              <p className="text-2xl font-bold text-foreground">85%</p>
              <p className="text-xs text-success">+5% this week</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">Streak</p>
              <p className="text-2xl font-bold text-foreground">7 days</p>
              <p className="text-xs text-warning">Keep it up!</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
            <button className="btn-ghost text-sm">View all</button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-background-secondary rounded-lg">
              <div className="p-2 bg-primary-100 dark:bg-primary-950 rounded-lg">
                <CheckSquare className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Completed "Review project proposal"</p>
                <p className="text-xs text-foreground-secondary">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-background-secondary rounded-lg">
              <div className="p-2 bg-accent-100 dark:bg-accent-950 rounded-lg">
                <Target className="w-4 h-4 text-accent-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Started focus session</p>
                <p className="text-xs text-foreground-secondary">1 hour ago</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-background-secondary rounded-lg">
              <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                <Heart className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Logged health metrics</p>
                <p className="text-xs text-foreground-secondary">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Theme Demo */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="btn-primary w-full justify-start">
                <CheckSquare className="w-4 h-4 mr-2" />
                Add Task
              </button>
              <button className="btn-secondary w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Start Focus
              </button>
              <button className="btn-outline w-full justify-start">
                <Heart className="w-4 h-4 mr-2" />
                Log Health
              </button>
            </div>
          </div>

          {/* Theme Showcase */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Theme Showcase</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <span className="badge-primary">Primary</span>
                <span className="badge-success">Success</span>
                <span className="badge-warning">Warning</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Progress</span>
                  <span className="text-foreground">75%</span>
                </div>
                <div className="w-full bg-background-tertiary rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <input 
                className="input w-full text-sm" 
                placeholder="Theme-aware input" 
                readOnly 
              />
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Upcoming</h3>
              <Calendar className="w-5 h-5 text-foreground-secondary" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Team meeting</p>
                  <p className="text-xs text-foreground-secondary">Today, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Project deadline</p>
                  <p className="text-xs text-foreground-secondary">Tomorrow, 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Insights Summary */}
      {healthSummary && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t('health.weeklyStats')}</h2>
            <Link to="/health" className="btn-ghost text-sm">{t('common.viewAll')}</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{healthSummary.exerciseCount}</div>
              <div className="text-sm text-foreground-secondary">{t('health.exercise')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthSummary.nutritionCount}</div>
              <div className="text-sm text-foreground-secondary">{t('health.nutrition')}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.round(healthSummary.moodAverage * 10) / 10}</div>
              <div className="text-sm text-foreground-secondary">{t('health.mood')}</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{Math.round(healthSummary.hydrationTotal / 1000 * 10) / 10}L</div>
              <div className="text-sm text-foreground-secondary">{t('health.hydration')}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}