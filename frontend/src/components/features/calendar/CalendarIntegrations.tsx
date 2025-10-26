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
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

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
              <path fill="currentColor" className="text-muted-foreground dark:text-muted-foreground" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
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
        return <Calendar className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="w-4 h-4 text-success" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-info-light0 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error-light0" />;
      default:
        return <X className="w-4 h-4 text-muted-foreground" />;
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
        <span className="ml-3 text-muted-foreground dark:text-muted-foreground">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Calendar Integrations
        </h2>
        <p className="text-lg text-muted-foreground">
          Connect your external calendars for seamless scheduling
        </p>
        <div className="mt-2">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {integrations.length} connected
          </span>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Connected Calendars
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-4 bg-muted/50 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                      {getProviderIcon(integration.type)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg">
                        {integration.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {integration.email} • {integration.calendarCount} calendars
                      </div>
                      {integration.lastSync && (
                        <div className="text-xs text-muted-foreground">
                          Last sync: {new Date(integration.lastSync).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border">
                      {getStatusIcon(integration.status)}
                      <span className="text-sm font-medium text-foreground">
                        {getStatusText(integration.status)}
                      </span>
                    </div>

                    {/* Sync Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.syncEnabled}
                        onChange={() => toggleSync(integration.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground">
                        Auto-sync
                      </span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(integration.id)}
                        disabled={integration.status === 'syncing'}
                        className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw className={`w-5 h-5 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all hover:scale-110"
                        title="Disconnect"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available Integrations */}
      {availableToConnect.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Available Integrations
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Connect additional calendar providers
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableToConnect.map((provider) => (
              <div key={provider.id} className="p-4 bg-muted/50 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center">
                      {getProviderIcon(provider.id)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg">
                        {provider.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {provider.description}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnect(provider.id)}
                    disabled={isConnecting === provider.id}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:scale-105 disabled:opacity-50 font-medium shadow-md"
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
          </CardContent>
        </Card>
      )}

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Sync Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 border border-border/50 rounded-xl">
            <div>
              <div className="font-bold text-foreground">
                Sync Frequency
              </div>
              <div className="text-sm text-muted-foreground">
                How often to sync with external calendars
              </div>
            </div>
            <select className="border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 border border-border/50 rounded-xl">
            <div>
              <div className="font-bold text-foreground">
                Conflict Resolution
              </div>
              <div className="text-sm text-muted-foreground">
                How to handle scheduling conflicts
              </div>
            </div>
            <select className="border border-border rounded-xl px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="external">Prioritize external calendars</option>
              <option value="timecraft">Prioritize TimeCraft</option>
              <option value="manual">Manual resolution</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 border border-border/50 rounded-xl">
            <div>
              <div className="font-bold text-foreground">
                Two-way Sync
              </div>
              <div className="text-sm text-muted-foreground">
                Allow TimeCraft events to sync back to external calendars
              </div>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-border text-primary focus:ring-primary w-5 h-5"
              />
            </label>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default CalendarIntegrations;