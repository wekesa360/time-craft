import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth';
import { useNotificationStore } from '../../stores/notifications';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  BellIcon,
  HeartIcon,
  ClockIcon,
  TrophyIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from 'react-native-heroicons/outline';
import { useAppTheme } from '../../constants/dynamicTheme';
import { usePreferencesStore } from '../../stores/preferences';
import { GlobeAltIcon, SwatchIcon, SunIcon } from 'react-native-heroicons/outline';
import { useI18n } from '../../lib/i18n';
import { apiClient } from '../../lib/api';
import { showToast } from '../../lib/toast';

export default function SettingsModal() {
  const theme = useAppTheme();
  const { t } = useI18n();
  const {
    biometricCapabilities,
    biometricEnabled,
    biometricAvailable,
    setBiometricEnabled,
    initializeBiometric,
    isLoading,
  } = useAuthStore();

  const {
    settings: notificationSettings,
    updateSettings: updateNotificationSettings,
    isLoading: notificationsLoading,
    pushToken,
  } = useNotificationStore();

  const [localBiometricEnabled, setLocalBiometricEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings);
  const [themeDialogVisible, setThemeDialogVisible] = useState(false);
  const [languageDialogVisible, setLanguageDialogVisible] = useState(false);
  const [colorThemeDialogVisible, setColorThemeDialogVisible] = useState(false);

  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const language = usePreferencesStore((s) => s.language);
  const setLanguage = usePreferencesStore((s) => s.setLanguage);
  const colorTheme = usePreferencesStore((s) => s.colorTheme);
  const setColorTheme = usePreferencesStore((s) => s.setColorTheme);

  useEffect(() => {
    const initSettings = async () => {
      await initializeBiometric();
      setLocalBiometricEnabled(biometricEnabled);
      setLocalNotificationSettings(notificationSettings);
    };
    initSettings();
  }, [initializeBiometric, biometricEnabled, notificationSettings]);

  // Fetch user preferences from backend and hydrate local store
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prefs = await apiClient.getUserPreferences();
        if (!mounted || !prefs) return;
        if (prefs?.theme?.mode) setThemeMode(prefs.theme.mode);
        if (prefs?.theme?.colorTheme) setColorTheme(prefs.theme.colorTheme);
        if (prefs?.general?.language) setLanguage(prefs.general.language);
      } catch (e) {
        // silent fail; keep local defaults
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setThemeMode, setColorTheme, setLanguage]);

  const handleBiometricToggle = async (value: boolean) => {
    setIsToggling(true);
    
    try {
      await setBiometricEnabled(value);
      setLocalBiometricEnabled(value);
      
      if (value) {
        Alert.alert(
          'Success',
          `${getBiometricText()} authentication has been enabled for quick sign-in.`
        );
      } else {
        Alert.alert(
          'Disabled',
          `${getBiometricText()} authentication has been disabled.`
        );
      }
    } catch (error) {
      setLocalBiometricEnabled(!value);
      Alert.alert(
        'Error',
        value 
          ? `Failed to enable ${getBiometricText()} authentication. Please try again.`
          : `Failed to disable ${getBiometricText()} authentication.`
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleNotificationToggle = async (setting: keyof typeof notificationSettings, value: boolean) => {
    setIsToggling(true);
    
    try {
      const newSettings = { ...localNotificationSettings, [setting]: value };
      setLocalNotificationSettings(newSettings);
      
      await updateNotificationSettings({ [setting]: value });
      
      Alert.alert(
        'Settings Updated',
        `${setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} notifications ${value ? 'enabled' : 'disabled'}.`
      );
    } catch (error) {
      // Revert local state on error
      setLocalNotificationSettings(prev => ({ ...prev, [setting]: !value }));
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.'
      );
    } finally {
      setIsToggling(false);
    }
  };

  const getBiometricText = () => {
    if (!biometricCapabilities?.supportedTypes.length) return 'Biometric';
    
    const types = biometricCapabilities.supportedTypes;
    if (types.includes(2)) return 'Face ID';
    if (types.includes(1)) return 'Touch ID';
    if (types.includes(3)) return 'Iris';
    return 'Biometric';
  };

  const getBiometricDescription = () => {
    const text = getBiometricText();
    return `Use ${text} to quickly sign in to your account`;
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.card }}>
      {/* Header */}
      <View style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.md, borderBottomWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 44 }} />
        <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 18 }}>{t('settings')}</Text>
        <TouchableOpacity onPress={handleBack} style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
          <Text style={{ color: theme.colors.muted }}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }}>
          {/* Security Section */}
          <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16 }}>{t('security')}</Text>
            </View>

            {/* Biometric Authentication */}
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: theme.spacing.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <ShieldCheckIcon size={22} color={theme.colors.muted} />
                    <Text style={{ marginLeft: 10, color: theme.colors.foreground, fontWeight: '600' }}>{getBiometricText()} Login</Text>
                  </View>
                  <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
                    {getBiometricDescription()}
                  </Text>
                  {!biometricAvailable && (
                    <Text style={{ color: theme.colors.danger, fontSize: 12, marginTop: 4 }}>
                      {!biometricCapabilities?.hasHardware 
                        ? t('not_supported_on_device')
                        : !biometricCapabilities?.isEnrolled
                        ? `${getBiometricText()} not set up in device settings`
                        : t('not_available')}
                    </Text>
                  )}
                </View>
                {isToggling ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Switch
                    value={localBiometricEnabled}
                    onValueChange={handleBiometricToggle}
                    disabled={!biometricAvailable || isLoading}
                    trackColor={{ false: '#d1d5db', true: theme.colors.primaryLight }}
                    thumbColor={localBiometricEnabled ? theme.colors.primary : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            {/* Setup Instructions */}
            {biometricCapabilities?.hasHardware && !biometricCapabilities?.isEnrolled && (
              <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, backgroundColor: '#FFF7ED', borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radii.xl }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#EA580C', marginRight: 8 }}>⚠️</Text>
                  <View>
                    <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('setup_required')}</Text>
                    <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
                      To use {getBiometricText()}, please set it up in your device settings first.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Notifications Section */}
          <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16 }}>{t('notifications')}</Text>
              {!pushToken && (
                <Text style={{ color: theme.colors.warning, marginTop: 4, fontSize: 12 }}>Push notifications not available</Text>
              )}
            </View>

            {/* Task Reminders */}
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <CheckCircleIcon size={20} color={theme.colors.muted} />
                    <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>{t('task_reminders')}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{t('get_notified_before_tasks')}</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.taskReminders}
                    onValueChange={(value) => handleNotificationToggle('taskReminders', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.taskReminders ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px mx-6" style={{ backgroundColor: theme.colors.border }} />

            {/* Health Reminders */}
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <HeartIcon size={20} color={theme.colors.muted} />
                    <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>{t('health_reminders')}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{t('hydration_mood_exercise')}</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.healthReminders}
                    onValueChange={(value) => handleNotificationToggle('healthReminders', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.healthReminders ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px mx-6" style={{ backgroundColor: theme.colors.border }} />

            {/* Focus Session Alerts */}
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <ClockIcon size={20} color={theme.colors.muted} />
                    <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>{t('focus_session_alerts')}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{t('session_completion_break')}</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.focusSessionAlerts}
                    onValueChange={(value) => handleNotificationToggle('focusSessionAlerts', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.focusSessionAlerts ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px mx-6" style={{ backgroundColor: theme.colors.border }} />

            {/* Achievements */}
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <TrophyIcon size={20} color={theme.colors.muted} />
                    <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>{t('achievements_label')}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{t('celebrate_milestones')}</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.achievements}
                    onValueChange={(value) => handleNotificationToggle('achievements', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.achievements ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>

            <View className="h-px bg-gray-100 mx-6" />

            {/* Weekly Reports */}
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <ChartBarIcon size={20} color={theme.colors.muted} />
                    <Text className="font-medium ml-2" style={{ color: theme.colors.foreground }}>{t('weekly_reports')}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">{t('weekly_productivity_summaries')}</Text>
                </View>
                
                {isToggling ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <Switch
                    value={localNotificationSettings.weeklyReports}
                    onValueChange={(value) => handleNotificationToggle('weeklyReports', value)}
                    disabled={!pushToken || notificationsLoading}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={localNotificationSettings.weeklyReports ? '#6366f1' : '#9ca3af'}
                  />
                )}
              </View>
            </View>
          </View>

          {/* App Preferences Section */}
          <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16 }}>{t('app_preferences')}</Text>
            </View>

            <TouchableOpacity onPress={() => setThemeDialogVisible(true)} className="px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <SunIcon size={20} color={theme.colors.muted} />
                <View className="ml-2">
                  <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('theme')}</Text>
                  <Text className="text-gray-500 text-sm">{themeMode === 'system' ? t('system_default') : themeMode === 'light' ? t('light') : t('dark')}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 mx-6" />

            <TouchableOpacity onPress={() => setLanguageDialogVisible(true)} className="px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <GlobeAltIcon size={20} color={theme.colors.muted} />
                <View className="ml-2">
                  <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('language')}</Text>
                  <Text className="text-gray-500 text-sm">{language === 'en' ? t('english') : t('german')}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 mx-6" />

            <TouchableOpacity onPress={() => setColorThemeDialogVisible(true)} className="px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <SwatchIcon size={20} color={theme.colors.muted} />
                <View className="ml-2">
                  <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('color_theme')}</Text>
                  <Text className="text-gray-500 text-sm">{colorTheme === 'blue' ? t('blue') : colorTheme === 'green' ? t('green') : colorTheme === 'purple' ? t('purple') : t('red')}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          </View>

          {/* Data & Privacy Section */}
          <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, marginBottom: theme.spacing.lg }}>
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16 }}>Data & Privacy</Text>
            </View>

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <ArrowDownTrayIcon size={20} color={theme.colors.muted} />
                <View className="ml-2">
                  <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('export_data')}</Text>
                  <Text className="text-gray-500 text-sm">{t('download_your_data')}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 mx-6" />

            <TouchableOpacity className="px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TrashIcon size={20} color={theme.colors.danger} />
                <View className="ml-2">
                  <Text style={{ color: theme.colors.foreground, fontWeight: '600' }}>{t('delete_account')}</Text>
                  <Text className="text-gray-500 text-sm">{t('permanently_delete_account')}</Text>
                </View>
              </View>
              <Text style={{ color: theme.colors.danger }} className="text-xl">›</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={{ backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl }}>
            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg, borderBottomWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16 }}>{t('about')}</Text>
            </View>

            <View style={{ paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg }}>
              <Text style={{ color: theme.colors.muted, marginBottom: 4 }}>{t('timecraft_mobile')}</Text>
              <Text style={{ color: theme.colors.mutedAlt, fontSize: 12 }}>{t('version_1_0_0')}</Text>
            </View>
          </View>
      </ScrollView>

      {/* Theme Dialog */}
      <Modal visible={themeDialogVisible} transparent animationType="fade" onRequestClose={() => setThemeDialogVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: theme.radii.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16, marginBottom: theme.spacing.md }}>{t('choose_theme')}</Text>
            <View>
              {([
                { key: 'system', label: t('system_default') },
                { key: 'light', label: t('light') },
                { key: 'dark', label: t('dark') },
              ] as const).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={async () => {
                    setThemeMode(opt.key);
                    setThemeDialogVisible(false);
                    try {
                      await apiClient.updateUserPreferences({ theme: { mode: opt.key } });
                      showToast.success(t('success'));
                    } catch (e) {
                      showToast.error(t('error'));
                    }
                  }}
                  style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, backgroundColor: themeMode === opt.key ? theme.colors.surface : 'transparent', borderRadius: theme.radii.md }}
                >
                  <Text style={{ color: theme.colors.foreground }}>{opt.label}</Text>
                  <View style={{ width: 18, height: 18, borderRadius: 999, borderWidth: 2, borderColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    {themeMode === opt.key && <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: theme.colors.primary }} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setThemeDialogVisible(false)} style={{ marginTop: theme.spacing.lg, alignSelf: 'flex-end' }}>
              <Text style={{ color: theme.colors.muted }}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Dialog */}
      <Modal visible={languageDialogVisible} transparent animationType="fade" onRequestClose={() => setLanguageDialogVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: theme.radii.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16, marginBottom: theme.spacing.md }}>{t('choose_language')}</Text>
            <View>
              {([
                { key: 'en', label: t('english') },
                { key: 'de', label: t('german') },
              ] as const).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={async () => {
                    setLanguage(opt.key);
                    setLanguageDialogVisible(false);
                    try {
                      await apiClient.updateUserPreferences({ general: { language: opt.key } });
                      showToast.success(t('success'));
                    } catch (e) {
                      showToast.error(t('error'));
                    }
                  }}
                  style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, backgroundColor: language === opt.key ? theme.colors.surface : 'transparent', borderRadius: theme.radii.md }}
                >
                  <Text style={{ color: theme.colors.foreground }}>{opt.label}</Text>
                  <View style={{ width: 18, height: 18, borderRadius: 999, borderWidth: 2, borderColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    {language === opt.key && <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: theme.colors.primary }} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setLanguageDialogVisible(false)} style={{ marginTop: theme.spacing.lg, alignSelf: 'flex-end' }}>
              <Text style={{ color: theme.colors.muted }}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Color Theme Dialog */}
      <Modal visible={colorThemeDialogVisible} transparent animationType="fade" onRequestClose={() => setColorThemeDialogVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.colors.card, borderRadius: theme.radii.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.foreground, fontWeight: '700', fontSize: 16, marginBottom: theme.spacing.md }}>{t('choose_color_theme')}</Text>
            <View>
              {([
                { key: 'blue', label: t('blue') },
                { key: 'green', label: t('green') },
                { key: 'purple', label: t('purple') },
                { key: 'red', label: t('red') },
              ] as const).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={async () => {
                    setColorTheme(opt.key);
                    setColorThemeDialogVisible(false);
                    try {
                      await apiClient.updateUserPreferences({ theme: { colorTheme: opt.key } });
                      showToast.success(t('success'));
                    } catch (e) {
                      showToast.error(t('error'));
                    }
                  }}
                  style={{ paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, backgroundColor: colorTheme === opt.key ? theme.colors.surface : 'transparent', borderRadius: theme.radii.md }}
                >
                  <Text style={{ color: theme.colors.foreground }}>{opt.label}</Text>
                  <View style={{ width: 18, height: 18, borderRadius: 999, borderWidth: 2, borderColor: theme.colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    {colorTheme === opt.key && <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: theme.colors.primary }} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setColorThemeDialogVisible(false)} style={{ marginTop: theme.spacing.lg, alignSelf: 'flex-end' }}>
              <Text style={{ color: theme.colors.muted }}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}