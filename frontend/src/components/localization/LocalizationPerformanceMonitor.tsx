/**
 * Performance monitoring component for localization features
 * Tracks rendering performance, translation cache usage, and bundle loading times
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  useTranslationPerformance, 
  getTranslationCacheStats,
  clearTranslationCache 
} from '../../hooks/useOptimizedTranslation';
import { getTranslationCacheStats as getMainCacheStats } from '../../utils/translationCache';
import { BarChart3, Zap, Database, Clock, RefreshCw, Trash2 } from 'lucide-react';

interface PerformanceMetrics {
  renderTime: number;
  translationTime: number;
  cacheHitRate: number;
  bundleLoadTime: number;
  memoryUsage: number;
}

interface LocalizationPerformanceMonitorProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export const LocalizationPerformanceMonitor: React.FC<LocalizationPerformanceMonitorProps> = memo(({
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000,
  className = ''
}) => {
  const { t } = useTranslation();
  const { getStats, resetStats } = useTranslationPerformance();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    translationTime: 0,
    cacheHitRate: 0,
    bundleLoadTime: 0,
    memoryUsage: 0
  });
  
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    setIsCollecting(true);
    
    try {
      const startTime = performance.now();
      
      // Get translation performance stats
      const translationStats = getStats();
      
      // Get cache statistics
      const optimizedCacheStats = getTranslationCacheStats();
      const mainCacheStats = getMainCacheStats();
      
      // Measure render time
      const renderTime = performance.now() - startTime;
      
      // Calculate cache hit rate
      const totalRequests = mainCacheStats.hits + mainCacheStats.misses;
      const cacheHitRate = totalRequests > 0 ? mainCacheStats.hits / totalRequests : 0;
      
      // Estimate memory usage (approximate)
      const memoryUsage = (optimizedCacheStats.size + mainCacheStats.memoryItems) * 50; // rough estimate in bytes
      
      // Get bundle load time from performance API
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const bundleLoadTime = navigationEntries.length > 0 
        ? navigationEntries[0].loadEventEnd - navigationEntries[0].fetchStart
        : 0;
      
      setMetrics({
        renderTime,
        translationTime: translationStats.translationsPerSecond,
        cacheHitRate,
        bundleLoadTime,
        memoryUsage
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error collecting localization performance metrics:', error);
    } finally {
      setIsCollecting(false);
    }
  }, [getStats]);

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(collectMetrics, refreshInterval);
    
    // Initial collection
    collectMetrics();
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, collectMetrics]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    collectMetrics();
  }, [collectMetrics]);

  // Reset all performance data
  const handleReset = useCallback(() => {
    resetStats();
    clearTranslationCache();
    collectMetrics();
  }, [resetStats, collectMetrics]);

  // Format metrics for display
  const formatTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  // Performance status indicator
  const getPerformanceStatus = () => {
    if (metrics.cacheHitRate > 0.8 && metrics.renderTime < 16) return 'excellent';
    if (metrics.cacheHitRate > 0.6 && metrics.renderTime < 32) return 'good';
    if (metrics.cacheHitRate > 0.4 && metrics.renderTime < 50) return 'fair';
    return 'poor';
  };

  const performanceStatus = getPerformanceStatus();
  const statusColors = {
    excellent: 'text-success bg-success-light border-green-200',
    good: 'text-info bg-info-light border-blue-200',
    fair: 'text-warning bg-warning-light border-yellow-200',
    poor: 'text-error bg-error-light border-red-200'
  };

  if (!showDetails) {
    // Compact view
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[performanceStatus]}`}>
          {t(`performance.status.${performanceStatus}`, performanceStatus)}
        </div>
        <span className="text-xs text-foreground-secondary">
          {formatPercentage(metrics.cacheHitRate)} cache hit
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-muted rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-foreground">
            {t('performance.localizationMetrics', 'Localization Performance')}
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isCollecting}
            className="p-2 text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground transition-colors disabled:opacity-50"
            title={t('performance.refresh', 'Refresh metrics')}
          >
            <RefreshCw className={`w-4 h-4 ${isCollecting ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 text-error-light0 hover:text-error dark:text-error-light dark:hover:text-error-light transition-colors"
            title={t('performance.reset', 'Reset metrics')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className={`mb-4 p-3 rounded-lg border ${statusColors[performanceStatus]}`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {t('performance.overallStatus', 'Overall Status')}: {t(`performance.status.${performanceStatus}`, performanceStatus)}
          </span>
          <span className="text-xs">
            {t('performance.lastUpdated', 'Last updated')}: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-muted dark:bg-muted p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-info-light0" />
            <span className="text-sm font-medium text-foreground">
              {t('performance.renderTime', 'Render Time')}
            </span>
          </div>
          <div className="text-lg font-bold text-info dark:text-info">
            {formatTime(metrics.renderTime)}
          </div>
        </div>

        <div className="bg-muted dark:bg-muted p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Zap className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-foreground">
              {t('performance.cacheHitRate', 'Cache Hit Rate')}
            </span>
          </div>
          <div className="text-lg font-bold text-success dark:text-success-light">
            {formatPercentage(metrics.cacheHitRate)}
          </div>
        </div>

        <div className="bg-muted dark:bg-muted p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Database className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-foreground">
              {t('performance.memoryUsage', 'Memory Usage')}
            </span>
          </div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatBytes(metrics.memoryUsage)}
          </div>
        </div>

        <div className="bg-muted dark:bg-muted p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {t('performance.bundleLoadTime', 'Bundle Load')}
            </span>
          </div>
          <div className="text-lg font-bold text-primary dark:text-primary-400">
            {formatTime(metrics.bundleLoadTime)}
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      {performanceStatus === 'poor' && (
        <div className="bg-warning-light dark:bg-warning border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-warning dark:text-warning-light mb-2">
            {t('performance.improvementTips', 'Performance Improvement Tips')}:
          </h4>
          <ul className="text-xs text-warning dark:text-warning-light space-y-1">
            <li>• {t('performance.tip1', 'Enable translation caching in settings')}</li>
            <li>• {t('performance.tip2', 'Preload frequently used translations')}</li>
            <li>• {t('performance.tip3', 'Clear cache if experiencing issues')}</li>
            <li>• {t('performance.tip4', 'Use lazy loading for heavy components')}</li>
          </ul>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="flex items-center justify-center mt-3 text-xs text-foreground-secondary">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success-light0 rounded-full animate-pulse"></div>
            <span>
              {t('performance.autoRefresh', 'Auto-refreshing every {{interval}}s', { 
                interval: refreshInterval / 1000 
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

LocalizationPerformanceMonitor.displayName = 'LocalizationPerformanceMonitor';