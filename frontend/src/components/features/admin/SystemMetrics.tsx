import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface MetricData {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface SystemMetricsProps {
  className?: string;
}

// Mock real-time data
const generateMockMetrics = (): Record<string, MetricData> => ({
  cpu: {
    label: 'CPU Usage',
    value: Math.random() * 100,
    unit: '%',
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.random() * 10,
    status: Math.random() > 0.8 ? 'warning' : 'healthy'
  },
  memory: {
    label: 'Memory Usage',
    value: 60 + Math.random() * 30,
    unit: '%',
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.random() * 5,
    status: 'healthy'
  },
  disk: {
    label: 'Disk Usage',
    value: 45 + Math.random() * 20,
    unit: '%',
    trend: 'up',
    trendValue: Math.random() * 2,
    status: 'healthy'
  },
  network: {
    label: 'Network I/O',
    value: Math.random() * 1000,
    unit: 'MB/s',
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.random() * 100,
    status: 'healthy'
  },
  responseTime: {
    label: 'Avg Response Time',
    value: 100 + Math.random() * 200,
    unit: 'ms',
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.random() * 50,
    status: Math.random() > 0.9 ? 'warning' : 'healthy'
  },
  errorRate: {
    label: 'Error Rate',
    value: Math.random() * 5,
    unit: '%',
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.random() * 1,
    status: Math.random() > 0.8 ? 'critical' : 'healthy'
  }
});

const SystemMetrics: React.FC<SystemMetricsProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<Record<string, MetricData>>(generateMockMetrics());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(generateMockMetrics());
      setLastUpdated(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMetrics(generateMockMetrics());
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'cpu': return <Cpu className="w-6 h-6" />;
      case 'memory': return <Server className="w-6 h-6" />;
      case 'disk': return <HardDrive className="w-6 h-6" />;
      case 'network': return <Wifi className="w-6 h-6" />;
      case 'responseTime': return <Clock className="w-6 h-6" />;
      case 'errorRate': return <AlertTriangle className="w-6 h-6" />;
      default: return <BarChart3 className="w-6 h-6" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('admin.metrics.title', 'System Metrics')}
          </h2>
          <p className="text-foreground-secondary mt-1">
            {t('admin.metrics.subtitle', 'Real-time system performance monitoring')}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-foreground-secondary">
            {t('admin.metrics.lastUpdated', 'Last updated')}: {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{t('admin.metrics.refresh', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getStatusColor(metric.status).replace('text-', 'bg-').replace('-500', '-100')} dark:${getStatusColor(metric.status).replace('text-', 'bg-').replace('-500', '-900')}`}>
                  {getMetricIcon(key)}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">
                    {t(`admin.metrics.${key}`, metric.label)}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(metric.status)}
                    <span className={`text-xs ${getStatusColor(metric.status)}`}>
                      {t(`admin.metrics.status.${metric.status}`, metric.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-foreground">
                  {metric.value.toFixed(key === 'errorRate' ? 2 : 0)}
                </span>
                <span className="text-sm text-foreground-secondary">
                  {metric.unit}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className={metric.trend === 'up' ? 'text-red-500' : 'text-green-500'}>
                    {metric.trendValue.toFixed(1)}{metric.unit}
                  </span>
                </div>
                <span className="text-foreground-secondary">
                  {t('admin.metrics.vs24h', 'vs 24h ago')}
                </span>
              </div>

              {/* Progress bar for percentage metrics */}
              {metric.unit === '%' && (
                <div className="w-full bg-background-secondary rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      metric.status === 'critical' ? 'bg-red-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* System Health Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          {t('admin.metrics.healthSummary', 'System Health Summary')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="font-medium text-foreground mb-1">
              {Object.values(metrics).filter(m => m.status === 'healthy').length}
            </h4>
            <p className="text-sm text-green-500">
              {t('admin.metrics.healthyServices', 'Healthy Services')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <h4 className="font-medium text-foreground mb-1">
              {Object.values(metrics).filter(m => m.status === 'warning').length}
            </h4>
            <p className="text-sm text-yellow-500">
              {t('admin.metrics.warningServices', 'Warning Services')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="font-medium text-foreground mb-1">
              {Object.values(metrics).filter(m => m.status === 'critical').length}
            </h4>
            <p className="text-sm text-red-500">
              {t('admin.metrics.criticalServices', 'Critical Services')}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Data Placeholder */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          {t('admin.metrics.historicalData', 'Historical Data')}
        </h3>
        
        <div className="bg-background-secondary rounded-lg p-8 text-center">
          <BarChart3 className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <h4 className="font-medium text-foreground mb-2">
            {t('admin.metrics.chartsComingSoon', 'Charts Coming Soon')}
          </h4>
          <p className="text-foreground-secondary">
            {t('admin.metrics.chartsDescription', 'Historical performance charts and trends will be displayed here.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;