import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Activity,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Search,
  Calendar,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useAccessibilityContext } from '../../accessibility/AccessibilityProvider';
import { useAdminQueries } from '../../../hooks/queries/useAdminQueries';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_change' | 'data_access' | 'api_access' | 'system_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user: {
    id: string;
    email: string;
    name: string;
  };
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
  };
  details: {
    action: string;
    resource?: string;
    oldValue?: string;
    newValue?: string;
    reason?: string;
  };
  status: 'success' | 'failed' | 'blocked';
}

interface SecurityDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '90d';
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  timeRange = '7d'
}) => {
  const { t } = useTranslation();
  const { announce } = useAccessibilityContext();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  // Security analytics queries
  const { 
    data: securityEvents, 
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useAdminQueries.useSecurityEvents(selectedTimeRange, {
    severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
    search: searchQuery || undefined
  });

  const { 
    data: securityStats, 
    isLoading: statsLoading 
  } = useAdminQueries.useSecurityStats(selectedTimeRange);

  const { 
    data: threatIntelligence, 
    isLoading: threatLoading 
  } = useAdminQueries.useThreatIntelligence(selectedTimeRange);

  const { 
    data: complianceReport, 
    isLoading: complianceLoading 
  } = useAdminQueries.useComplianceReport(selectedTimeRange);

  // Announce page changes to screen readers
  useEffect(() => {
    announce(`Security dashboard loaded for ${selectedTimeRange} time range`);
  }, [selectedTimeRange, announce]);

  const handleTimeRangeChange = (newRange: '24h' | '7d' | '30d' | '90d') => {
    setSelectedTimeRange(newRange);
    announce(`Time range changed to ${newRange}`);
  };

  const handleSeverityFilter = (severity: string) => {
    setSelectedSeverity(severity);
    announce(`Severity filter changed to ${severity}`);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    announce(`Event type filter changed to ${type}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    announce(`Search query updated`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'blocked': return <Lock className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <User className="w-4 h-4" />;
      case 'logout': return <User className="w-4 h-4" />;
      case 'failed_login': return <AlertTriangle className="w-4 h-4" />;
      case 'password_change': return <Key className="w-4 h-4" />;
      case 'permission_change': return <Shield className="w-4 h-4" />;
      case 'data_access': return <Database className="w-4 h-4" />;
      case 'api_access': return <Server className="w-4 h-4" />;
      case 'system_event': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (eventsLoading || statsLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading security dashboard">
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

  if (eventsError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          {t('security.error.title')}
        </h2>
        <p className="text-red-600 dark:text-red-300">
          {t('security.error.message')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Security Dashboard">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('security.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('security.subtitle')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Range Selector */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
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
                {t(`security.timeRange.${range}`)}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetchEvents()}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            aria-label="Refresh security data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('security.metrics.totalEvents')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {securityStats?.totalEvents || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('security.metrics.criticalAlerts')}
              </p>
              <p className="text-2xl font-bold text-red-600">
                {securityStats?.criticalAlerts || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('security.metrics.failedLogins')}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {securityStats?.failedLogins || 0}
              </p>
            </div>
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('security.metrics.blockedIPs')}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {securityStats?.blockedIPs || 0}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('security.search.placeholder')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search security events"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => handleSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by severity"
          >
            <option value="all">{t('security.filters.allSeverities')}</option>
            <option value="critical">{t('security.filters.critical')}</option>
            <option value="high">{t('security.filters.high')}</option>
            <option value="medium">{t('security.filters.medium')}</option>
            <option value="low">{t('security.filters.low')}</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => handleTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by event type"
          >
            <option value="all">{t('security.filters.allTypes')}</option>
            <option value="login">{t('security.filters.login')}</option>
            <option value="logout">{t('security.filters.logout')}</option>
            <option value="failed_login">{t('security.filters.failedLogin')}</option>
            <option value="password_change">{t('security.filters.passwordChange')}</option>
            <option value="permission_change">{t('security.filters.permissionChange')}</option>
            <option value="data_access">{t('security.filters.dataAccess')}</option>
            <option value="api_access">{t('security.filters.apiAccess')}</option>
            <option value="system_event">{t('security.filters.systemEvent')}</option>
          </select>

          {/* Export Button */}
          <button
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            aria-label="Export security events"
          >
            <Download className="w-4 h-4" />
            {t('security.export')}
          </button>
        </div>
      </div>

      {/* Security Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('security.events.title')}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.severity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.timestamp')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.ipAddress')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('security.events.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {securityEvents?.events?.map((event: SecurityEvent) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getEventIcon(event.type)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {t(`security.eventTypes.${event.type}`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {event.user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {event.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                      {t(`security.severity.${event.severity}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(event.status)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {t(`security.status.${event.status}`)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {event.ipAddress}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      aria-label={`View details for ${event.type} event`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('security.eventDetails.title')}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close event details"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('security.eventDetails.basicInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {t(`security.eventTypes.${selectedEvent.type}`)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Severity:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedEvent.severity)}`}>
                      {t(`security.severity.${selectedEvent.severity}`)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {t(`security.status.${selectedEvent.status}`)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatTimestamp(selectedEvent.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('security.eventDetails.userInfo')}
                </h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEvent.user.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEvent.user.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">IP Address:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEvent.ipAddress}
                    </span>
                  </div>
                  {selectedEvent.location && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Location:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedEvent.location.city}, {selectedEvent.location.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('security.eventDetails.details')}
                </h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Action:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {selectedEvent.details.action}
                    </span>
                  </div>
                  {selectedEvent.details.resource && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Resource:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedEvent.details.resource}
                      </span>
                    </div>
                  )}
                  {selectedEvent.details.reason && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Reason:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {selectedEvent.details.reason}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
