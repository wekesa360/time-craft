/**
 * Focus Analytics Dashboard
 * Statistics and insights for focus sessions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { LineChart, BarChart, PieChart, MetricCard } from '../../ui/charts';
import { FadeIn, Stagger } from '../../ui/animations';
import { Button } from '../../ui';

interface FocusSession {
  id: string;
  date: string;
  duration: number; // in minutes
  type: 'focus' | 'pomodoro';
  templateName: string;
  completed: boolean;
  interruptions: number;
  productivity: number; // 1-5 rating
}

interface FocusAnalyticsProps {
  sessions: FocusSession[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({
  sessions,
  className,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'duration' | 'sessions' | 'productivity'>('duration');

  // Filter sessions based on time range
  const getFilteredSessions = () => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    }[timeRange];
    
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return sessions.filter(session => new Date(session.date) >= cutoffDate);
  };

  const filteredSessions = getFilteredSessions();

  // Calculate statistics
  const stats = {
    totalSessions: filteredSessions.length,
    completedSessions: filteredSessions.filter(s => s.completed).length,
    totalFocusTime: filteredSessions.reduce((sum, s) => sum + (s.completed ? s.duration : 0), 0),
    averageSessionLength: filteredSessions.length > 0 
      ? Math.round(filteredSessions.reduce((sum, s) => sum + s.duration, 0) / filteredSessions.length)
      : 0,
    completionRate: filteredSessions.length > 0 
      ? Math.round((filteredSessions.filter(s => s.completed).length / filteredSessions.length) * 100)
      : 0,
    averageProductivity: filteredSessions.length > 0
      ? Math.round((filteredSessions.reduce((sum, s) => sum + s.productivity, 0) / filteredSessions.length) * 10) / 10
      : 0,
    totalInterruptions: filteredSessions.reduce((sum, s) => sum + s.interruptions, 0),
    averageInterruptions: filteredSessions.length > 0
      ? Math.round((filteredSessions.reduce((sum, s) => sum + s.interruptions, 0) / filteredSessions.length) * 10) / 10
      : 0,
  };

  // Prepare chart data
  const getDailyData = () => {
    const dailyData: { [key: string]: { date: string; duration: number; sessions: number; productivity: number } } = {};
    
    filteredSessions.forEach(session => {
      const date = session.date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, duration: 0, sessions: 0, productivity: 0 };
      }
      
      if (session.completed) {
        dailyData[date].duration += session.duration;
      }
      dailyData[date].sessions += 1;
      dailyData[date].productivity += session.productivity;
    });
    
    // Calculate average productivity per day
    Object.values(dailyData).forEach(day => {
      day.productivity = day.sessions > 0 ? day.productivity / day.sessions : 0;
    });
    
    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getTemplateData = () => {
    const templateStats: { [key: string]: { count: number; totalDuration: number } } = {};
    
    filteredSessions.forEach(session => {
      if (!templateStats[session.templateName]) {
        templateStats[session.templateName] = { count: 0, totalDuration: 0 };
      }
      
      templateStats[session.templateName].count += 1;
      if (session.completed) {
        templateStats[session.templateName].totalDuration += session.duration;
      }
    });
    
    return Object.entries(templateStats).map(([name, stats]) => ({
      label: name,
      value: stats.count,
      duration: stats.totalDuration,
    }));
  };

  const getHourlyData = () => {
    const hourlyStats: { [key: number]: number } = {};
    
    filteredSessions.forEach(session => {
      const hour = new Date(session.date).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });
    
    return Array.from({ length: 24 }, (_, hour) => ({
      label: `${hour.toString().padStart(2, '0')}:00`,
      value: hourlyStats[hour] || 0,
    }));
  };

  const dailyData = getDailyData();
  const templateData = getTemplateData();
  const hourlyData = getHourlyData();

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Focus Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Track your focus sessions and productivity insights
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Key Metrics */}
      <Stagger stagger={0.1} direction="up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Focus Time"
            value={formatDuration(stats.totalFocusTime)}
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs last period',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="blue"
          />
          
          <MetricCard
            title="Sessions Completed"
            value={stats.completedSessions.toString()}
            subtitle={`${stats.completionRate}% completion rate`}
            trend={{
              value: 8,
              isPositive: true,
              label: 'vs last period',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="green"
          />
          
          <MetricCard
            title="Average Session"
            value={formatDuration(stats.averageSessionLength)}
            trend={{
              value: 5,
              isPositive: true,
              label: 'vs last period',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="purple"
          />
          
          <MetricCard
            title="Productivity Score"
            value={`${stats.averageProductivity}/5`}
            subtitle={`${stats.averageInterruptions} avg interruptions`}
            trend={{
              value: 3,
              isPositive: false,
              label: 'vs last period',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="yellow"
          />
        </div>
      </Stagger>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <FadeIn delay={0.2}>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daily Trend
              </h3>
              <div className="flex items-center space-x-2">
                {(['duration', 'sessions', 'productivity'] as const).map((metric) => (
                  <Button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    variant={selectedMetric === metric ? 'default' : 'outline'}
                    size="sm"
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <LineChart
              data={dailyData.map(day => ({
                x: day.date,
                y: selectedMetric === 'duration' 
                  ? day.duration 
                  : selectedMetric === 'sessions' 
                  ? day.sessions 
                  : day.productivity,
                label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              }))}
              height={300}
              color="#3b82f6"
              showGrid={true}
              animated={true}
            />
          </div>
        </FadeIn>

        {/* Template Usage */}
        <FadeIn delay={0.3}>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Template Usage
            </h3>
            
            <PieChart
              data={templateData}
              height={300}
              showLegend={true}
              animated={true}
            />
          </div>
        </FadeIn>
      </div>

      {/* Hourly Activity & Session Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Activity */}
        <FadeIn delay={0.4}>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Activity by Hour
            </h3>
            
            <BarChart
              data={hourlyData}
              height={200}
              color="#10b981"
              showGrid={true}
              animated={true}
            />
          </div>
        </FadeIn>

        {/* Recent Sessions */}
        <FadeIn delay={0.5}>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Recent Sessions
            </h3>
            
            <div className="space-y-4">
              {filteredSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      session.completed ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.templateName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDuration(session.duration)}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i < session.productivity ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSessions.length === 0 && (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    No sessions in this time period
                  </p>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Insights */}
      <FadeIn delay={0.6}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            📊 Insights & Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.completionRate < 70 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Improve Completion Rate
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your completion rate is {stats.completionRate}%. Try shorter sessions or eliminate distractions.
                </p>
              </div>
            )}
            
            {stats.averageInterruptions > 2 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Reduce Interruptions
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You average {stats.averageInterruptions} interruptions per session. Consider using focus mode.
                </p>
              </div>
            )}
            
            {stats.averageProductivity < 3 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Boost Productivity
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your average productivity is {stats.averageProductivity}/5. Try different templates or adjust session length.
                </p>
              </div>
            )}
            
            {stats.totalFocusTime > 0 && (
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Great Progress!
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You've focused for {formatDuration(stats.totalFocusTime)} in the last {timeRange}. Keep it up!
                </p>
              </div>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default FocusAnalytics;