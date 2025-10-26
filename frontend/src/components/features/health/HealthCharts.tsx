/**
 * Health Charts Component
 * Data visualization for health metrics over time
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { LineChart, BarChart, AreaChart } from '../../ui/charts';
import { Button } from '../../ui';
import { FadeIn, Stagger } from '../../ui/animations';

interface HealthMetric {
  date: string;
  weight?: number;
  steps?: number;
  sleep?: number;
  water?: number;
  mood?: number;
  energy?: number;
  stress?: number;
  exercise?: number;
}

interface HealthChartsProps {
  data: HealthMetric[];
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  className?: string;
}

type ChartType = 'weight' | 'steps' | 'sleep' | 'water' | 'mood' | 'energy' | 'stress' | 'exercise';

const chartConfigs = {
  weight: {
    title: 'Weight Tracking',
    unit: 'kg',
    color: '#3b82f6',
    icon: '⚖️',
    type: 'line' as const,
    target: 70, // Example target
  },
  steps: {
    title: 'Daily Steps',
    unit: 'steps',
    color: '#10b981',
    icon: '👟',
    type: 'bar' as const,
    target: 10000,
  },
  sleep: {
    title: 'Sleep Duration',
    unit: 'hours',
    color: '#8b5cf6',
    icon: '😴',
    type: 'area' as const,
    target: 8,
  },
  water: {
    title: 'Water Intake',
    unit: 'glasses',
    color: '#06b6d4',
    icon: '💧',
    type: 'bar' as const,
    target: 8,
  },
  mood: {
    title: 'Mood Rating',
    unit: '/10',
    color: '#f59e0b',
    icon: '😊',
    type: 'line' as const,
    target: 7,
  },
  energy: {
    title: 'Energy Level',
    unit: '/10',
    color: '#ef4444',
    icon: '⚡',
    type: 'line' as const,
    target: 7,
  },
  stress: {
    title: 'Stress Level',
    unit: '/10',
    color: '#f97316',
    icon: '😰',
    type: 'line' as const,
    target: 3, // Lower is better for stress
    inverted: true,
  },
  exercise: {
    title: 'Exercise Minutes',
    unit: 'minutes',
    color: '#84cc16',
    icon: '💪',
    type: 'bar' as const,
    target: 30,
  },
};

const timeRangeOptions = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

const HealthCharts: React.FC<HealthChartsProps> = ({
  data,
  timeRange = '30d',
  onTimeRangeChange,
  className,
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<ChartType[]>(['weight', 'steps', 'sleep', 'mood']);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [focusedMetric, setFocusedMetric] = useState<ChartType>('weight');

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    }[timeRange];
    
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  const toggleMetric = (metric: ChartType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeRange === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeRange === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const getChartData = (metric: ChartType) => {
    return filteredData
      .filter(item => item[metric] !== undefined)
      .map(item => ({
        label: formatDate(item.date),
        value: item[metric] || 0,
      }));
  };

  const getMetricStats = (metric: ChartType) => {
    const values = filteredData
      .map(item => item[metric])
      .filter(val => val !== undefined) as number[];
    
    if (values.length === 0) return null;

    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    const target = chartConfigs[metric].target;
    
    return { avg, min, max, latest, target, count: values.length };
  };

  const renderChart = (metric: ChartType) => {
    const config = chartConfigs[metric];
    const chartData = getChartData(metric);
    const stats = getMetricStats(metric);
    
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground dark:text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">{config.icon}</div>
            <p>No {config.title.toLowerCase()} data available</p>
          </div>
        </div>
      );
    }

    const ChartComponent = config.type === 'line' ? LineChart : 
                          config.type === 'bar' ? BarChart : AreaChart;

    return (
      <div className="space-y-4">
        {/* Chart */}
        <ChartComponent
          data={chartData}
          height={viewMode === 'single' ? 400 : 200}
          color={config.color}
          showGrid={true}
          animated={true}
          targetLine={config.target}
        />
        
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-foreground dark:text-white">
                {stats.latest.toFixed(1)}{config.unit}
              </div>
              <div className="text-muted-foreground dark:text-muted-foreground">Latest</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground dark:text-white">
                {stats.avg.toFixed(1)}{config.unit}
              </div>
              <div className="text-muted-foreground dark:text-muted-foreground">Average</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground dark:text-white">
                {stats.min.toFixed(1)} - {stats.max.toFixed(1)}{config.unit}
              </div>
              <div className="text-muted-foreground dark:text-muted-foreground">Range</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'font-semibold',
                (config.inverted ? stats.avg <= stats.target : stats.avg >= stats.target)
                  ? 'text-success dark:text-success-light'
                  : 'text-error dark:text-error-light'
              )}>
                {((config.inverted ? stats.target / stats.avg : stats.avg / stats.target) * 100).toFixed(0)}%
              </div>
              <div className="text-muted-foreground dark:text-muted-foreground">Target</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Controls */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white">Health Trends</h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Visualize your health metrics over time
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => onTimeRangeChange?.(option.value as any)}
                  variant={timeRange === option.value ? 'default' : 'outline'}
                  size="sm"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </Button>
              <Button
                onClick={() => setViewMode('single')}
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Metric Selector */}
      <FadeIn delay={0.1}>
        <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-foreground dark:text-white mb-3">Select Metrics</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(chartConfigs).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  if (viewMode === 'single') {
                    setFocusedMetric(key as ChartType);
                  } else {
                    toggleMetric(key as ChartType);
                  }
                }}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200',
                  (viewMode === 'single' ? focusedMetric === key : selectedMetrics.includes(key as ChartType))
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                )}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm font-medium">{config.title}</span>
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Charts */}
      {viewMode === 'grid' ? (
        <Stagger stagger={0.1} direction="up">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedMetrics.map((metric) => (
              <motion.div
                key={metric}
                className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">{chartConfigs[metric].icon}</span>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white">
                    {chartConfigs[metric].title}
                  </h3>
                </div>
                {renderChart(metric)}
              </motion.div>
            ))}
          </div>
        </Stagger>
      ) : (
        <FadeIn delay={0.2}>
          <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-3xl">{chartConfigs[focusedMetric].icon}</span>
              <h3 className="text-2xl font-semibold text-foreground dark:text-white">
                {chartConfigs[focusedMetric].title}
              </h3>
            </div>
            {renderChart(focusedMetric)}
          </div>
        </FadeIn>
      )}

      {/* Summary Insights */}
      <FadeIn delay={0.3}>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-info dark:text-info-light mb-4">
            📊 Health Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedMetrics.slice(0, 4).map((metric) => {
              const stats = getMetricStats(metric);
              const config = chartConfigs[metric];
              
              if (!stats) return null;
              
              const isOnTarget = config.inverted 
                ? stats.avg <= config.target 
                : stats.avg >= config.target;
              
              return (
                <div key={metric} className="bg-white/50 dark:bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <h4 className="font-medium text-info dark:text-info-light">
                      {config.title}
                    </h4>
                  </div>
                  <p className="text-sm text-info dark:text-info-light">
                    {isOnTarget ? (
                      `Great job! You're ${config.inverted ? 'keeping' : 'meeting'} your ${config.title.toLowerCase()} target.`
                    ) : (
                      `You're ${((config.inverted ? config.target / stats.avg : stats.avg / config.target) * 100).toFixed(0)}% of your target. ${
                        config.inverted ? 'Try to reduce' : 'Try to increase'
                      } your ${config.title.toLowerCase()}.`
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default HealthCharts;