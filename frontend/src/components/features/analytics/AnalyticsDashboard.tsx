import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  MetricCard, 
  ProgressRing 
} from '../../ui/charts';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';
import { useAnalyticsQueries } from '../../../hooks/queries/useAnalyticsQueries';

interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  category?: 'all' | 'tasks' | 'health' | 'focus' | 'social';
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '30d',
  category = 'all'
}) => {
  const { t } = useTranslation();
  const { announce } = useAccessibilityContext();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedCategory, setSelectedCategory] = useState(category);

  // Analytics queries
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    error: dashboardError 
  } = useAnalyticsQueries.useDashboardData(selectedTimeRange, selectedCategory);

  const { 
    data: taskAnalytics, 
    isLoading: taskLoading 
  } = useAnalyticsQueries.useTaskAnalytics(selectedTimeRange);

  const { 
    data: healthAnalytics, 
    isLoading: healthLoading 
  } = useAnalyticsQueries.useHealthAnalytics(selectedTimeRange);

  const { 
    data: focusAnalytics, 
    isLoading: focusLoading 
  } = useAnalyticsQueries.useFocusAnalytics(selectedTimeRange);

  const { 
    data: socialAnalytics, 
    isLoading: socialLoading 
  } = useAnalyticsQueries.useSocialAnalytics(selectedTimeRange);

  // Announce page changes to screen readers
  useEffect(() => {
    announce(`Analytics dashboard loaded for ${selectedTimeRange} time range`);
  }, [selectedTimeRange, announce]);

  const handleTimeRangeChange = (newRange: '7d' | '30d' | '90d' | '1y') => {
    setSelectedTimeRange(newRange);
    announce(`Time range changed to ${newRange}`);
  };

  const handleCategoryChange = (newCategory: 'all' | 'tasks' | 'health' | 'focus' | 'social') => {
    setSelectedCategory(newCategory);
    announce(`Category changed to ${newCategory}`);
  };

  if (dashboardLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading analytics dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          {t('analytics.error.title')}
        </h2>
        <p className="text-red-600 dark:text-red-300">
          {t('analytics.error.message')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Analytics Dashboard">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.subtitle')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Range Selector */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-pressed={selectedTimeRange === range}
                aria-label={`Select ${range} time range`}
              >
                {t(`analytics.timeRange.${range}`)}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Select analytics category"
          >
            <option value="all">{t('analytics.categories.all')}</option>
            <option value="tasks">{t('analytics.categories.tasks')}</option>
            <option value="health">{t('analytics.categories.health')}</option>
            <option value="focus">{t('analytics.categories.focus')}</option>
            <option value="social">{t('analytics.categories.social')}</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t('analytics.metrics.totalTasks')}
          value={dashboardData?.totalTasks || 0}
          trend={{
            value: dashboardData?.taskChange || 0,
            isPositive: (dashboardData?.taskChange || 0) >= 0
          }}
          icon="📝"
          color="blue"
        />
        <MetricCard
          title={t('analytics.metrics.completedTasks')}
          value={dashboardData?.completedTasks || 0}
          trend={{
            value: dashboardData?.completionChange || 0,
            isPositive: (dashboardData?.completionChange || 0) >= 0
          }}
          icon="✅"
          color="green"
        />
        <MetricCard
          title={t('analytics.metrics.focusSessions')}
          value={dashboardData?.focusSessions || 0}
          trend={{
            value: dashboardData?.focusChange || 0,
            isPositive: (dashboardData?.focusChange || 0) >= 0
          }}
          icon="🎯"
          color="purple"
        />
        <MetricCard
          title={t('analytics.metrics.productivityScore')}
          value={dashboardData?.productivityScore || 0}
          trend={{
            value: dashboardData?.productivityChange || 0,
            isPositive: (dashboardData?.productivityChange || 0) >= 0
          }}
          icon="📊"
          color="yellow"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.taskCompletion.title')}
          </h3>
          <LineChart
            data={(taskAnalytics?.completionTrend || []).map((item: any) => ({
              x: item.date,
              y: item.completed
            }))}
            height={300}
            color="#3B82F6"
          />
        </div>

        {/* Health Metrics Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.healthDistribution.title')}
          </h3>
          <PieChart
            data={(healthAnalytics?.distribution || []).map((item: any) => ({
              label: item.category,
              value: item.value
            }))}
            height={300}
          />
        </div>

        {/* Focus Session Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.focusDuration.title')}
          </h3>
          <BarChart
            data={(focusAnalytics?.durationDistribution || []).map((item: any) => ({
              label: item.duration,
              value: item.sessions
            }))}
            height={300}
            colors={["#8B5CF6"]}
          />
        </div>

        {/* Social Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.socialActivity.title')}
          </h3>
          <BarChart
            data={(socialAnalytics?.activity || []).map((item: any) => ({
              label: item.date,
              value: item.interactions
            }))}
            height={300}
            colors={["#10B981"]}
          />
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Score Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.productivityBreakdown.title')}
          </h3>
          <div className="space-y-4">
            {dashboardData?.productivityBreakdown?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {item.category}
                </span>
                <div className="flex items-center gap-2">
                  <ProgressRing
                    progress={item.score}
                    size={40}
                    strokeWidth={4}
                    color={item.color}
                    aria-label={`${item.category} productivity score: ${item.score}%`}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.timeDistribution.title')}
          </h3>
          <PieChart
            data={(dashboardData?.timeDistribution || []).map((item: any) => ({
              label: item.activity,
              value: item.hours
            }))}
            height={250}
          />
        </div>

        {/* Goal Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.charts.goalProgress.title')}
          </h3>
          <div className="space-y-4">
            {dashboardData?.goalProgress?.map((goal, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    {goal.name}
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                    aria-label={`${goal.name} progress: ${goal.progress}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
