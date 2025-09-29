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
    queryFn: async () => {
      try {
        const feed = await apiClient.getActivityFeed();
        return feed || []; // Return empty array if undefined
      } catch (error) {
        console.error('Failed to fetch activity feed:', error);
        return []; // Return empty array on error
      }
    },
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

  // Quick action handlers
  const handleAddTask = () => {
    // Navigate to tasks page or open task creation modal
    window.location.href = '/tasks?action=create';
  };

  const handleStartFocus = () => {
    // Navigate to focus page
    window.location.href = '/focus';
  };

  const handleLogHealth = () => {
    // Navigate to health page
    window.location.href = '/health';
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
              {t('dashboard.welcome')}, {user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-foreground-secondary">
              {t('dashboard.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">{t('dashboard.todaysTasks')}</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-950 rounded-lg">
              <CheckSquare className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-accent-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">{t('dashboard.focusTime')}</p>
              <p className="text-2xl font-bold text-foreground">2h 45m</p>
            </div>
            <div className="p-3 bg-accent-100 dark:bg-accent-950 rounded-lg">
              <Target className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">{t('dashboard.healthScore')}</p>
              <p className="text-2xl font-bold text-foreground">85%</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground-secondary">{t('dashboard.streak')}</p>
              <p className="text-2xl font-bold text-foreground">7 days</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">{t('dashboard.quickActions')}</h3>
          <div className="space-y-4">
            <button 
              onClick={handleAddTask}
              className="group relative overflow-hidden rounded-lg border border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-4 w-full text-center transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <p className="font-medium text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{t('dashboard.actions.addTask')}</p>
            </button>

            <button 
              onClick={handleStartFocus}
              className="group relative overflow-hidden rounded-lg border border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-4 w-full text-center transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <p className="font-medium text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{t('dashboard.actions.startFocus')}</p>
            </button>

            <button 
              onClick={handleLogHealth}
              className="group relative overflow-hidden rounded-lg border border-green-200 dark:border-green-700 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-4 w-full text-center transition-all duration-200 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <p className="font-medium text-foreground group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">{t('dashboard.actions.logHealth')}</p>
            </button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('dashboard.upcomingEvents')}</h3>
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
  );
}