/**
 * System Metrics Component
 * Real-time system health monitoring and metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { LineChart, BarChart, MetricCard } from '../../ui/charts';
import { FadeIn, Stagger } from '../../ui/animations';
import { Button } from '../../ui';

interface SystemMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeUsers: number;
  requests: number;
  errors: number;
  responseTime: number;
}

interface SystemMetricsProps {
  className?: string;
}

const SystemMetrics: React.FC<SystemMetricsProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock real-time data - in real app, this would come from WebSocket or polling
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);

  // Generate mock data
  useEffect(() => {
    const generateMetrics = () => {
      const now = new Date();
      const data: SystemMetric[] = [];
      
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // 5-minute intervals
        data.push({
          timestamp: timestamp.toISOString(),
          cpu: Math.random() * 100,
          memory: 60 + Math.random() * 30,
          disk: 45 + Math.random() * 20,
          network: Math.random() * 1000,
          activeUsers: Math.floor(3000 + Math.random() * 1000),
          requests: Math.floor(500 + Math.random() * 200),
          errors: Math.floor(Math.random() * 10),
          responseTime: 100 + Math.random() * 100,
        });
      }
      
      setMetrics(data);
      setLastUpdated(new Date());
    };

    generateMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(generateMetrics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const currentMetrics = metrics[metrics.length - 1] || {
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    activeUsers: 0,
    requests: 0,
    errors: 0,
    responseTime: 0,
  };

  const getHealthStatus = () => {
    const { cpu, memory, errors, responseTime } = currentMetrics;
    
    if (cpu > 90 || memory > 90 || errors > 5 || responseTime > 200) {
      return { status: 'critical', color: 'red', label: 'Critical' };
    } else if (cpu > 70 || memory > 70 || errors > 2 || responseTime > 150) {
      return { status: 'warning', color: 'yellow', label: 'Warning' };
    } else {
      return { status: 'healthy', color: 'green', label: 'Healthy' };
    }
  };

  const healthStatus = getHealthStatus();

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white">
              System Metrics
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              Real-time system health and performance monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Auto Refresh Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Auto-refresh</span>
            </label>
            
            {/* Time Range Selector */}
            <div className="flex items-center space-x-1 bg-muted dark:bg-muted rounded-lg p-1">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as any)}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium transition-colors',
                    timeRange === option.value
                      ? 'bg-white dark:bg-muted text-foreground dark:text-white shadow-sm'
                      : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <Button
              onClick={() => {
                setLastUpdated(new Date());
                // Force refresh metrics
              }}
              variant="outline"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* System Status */}
      <FadeIn delay={0.1}>
        <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground dark:text-white">
              System Status
            </h3>
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-3 h-3 rounded-full',
                healthStatus.color === 'green' && 'bg-success-light0',
                healthStatus.color === 'yellow' && 'bg-warning-light0',
                healthStatus.color === 'red' && 'bg-error'
              )} />
              <span className={cn(
                'text-sm font-medium',
                healthStatus.color === 'green' && 'text-success dark:text-success-light',
                healthStatus.color === 'yellow' && 'text-warning dark:text-warning-light',
                healthStatus.color === 'red' && 'text-error dark:text-error-light'
              )}>
                {healthStatus.label}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </FadeIn>

      {/* Key Metrics */}
      <Stagger stagger={0.1} direction="up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="CPU Usage"
            value={`${Math.round(currentMetrics.cpu)}%`}
            trend={{
              value: 5,
              isPositive: false,
              label: 'vs last hour',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            }
            color={currentMetrics.cpu > 80 ? 'red' : currentMetrics.cpu > 60 ? 'yellow' : 'green'}
          />
          
          <MetricCard
            title="Memory Usage"
            value={`${Math.round(currentMetrics.memory)}%`}
            subtitle="8.2 GB / 16 GB"
            trend={{
              value: 3,
              isPositive: true,
              label: 'vs last hour',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            color={currentMetrics.memory > 80 ? 'red' : currentMetrics.memory > 60 ? 'yellow' : 'blue'}
          />
          
          <MetricCard
            title="Active Users"
            value={currentMetrics.activeUsers.toLocaleString()}
            trend={{
              value: 12,
              isPositive: true,
              label: 'vs yesterday',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            color="purple"
          />
          
          <MetricCard
            title="Response Time"
            value={`${Math.round(currentMetrics.responseTime)}ms`}
            subtitle={`${currentMetrics.errors} errors`}
            trend={{
              value: 8,
              isPositive: false,
              label: 'vs last hour',
            }}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color={currentMetrics.responseTime > 200 ? 'red' : currentMetrics.responseTime > 150 ? 'yellow' : 'green'}
          />
        </div>
      </Stagger>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage Chart */}
        <FadeIn delay={0.2}>
          <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-6">
              Resource Usage
            </h3>
            
            <LineChart
              data={metrics.map(metric => ({
                x: metric.timestamp,
                y: metric.cpu,
                label: new Date(metric.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
              }))}
              height={300}
              color="#3b82f6"
              color2="#10b981"
              color3="#f59e0b"
              showGrid={true}
              animated={true}
              legend={[
                { label: 'CPU', color: '#3b82f6' },
                { label: 'Memory', color: '#10b981' },
                { label: 'Disk', color: '#f59e0b' },
              ]}
            />
          </div>
        </FadeIn>

        {/* Network Activity */}
        <FadeIn delay={0.3}>
          <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-foreground dark:text-white mb-6">
              Network Activity
            </h3>
            
            <BarChart
              data={metrics.slice(-12).map(metric => ({
                label: new Date(metric.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                value: metric.requests,
              }))}
              height={300}
              color="#8b5cf6"
              showGrid={true}
              animated={true}
            />
          </div>
        </FadeIn>
      </div>

      {/* Detailed Metrics */}
      <FadeIn delay={0.4}>
        <div className="bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-foreground dark:text-white mb-6">
            Detailed System Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Server Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-3">
                Server Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Uptime</span>
                  <span className="text-foreground dark:text-white">15d 7h 23m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Load Average</span>
                  <span className="text-foreground dark:text-white">0.85, 0.92, 1.01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Processes</span>
                  <span className="text-foreground dark:text-white">247 running</span>
                </div>
              </div>
            </div>
            
            {/* Storage Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-3">
                Storage Usage
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Root (/)</span>
                  <span className="text-foreground dark:text-white">45.2 GB / 100 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Database</span>
                  <span className="text-foreground dark:text-white">12.8 GB / 50 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Logs</span>
                  <span className="text-foreground dark:text-white">2.1 GB / 10 GB</span>
                </div>
              </div>
            </div>
            
            {/* Network Info */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mb-3">
                Network Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Bandwidth In</span>
                  <span className="text-foreground dark:text-white">{formatBytes(currentMetrics.network * 1024)}/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Bandwidth Out</span>
                  <span className="text-foreground dark:text-white">{formatBytes(currentMetrics.network * 0.8 * 1024)}/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Connections</span>
                  <span className="text-foreground dark:text-white">{Math.floor(currentMetrics.activeUsers * 0.3)} active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default SystemMetrics;