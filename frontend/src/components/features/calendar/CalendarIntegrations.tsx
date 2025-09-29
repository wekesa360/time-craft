import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../../lib/api';
import {
  Calendar,
  Settings,
  Link,
  Check,
  X,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface CalendarIntegration {
  id: string;
  name: string;
  type: 'google' | 'outlook' | 'apple' | 'exchange';
  email: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  syncEnabled: boolean;
  calendarCount: number;
}

const CalendarIntegrations: React.FC = () => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing integrations on mount
  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      const connections = await apiClient.getCalendarIntegrations();
      const formattedIntegrations: CalendarIntegration[] = connections.map(conn => ({
        id: conn.id,
        name: `${conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1)} Calendar`,
        type: conn.provider,
        email: conn.calendarName || conn.provider_email || 'Connected',
        status: conn.isActive ? 'connected' : 'disconnected',
        lastSync: conn.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : undefined,
        syncEnabled: conn.syncSettings?.autoSync || false,
        calendarCount: 1
      }));
      setIntegrations(formattedIntegrations);
    } catch (error) {
      console.error('Failed to load calendar integrations:', error);
      toast.error('Failed to load calendar integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
        );
      case 'outlook':
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <rect x="2" y="4" width="20" height="16" rx="2" fill="#0078D4"/>
              <circle cx="12" cy="12" r="6" fill="white"/>
              <text x="12" y="16" textAnchor="middle" fill="#0078D4" fontSize="10" fontWeight="bold" fontFamily="Arial">O</text>
            </svg>
          </div>
        );
      case 'apple':
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="currentColor" className="text-gray-800 dark:text-gray-300" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </div>
        );
      case 'exchange':
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#0078D4" d="M3 4h18v2H3V4zm0 4h18v2H3V8zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
              <path fill="#FFB900" d="M7 2h10v20H7V2z"/>
              <path fill="#0078D4" d="M10 6h4v12h-4V6z"/>
            </svg>
          </div>
        );
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <X className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const handleConnect = async (provider: string) => {
    setIsConnecting(provider);
    try {
      if (provider === 'google') {
        // Get Google OAuth URL
        const { authUrl } = await apiClient.getGoogleAuthUrl();
        // Open OAuth popup or redirect
        window.location.href = authUrl;
      } else {
        // For other providers, implement similar OAuth flows
        toast(`${provider} integration coming soon!`);
      }
    } catch (error) {
      console.error(`Failed to initiate ${provider} OAuth:`, error);
      toast.error(`Failed to connect ${provider} Calendar`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      await apiClient.disconnectCalendar(id);
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
      toast.success('Calendar disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  const handleSync = async (id: string) => {
    try {
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? { ...integration, status: 'syncing' }
            : integration
        )
      );

      const result = await apiClient.syncCalendars();

      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? {
                ...integration,
                status: 'connected',
                lastSync: new Date().toISOString()
              }
            : integration
        )
      );

      toast.success(`Calendar synced! Imported: ${result.imported}, Exported: ${result.exported}`);
      if (result.errors.length > 0) {
        toast.error(`Sync errors: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? { ...integration, status: 'error' }
            : integration
        )
      );
      toast.error('Sync failed');
    }
  };

  const toggleSync = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, syncEnabled: !integration.syncEnabled }
          : integration
      )
    );
  };

  const availableProviders = [
    { id: 'google', name: 'Google Calendar', description: 'Sync with Google Calendar' },
    { id: 'outlook', name: 'Outlook Calendar', description: 'Sync with Microsoft Outlook' },
    { id: 'apple', name: 'Apple Calendar', description: 'Sync with Apple iCloud Calendar' },
    { id: 'exchange', name: 'Exchange Calendar', description: 'Sync with Microsoft Exchange' }
  ];

  const connectedProviders = integrations.map(i => i.type);
  const availableToConnect = availableProviders.filter(p => !connectedProviders.includes(p.id as any));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendar Integrations
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {integrations.length} connected
          </span>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Connected Calendars
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(integration.type)}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {integration.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {integration.email} • {integration.calendarCount} calendars
                      </div>
                      {integration.lastSync && (
                        <div className="text-xs text-gray-400">
                          Last sync: {new Date(integration.lastSync).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(integration.status)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {getStatusText(integration.status)}
                      </span>
                    </div>

                    {/* Sync Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.syncEnabled}
                        onChange={() => toggleSync(integration.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Auto-sync
                      </span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(integration.id)}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-4 h-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      {availableToConnect.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Available Integrations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connect additional calendar providers
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {availableToConnect.map((provider) => (
              <div key={provider.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.id)}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {provider.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {provider.description}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(provider.id)}
                    disabled={isConnecting === provider.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isConnecting === provider.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {isConnecting === provider.id ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sync Settings
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Sync Frequency
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                How often to sync with external calendars
              </div>
            </div>
            <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Conflict Resolution
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                How to handle scheduling conflicts
              </div>
            </div>
            <select className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="external">Prioritize external calendars</option>
              <option value="timecraft">Prioritize TimeCraft</option>
              <option value="manual">Manual resolution</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Two-way Sync
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Allow TimeCraft events to sync back to external calendars
              </div>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Calendar Integration Help
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              • Connecting a calendar will sync all your existing events to TimeCraft
              • New events created in external calendars will automatically appear here
              • Events created in TimeCraft can be synced back to your external calendars
              • You can temporarily disable sync for any calendar without disconnecting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarIntegrations;