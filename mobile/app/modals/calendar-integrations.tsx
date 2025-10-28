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
import {
  XMarkIcon,
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
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

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
      Alert.alert('Error', 'Failed to load calendar integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return '📅';
      case 'outlook':
        return '📧';
      case 'apple':
        return '🍎';
      case 'exchange':
        return '🏢';
      default:
        return '📋';
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
          'Google Calendar Integration',
          'Google Calendar integration will be available soon. This feature requires additional setup for mobile authentication.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Coming Soon',
          `${provider} integration will be available in a future update.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error(`Failed to initiate ${provider} OAuth:`, error);
      Alert.alert('Error', `Failed to connect ${provider} Calendar`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    Alert.alert(
      'Disconnect Calendar',
      `Are you sure you want to disconnect ${name}? This will stop syncing events from this calendar.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement actual disconnect API call
              setIntegrations(prev => prev.filter(integration => integration.id !== id));
              Alert.alert('Success', 'Calendar disconnected successfully');
            } catch (error) {
              console.error('Failed to disconnect calendar:', error);
              Alert.alert('Error', 'Failed to disconnect calendar');
            }
          },
        },
      ]
    );
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-gray-100"
        >
          <XMarkIcon size={20} color="#374151" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-900">Calendar Integrations</Text>
        
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1">
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-2">Loading integrations...</Text>
          </View>
        ) : (
          <View className="px-6 py-4">
            {/* Connected Integrations */}
            {integrations.length > 0 && (
              <View className="mb-8">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Connected Calendars
                </Text>
                
                <View className="space-y-3">
                  {integrations.map((integration) => (
                    <View key={integration.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-xl bg-white border border-gray-200 items-center justify-center mr-3">
                            <Text className="text-2xl">{getProviderIcon(integration.type)}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-gray-900 text-lg">
                              {integration.name}
                            </Text>
                            <Text className="text-sm text-gray-600">
                              {integration.email} • {integration.calendarCount} calendars
                            </Text>
                            {integration.lastSync && (
                              <Text className="text-xs text-gray-500">
                                Last sync: {new Date(integration.lastSync).toLocaleString()}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Status */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          {getStatusIcon(integration.status)}
                          <Text className={`ml-2 font-medium ${getStatusColor(integration.status)}`}>
                            {getStatusText(integration.status)}
                          </Text>
                        </View>

                        {/* Auto-sync Toggle */}
                        <View className="flex-row items-center">
                          <Text className="text-sm text-gray-600 mr-2">Auto-sync</Text>
                          <Switch
                            value={integration.syncEnabled}
                            onValueChange={() => toggleSync(integration.id)}
                            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                            thumbColor="#FFFFFF"
                          />
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          onPress={() => handleSync(integration.id, integration.name)}
                          disabled={integration.status === 'syncing'}
                          className="flex-1 py-2 px-3 bg-blue-500 rounded-lg flex-row items-center justify-center"
                        >
                          <ArrowPathIcon 
                            size={16} 
                            color="white" 
                            className={integration.status === 'syncing' ? 'animate-spin' : ''}
                          />
                          <Text className="text-white font-medium ml-1">
                            {integration.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => handleDisconnect(integration.id, integration.name)}
                          className="py-2 px-3 bg-red-500 rounded-lg"
                        >
                          <TrashIcon size={16} color="white" />
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
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  Available Integrations
                </Text>
                
                <View className="space-y-3">
                  {availableToConnect.map((provider) => (
                    <View key={provider.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-12 h-12 rounded-xl bg-white border border-gray-200 items-center justify-center mr-3">
                            <Text className="text-2xl">{getProviderIcon(provider.id)}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-bold text-gray-900 text-lg">
                              {provider.name}
                            </Text>
                            <Text className="text-sm text-gray-600">
                              {provider.description}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleConnect(provider.id)}
                          disabled={isConnecting === provider.id}
                          className="py-2 px-4 bg-blue-500 rounded-lg flex-row items-center"
                        >
                          {isConnecting === provider.id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <PlusIcon size={16} color="white" />
                          )}
                          <Text className="text-white font-medium ml-1">
                            {isConnecting === provider.id ? 'Connecting...' : 'Connect'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Info Section */}
            <View className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <View className="flex-row items-center mb-2">
                <CalendarIcon size={20} color="#3B82F6" />
                <Text className="text-blue-700 font-medium ml-2">About Calendar Sync</Text>
              </View>
              <Text className="text-blue-600 text-sm">
                Connect your external calendars to automatically sync events. Your data stays secure and you can disconnect at any time.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}