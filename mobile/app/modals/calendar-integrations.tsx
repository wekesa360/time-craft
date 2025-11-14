import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppTheme } from '../../constants/dynamicTheme';
import { useI18n } from '../../lib/i18n';
import GoogleIcon from '../../components/icons/GoogleIcon';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showToast } from '../../lib/toast';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';

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

export default function CalendarIntegrationsModal() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [disconnectDialog, setDisconnectDialog] = useState<{ visible: boolean; id: string | null; name: string | null }>({ visible: false, id: null, name: null });

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call when backend integration is ready
      // const connections = await apiClient.getCalendarIntegrations();
      
      // Mock data for now
      const mockIntegrations: CalendarIntegration[] = [
        {
          id: '1',
          name: 'Google Calendar',
          type: 'google',
          email: 'user@gmail.com',
          status: 'connected',
          lastSync: new Date().toISOString(),
          syncEnabled: true,
          calendarCount: 3,
        },
      ];
      
      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Failed to load calendar integrations:', error);
      Alert.alert(t('error'), 'Failed to load calendar integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return <GoogleIcon size={24} />;
      case 'outlook':
        return <Text style={{ fontSize: 18 }}>🪟</Text>;
      case 'apple':
        return <Text style={{ fontSize: 18 }}></Text>;
      case 'exchange':
        return <Text style={{ fontSize: 18 }}>🪟</Text>;
      default:
        return <CalendarIcon size={20} color={theme.colors.muted} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon size={20} color="#10B981" />;
      case 'syncing':
        return <ArrowPathIcon size={20} color="#3B82F6" className="animate-spin" />;
      case 'error':
        return <ExclamationCircleIcon size={20} color="#EF4444" />;
      default:
        return <ExclamationCircleIcon size={20} color="#6B7280" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'syncing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleConnect = async (provider: string) => {
    setIsConnecting(provider);
    try {
      if (provider === 'google') {
        Alert.alert(
          t('google_calendar_integration'),
          t('google_calendar_integration_desc'),
          [{ text: t('ok') }]
        );
      } else {
        Alert.alert(
          t('coming_soon'),
          `${provider} integration will be available in a future update.`,
          [{ text: t('ok') }]
        );
      }
    } catch (error) {
      console.error(`Failed to initiate ${provider} OAuth:`, error);
      Alert.alert(t('error'), `Failed to connect ${provider} Calendar`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    setDisconnectDialog({ visible: true, id, name });
  };

  const handleSync = async (id: string, name: string) => {
    try {
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? { ...integration, status: 'syncing' }
            : integration
        )
      );

      // TODO: Implement actual sync API call
      setTimeout(() => {
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
        Alert.alert('Success', `${name} synced successfully`);
      }, 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setIntegrations(prev =>
        prev.map(integration =>
          integration.id === id
            ? { ...integration, status: 'error' }
            : integration
        )
      );
      Alert.alert('Error', 'Sync failed');
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
  ];

  const connectedProviders = integrations.map(i => i.type);
  const availableToConnect = availableProviders.filter(p => !connectedProviders.includes(p.id as any));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <Text className="text-xl font-bold" style={{ color: theme.colors.foreground }}>{t('calendar_integrations')}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-2xl"
          style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}
        >
          <ArrowLeftIcon size={20} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-2" style={{ color: theme.colors.muted }}>{t('loading_integrations')}</Text>
          </View>
        ) : (
          <View className="px-6 py-3">
            {/* Connected Integrations */}
            {integrations.length > 0 && (
              <View className="mb-8">
                <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                  {t('connected_calendars')}
                </Text>
                
                <View className="space-y-3">
                  {integrations.map((integration) => (
                    <View key={integration.id} className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}>
                            {getProviderIcon(integration.type)}
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-lg" style={{ color: theme.colors.foreground }}>
                              {integration.name}
                            </Text>
                            <Text className="text-sm" style={{ color: theme.colors.muted }}>
                              {integration.email} • {integration.calendarCount} calendars
                            </Text>
                            {integration.lastSync && (
                              <Text className="text-xs" style={{ color: theme.colors.mutedAlt }}>
                                {t('last_sync')}: {new Date(integration.lastSync).toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Status */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          {getStatusIcon(integration.status)}
                          <Text className="ml-2 font-medium" style={{ color: theme.colors.muted }}>
                            {getStatusText(integration.status)}
                          </Text>
                        </View>

                        {/* Auto-sync Toggle */}
                        <View className="flex-row items-center">
                          <Text className="text-sm mr-2" style={{ color: theme.colors.muted }}>{t('auto_sync')}</Text>
                          <Switch
                            value={integration.syncEnabled}
                            onValueChange={() => toggleSync(integration.id)}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor="#FFFFFF"
                          />
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          onPress={() => handleSync(integration.id, integration.name)}
                          disabled={integration.status === 'syncing'}
                          className="flex-1 py-3 px-4 rounded-2xl flex-row items-center justify-center"
                          style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl, opacity: integration.status === 'syncing' ? 0.7 : 1 }}
                        >
                          <ArrowPathIcon 
                            size={16} 
                            color={theme.colors.primary} 
                            className={integration.status === 'syncing' ? 'animate-spin' : ''}
                          />
                          <Text className="font-medium ml-2" style={{ color: theme.colors.primary }}>
                            {integration.status === 'syncing' ? t('syncing') : t('sync_now')}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDisconnect(integration.id, integration.name)}
                          className="py-3 px-4 rounded-2xl"
                          style={{ borderWidth: 1, borderColor: '#EF4444', backgroundColor: '#FEE2E2', borderRadius: theme.radii.xl }}
                        >
                          <TrashIcon size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Available Integrations */}
            {availableToConnect.length > 0 && (
              <View>
                <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.foreground }}>
                  {t('available_integrations')}
                </Text>
                
                <View className="space-y-3">
                  {availableToConnect.map((provider) => (
                    <View key={provider.id} className="p-4 rounded-2xl" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }}>
                            {getProviderIcon(provider.id)}
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-lg" style={{ color: theme.colors.foreground }}>
                              {provider.name}
                            </Text>
                            <Text className="text-sm" style={{ color: theme.colors.muted }}>
                              {provider.description}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleConnect(provider.id)}
                          disabled={isConnecting === provider.id}
                          className="py-3 px-4 rounded-2xl flex-row items-center"
                          style={{ backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.radii.xl, opacity: isConnecting === provider.id ? 0.7 : 1 }}
                        >
                          {isConnecting === provider.id ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                          ) : (
                            <PlusIcon size={16} color={theme.colors.primary} />
                          )}
                          <Text className="font-medium ml-2" style={{ color: theme.colors.primary }}>
                            {isConnecting === provider.id ? t('connecting') : t('connect')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Info Section */}
            <View className="mt-8 p-4 rounded-2xl" style={{ backgroundColor: theme.colors.infoBg, borderWidth: 1, borderColor: theme.colors.infoBg, borderRadius: theme.radii.xl }}>
              <View className="flex-row items-center mb-2">
                <CalendarIcon size={20} color={theme.colors.info} />
                <Text className="font-medium ml-2" style={{ color: theme.colors.info }}>{t('about_calendar_sync')}</Text>
              </View>
              <Text className="text-sm" style={{ color: theme.colors.info }}>
                {t('about_calendar_sync_desc')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      <ConfirmDialog
        visible={disconnectDialog.visible}
        title={t('disconnect_calendar')}
        description={disconnectDialog.name ? t('disconnect_calendar_confirm').replace('{{name}}', disconnectDialog.name) : ''}
        confirmText={t('disconnect')}
        cancelText={t('cancel')}
        onCancel={() => setDisconnectDialog({ visible: false, id: null, name: null })}
        onConfirm={async () => {
          const id = disconnectDialog.id;
          const name = disconnectDialog.name;
          setDisconnectDialog({ visible: false, id: null, name: null });
          if (!id || !name) return;
          try {
            // TODO: Implement actual disconnect API call
            setIntegrations(prev => prev.filter(integration => integration.id !== id));
            showToast.success('Calendar disconnected successfully', t('success'));
          } catch (error) {
            console.error('Failed to disconnect calendar:', error);
            showToast.error('Failed to disconnect calendar', t('error'));
          }
        }}
      />
    </SafeAreaView>
  );
}