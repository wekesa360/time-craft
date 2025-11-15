import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { EnhancedAppearanceSection } from '../components/settings/EnhancedAppearanceSection';
import { LocalizationSection } from '../components/settings/LocalizationSection';
import { LanguagePreferencesSectionWithSuspense as LanguagePreferencesSection } from '../components/localization/LazyLocalizationComponents';
import { GermanTextOptimizer, GermanTitle } from '../components/common/GermanTextOptimizer';
import TabSwitcher from '../components/ui/TabSwitcher';
import type { TabItem } from '../components/ui/TabSwitcher';
import { TimezonePicker } from '../components/ui/TimezonePicker';
import { 
  User, Bell, Shield, Globe, Palette, Database, 
  Camera, CreditCard, Key, Trash2, Download, 
  Upload, Lock, Eye, EyeOff,
  AlertTriangle, Settings, Mail, Phone,
  Calendar, Clock, Moon, Sun
} from 'lucide-react';

// Hooks and API
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

// Types
import type { User as UserType, NotificationPreferences } from '../types';

interface ProfileForm {
  firstName: string;
  lastName: string;
  timezone: string;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'subscription' | 'security' | 'language' | 'privacy';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reduced logging to prevent console noise
  // console.log('[SettingsPage] Component render - user:', user);
  
  // State management
  const [activeSection, setActiveSection] = useState<SettingsTab>('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Auto-detect timezone on mount
  const getBrowserTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  };

  // Forms
  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      timezone: user?.timezone || getBrowserTimezone()
    }
  });
  
  const securityForm = useForm<SecurityForm>();
  
  // Update form when user data changes (only on initial load, not after saves)
  const hasInitialized = useRef(false);
  useEffect(() => {
    // Only initialize once on mount, not when user changes
    if (user && !hasInitialized.current) {
      console.log('[SettingsPage] Initializing form with user data');
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        timezone: user.timezone || getBrowserTimezone()
      }, { keepDefaultValues: true });
      hasInitialized.current = true;
      console.log('[SettingsPage] Form initialized');
    }
    // Only run once on mount - don't depend on user to avoid re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Data queries - use user from auth store as source of truth, query as fallback
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getProfile(),
    initialData: user,
    enabled: false, // Disable automatic fetching - we'll update via setQueryData
    staleTime: Infinity, // Don't refetch automatically
    gcTime: Infinity // Keep in cache
  });
  
  // Use user from auth store as primary source (always up-to-date), profile query as fallback
  const displayProfile = user || profile;
  
  // Debug: Log when displayProfile changes (commented out to reduce re-renders)
  // Uncomment if needed for debugging
  // useEffect(() => {
  //   console.log('[SettingsPage] displayProfile changed:', {
  //     displayProfileFirstName: displayProfile?.firstName,
  //     userFirstName: user?.firstName,
  //     profileFirstName: profile?.firstName
  //   });
  // }, [displayProfile?.firstName, displayProfile?.lastName, user?.firstName, user?.lastName]);
  
  const { data: notificationPrefs, isLoading: notificationLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiClient.getNotificationPreferences()
  });
  
  // Only fetch subscription when on subscription tab and user has a paid subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: () => apiClient.getUserSubscription(),
    enabled: activeSection === 'subscription' && user?.subscriptionType !== 'free',
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch unnecessarily
  });
  
  // Debug logging for settings data (removed to prevent unnecessary re-renders)
  // useEffect(() => {
  //   console.log('SettingsPage loaded data:', {
  //     profile,
  //     notificationPrefs,
  //     subscription,
  //     user
  //   });
  // }, [profile, notificationPrefs, subscription, user]);
  
  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      console.log('[Profile Save] Starting mutation with data:', data);
      try {
        const result = await updateProfile(data);
        console.log('[Profile Save] Mutation successful, result:', result);
        return result;
      } catch (error) {
        console.error('[Profile Save] Mutation error:', error);
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      console.log('[Profile Save] onSuccess called with user:', updatedUser);
      // Silently update the query cache without refetching
      queryClient.setQueryData(['user-profile'], updatedUser);
      console.log('[Profile Save] Query cache updated');
      // Don't reset the form - it already has the correct values and resetting causes re-render/blink
      // The form values are already correct since we just submitted them
      // The UI will update automatically via displayProfile which uses the updated user from auth store
      console.log('[Profile Save] Skipping form reset to prevent re-render');
      // Show success toast
      toast.success(t('settings.profileUpdated', 'Profile updated successfully'));
      console.log('[Profile Save] Success toast shown');
    },
    onError: (error) => {
      console.error('[Profile Save] onError called with error:', error);
      console.error('[Profile Save] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(t('settings.profileUpdateError', 'Failed to update profile'));
    }
  });
  
  const updateNotificationsMutation = useMutation({
    mutationFn: (prefs: NotificationPreferences) => apiClient.updateNotificationPreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success(t('settings.notificationsUpdated', 'Notification preferences updated'));
    },
    onError: (error: any) => {
      console.error('Failed to update notification preferences:', error);
      toast.error(t('settings.notificationsUpdateError', 'Failed to update notification preferences'));
    }
  });
  
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      apiClient.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      securityForm.reset();
      setShowPasswordForm(false);
      toast.success(t('settings.passwordChanged', 'Password changed successfully'));
    },
    onError: () => {
      toast.error(t('settings.passwordChangeError', 'Failed to change password'));
    }
  });
  
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadAvatar(file),
    onSuccess: (updatedUser) => {
      // Update user in auth store
      updateProfile({ avatar: updatedUser.avatar });
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success(t('settings.avatarUpdated', 'Avatar updated successfully'));
    },
    onError: () => {
      toast.error(t('settings.avatarUpdateError', 'Failed to update avatar'));
    }
  });
  
  // Event handlers
  const handleProfileSubmit = useCallback((data: ProfileForm) => {
    console.log('[Profile Save] Form submitted with data:', data);
    console.log('[Profile Save] Current user before update:', user);
    updateProfileMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      timezone: data.timezone
    });
    // Form submission is handled by react-hook-form's handleSubmit which prevents default
  }, [updateProfileMutation, user]);
  
  const handleSecuritySubmit = useCallback((data: SecurityForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error(t('settings.passwordMismatch', 'Passwords do not match'));
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  }, [changePasswordMutation, t]);
  
  const handleAvatarChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(t('settings.avatarTooLarge', 'Avatar file size must be less than 5MB'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      uploadAvatarMutation.mutate(file);
    }
  }, [uploadAvatarMutation, t]);
  
  const handleNotificationChange = useCallback((key: keyof NotificationPreferences, value: boolean | any) => {
    if (notificationPrefs) {
      const updatedPrefs = { ...notificationPrefs, [key]: value };
      updateNotificationsMutation.mutate(updatedPrefs);
    }
  }, [notificationPrefs, updateNotificationsMutation]);
  
  const handleDataExport = useCallback(async () => {
    try {
      const data = await apiClient.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `time-wellness-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('settings.dataExported', 'Data exported successfully'));
    } catch (error) {
      toast.error(t('settings.dataExportError', 'Failed to export data'));
    }
  }, [t]);
  
  const handleAccountDelete = useCallback(async () => {
    if (window.confirm(t('settings.deleteAccountConfirm', 'Are you sure you want to delete your account? This action cannot be undone.'))) {
      try {
        await apiClient.deleteAccount();
        toast.success(t('settings.accountDeleted', 'Account scheduled for deletion'));
        // Redirect to login after a delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } catch (error) {
        toast.error(t('settings.deleteAccountError', 'Failed to delete account'));
      }
    }
  }, [t]);
  
  // Tab configuration
  const settingsTabs: TabItem[] = [
    { id: 'profile', label: t('settings.profile', 'Profile') },
    { id: 'appearance', label: t('settings.themeSettings.appearance', 'Appearance') },
    { id: 'notifications', label: t('settings.notifications', 'Notifications') },
    { id: 'subscription', label: t('settings.subscription', 'Subscription') },
    { id: 'security', label: t('settings.security', 'Security') },
    { id: 'language', label: t('settings.language', 'Language') },
    { id: 'privacy', label: t('settings.privacy', 'Privacy & Data') },
  ];

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and application settings</p>
      </div>

      {/* Tab Navigation */}
      <TabSwitcher
        tabs={settingsTabs}
        activeTab={activeSection}
        onTabChange={(tabId) => setActiveSection(tabId as SettingsTab)}
      />

      {/* Settings Content */}
      <div className="space-y-6">
        {/* Profile Settings */}
        {activeSection === 'profile' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.profile', 'Profile')}
              </h2>
            </div>
            
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center overflow-hidden">
                      {avatarPreview || displayProfile?.avatar ? (
                        <img 
                          src={avatarPreview || displayProfile?.avatar} 
                          alt={t('settings.avatar', 'Profile Avatar')} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
                      disabled={uploadAvatarMutation.isPending}
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {`${displayProfile?.firstName || ''} ${displayProfile?.lastName || ''}`.trim() || 'User'}
                    </h3>
                    <p className="text-foreground-secondary">{displayProfile?.email}</p>
                    <p className="text-sm text-foreground-tertiary">
                      {t('settings.memberSince', 'Member since')} {displayProfile?.createdAt ? formatDistanceToNow(new Date(displayProfile.createdAt), { addSuffix: true, locale: i18n.language === 'de' ? de : undefined }) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      displayProfile?.subscriptionType === 'premium' 
                        ? 'bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-300'
                        : displayProfile?.subscriptionType === 'enterprise'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground'
                    }`}>
                      {displayProfile?.subscriptionType?.toUpperCase()}
                    </div>
                    {displayProfile?.isStudent && (
                      <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-light text-info dark:bg-info dark:text-info-light">
                        {t('settings.studentAccount', 'Student')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Profile Form */}
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('settings.profileForm.firstName', 'First Name')}
                      </label>
                      <input
                        {...profileForm.register('firstName', { required: true })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('settings.profileForm.lastName', 'Last Name')}
                      </label>
                      <input
                        {...profileForm.register('lastName', { required: true })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('settings.profileForm.email', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      value={displayProfile?.email || ''}
                      className="input w-full bg-muted"
                      disabled
                      aria-describedby="email-help"
                    />
                    <p id="email-help" className="text-xs text-foreground-tertiary mt-1">
                      {t('settings.emailChangeNote', 'Contact support to change your email address')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('settings.profileForm.timezone', 'Timezone')}
                    </label>
                    <TimezonePicker
                      value={profileForm.watch('timezone')}
                      onChange={(tz) => profileForm.setValue('timezone', tz)}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => profileForm.reset()}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-primary/5 hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg transition-colors duration-200 ${
                        updateProfileMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('common.saving', 'Saving...')}
                        </>
                      ) : (
                        t('common.save', 'Save Changes')
                      )}
                    </button>
                  </div>
            </form>
          </div>
        )}
        
        {/* Appearance Settings */}
        {activeSection === 'appearance' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.themeSettings.appearance', 'Appearance')}
              </h2>
              <div className="flex-1"></div>
              <Link 
                to="/appearance-demo" 
                className="text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors font-medium"
              >
                View Demo
              </Link>
              <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                Enhanced
              </div>
            </div>
            
            <EnhancedAppearanceSection />
          </div>
        )}

        {/* Notifications Settings */}
        {activeSection === 'notifications' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.notifications', 'Notifications')}
              </h2>
            </div>
                
                {notificationLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="animate-pulse">
                          <div className="h-4 bg-background-tertiary rounded w-32 mb-1"></div>
                          <div className="h-3 bg-background-tertiary rounded w-48"></div>
                        </div>
                        <div className="w-11 h-6 bg-background-tertiary rounded-full animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Task Notifications */}
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-4">{t('settings.taskNotifications', 'Task Notifications')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{t('settings.taskReminders', 'Task Reminders')}</h4>
                            <p className="text-xs text-foreground-secondary">{t('settings.taskRemindersDesc', 'Get notified about upcoming tasks')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs?.taskReminders || false}
                              onChange={(e) => handleNotificationChange('taskReminders', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{t('settings.deadlineAlerts', 'Deadline Alerts')}</h4>
                            <p className="text-xs text-foreground-secondary">{t('settings.deadlineAlertsDesc', 'Alerts for approaching deadlines')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs?.deadlineAlerts || false}
                              onChange={(e) => handleNotificationChange('deadlineAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Health & Wellness */}
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-4">{t('settings.healthNotifications', 'Health & Wellness')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{t('settings.healthReminders', 'Health Reminders')}</h4>
                            <p className="text-xs text-foreground-secondary">{t('settings.healthRemindersDesc', 'Reminders to log health data')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs?.healthReminders || false}
                              onChange={(e) => handleNotificationChange('healthReminders', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Social & Achievements */}
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-4">{t('settings.socialNotifications', 'Social & Achievements')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{t('settings.badgeUnlocks', 'Badge Unlocks')}</h4>
                            <p className="text-xs text-foreground-secondary">{t('settings.badgeUnlocksDesc', 'Notifications when you earn new badges')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs?.badgeUnlocks || false}
                              onChange={(e) => handleNotificationChange('badgeUnlocks', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{t('settings.socialNotifications', 'Social Activity')}</h4>
                            <p className="text-xs text-foreground-secondary">{t('settings.socialNotificationsDesc', 'Updates about challenges and connections')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs?.socialNotifications || false}
                              onChange={(e) => handleNotificationChange('socialNotifications', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quiet Hours */}
                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-medium text-foreground mb-4">{t('settings.quietHours', 'Quiet Hours')}</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{t('settings.enableQuietHours', 'Enable Quiet Hours')}</h4>
                            <p className="text-xs text-foreground-secondary">{t('settings.quietHoursDesc', 'Disable notifications during specified hours')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={notificationPrefs?.quietHours?.enabled || false}
                              onChange={(e) => handleNotificationChange('quietHours', { ...notificationPrefs?.quietHours, enabled: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-background-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        
                        {notificationPrefs?.quietHours?.enabled && (
                          <div className="grid grid-cols-2 gap-4 ml-6">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">{t('settings.quietHoursStart', 'Start Time')}</label>
                              <input 
                                type="time" 
                                className="input w-full" 
                                value={notificationPrefs?.quietHours?.start || '22:00'}
                                onChange={(e) => handleNotificationChange('quietHours', { ...notificationPrefs?.quietHours, start: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">{t('settings.quietHoursEnd', 'End Time')}</label>
                              <input 
                                type="time" 
                                className="input w-full" 
                                value={notificationPrefs?.quietHours?.end || '08:00'}
                                onChange={(e) => handleNotificationChange('quietHours', { ...notificationPrefs?.quietHours, end: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
            )}
          </div>
        )}

        {/* Subscription Settings */}
        {activeSection === 'subscription' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.subscription', 'Subscription')}
              </h2>
            </div>
              
              {subscriptionLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-background-tertiary rounded"></div>
                  <div className="h-12 bg-background-tertiary rounded"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className={`p-4 rounded-lg border-2 ${
                    profile?.subscriptionType === 'premium' 
                      ? 'border-gold-500 bg-gold-50 dark:bg-gold-950/20'
                      : profile?.subscriptionType === 'enterprise'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                      : 'border-border bg-muted'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground capitalize">
                          {profile?.subscriptionType} {t('settings.plan', 'Plan')}
                        </h3>
                        <p className="text-sm text-foreground-secondary">
                          {subscription?.currentPeriodEnd 
                            ? `${t('settings.renewsOn', 'Renews on')} ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                            : profile?.subscriptionType === 'free' 
                              ? t('settings.freeForever', 'Free forever')
                              : ''
                          }
                        </p>
                      </div>
                      {profile?.isStudent && (
                        <div className="px-3 py-1 bg-info-light text-info dark:bg-info dark:text-info-light rounded-full text-sm font-medium">
                          {t('settings.studentDiscount', 'Student Discount')}
                        </div>
                      )}
                    </div>
                    
                    {/* Plan Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{t('settings.basicFeatures', 'All basic features')}</span>
                      </div>
                      {profile?.subscriptionType !== 'free' && (
                        <>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span>{t('settings.premiumFeatures', 'Premium analytics')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span>{t('settings.unlimitedSync', 'Unlimited sync')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Plan Options */}
                  {profile?.subscriptionType === 'free' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gold-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gold-800 dark:text-gold-300">Premium</h4>
                          <span className="text-lg font-bold text-gold-800 dark:text-gold-300">$9.99/mo</span>
                        </div>
                        <ul className="text-sm space-y-1 mb-4">
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span>{t('settings.premiumAnalytics', 'Advanced analytics')}</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span>{t('settings.prioritySupport', 'Priority support')}</span>
                          </li>
                        </ul>
                        <button className="btn-primary w-full">
                          {t('settings.upgradeToPremium', 'Upgrade to Premium')}
                        </button>
                      </div>
                      
                      <div className="border border-purple-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-purple-800 dark:text-purple-300">Enterprise</h4>
                          <span className="text-lg font-bold text-purple-800 dark:text-purple-300">$19.99/mo</span>
                        </div>
                        <ul className="text-sm space-y-1 mb-4">
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span>{t('settings.teamFeatures', 'Team collaboration')}</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span>{t('settings.apiAccess', 'API access')}</span>
                          </li>
                        </ul>
                        <button className="btn-secondary w-full">
                          {t('settings.upgradeToEnterprise', 'Upgrade to Enterprise')}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Billing History */}
                  {profile?.subscriptionType !== 'free' && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">{t('settings.billingHistory', 'Billing History')}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded border border-primary/20">
                          <div>
                            <p className="text-sm font-medium">{profile?.subscriptionType} Plan</p>
                            <p className="text-xs text-foreground-secondary">{new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${profile?.subscriptionType === 'premium' ? '9.99' : '19.99'}</p>
                            <p className="text-xs text-foreground-secondary">{t('settings.paid', 'Paid')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Subscription Actions */}
                  {profile?.subscriptionType !== 'free' && (
                    <div className="flex space-x-3 pt-4 border-t border-border">
                      <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-primary/5 hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200">
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t('settings.manageBilling', 'Manage Billing')}
                      </button>
                      <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-error dark:text-error-light bg-white dark:bg-muted border border-red-300 dark:border-red-600 rounded-lg hover:bg-error-light dark:hover:bg-error/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('settings.cancelSubscription', 'Cancel Subscription')}
                      </button>
                    </div>
                  )}
                </div>
            )}
          </div>
        )}
        
        {/* Security Settings */}
        {activeSection === 'security' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.security', 'Security')}
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Password Change */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{t('settings.changePassword', 'Change Password')}</h3>
                    <p className="text-xs text-foreground-secondary">{t('settings.passwordLastChanged', 'Last changed 30 days ago')}</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-primary/5 hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {t('settings.changePassword', 'Change Password')}
                  </button>
                </div>
                    
                    {showPasswordForm && (
                      <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.currentPassword', 'Current Password')}
                          </label>
                          <div className="relative">
                            <input
                              {...securityForm.register('currentPassword', { required: true })}
                              type={showCurrentPassword ? 'text' : 'password'}
                              className="input w-full pr-10"
                              placeholder={t('settings.enterCurrentPassword', 'Enter your current password')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-foreground-secondary hover:text-foreground"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.newPassword', 'New Password')}
                          </label>
                          <div className="relative">
                            <input
                              {...securityForm.register('newPassword', { required: true, minLength: 8 })}
                              type={showNewPassword ? 'text' : 'password'}
                              className="input w-full pr-10"
                              placeholder={t('settings.enterNewPassword', 'Enter your new password')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-foreground-secondary hover:text-foreground"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.confirmNewPassword', 'Confirm New Password')}
                          </label>
                          <input
                            {...securityForm.register('confirmPassword', { required: true })}
                            type="password"
                            className="input w-full"
                            placeholder={t('settings.confirmNewPassword', 'Confirm your new password')}
                          />
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false);
                              securityForm.reset();
                            }}
                            className="btn-ghost"
                          >
                            {t('common.cancel', 'Cancel')}
                          </button>
                          <button
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                            className="btn-primary"
                          >
                            {changePasswordMutation.isPending ? t('settings.changingPassword', 'Changing...') : t('settings.updatePassword', 'Update Password')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                  

            </div>
          </div>
        )}
        
        {/* Privacy & Data Settings */}
        {activeSection === 'privacy' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.privacy', 'Privacy & Data')}
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Data Collection */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">{t('settings.dataCollection', 'Data Collection')}</h3>
                    <p className="text-xs text-foreground-secondary mb-4">
                      {t('settings.dataCollectionDesc', 'Control what data is collected to improve your experience')}
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 text-primary bg-card border-border rounded focus:ring-primary focus:ring-2 focus:ring-offset-0" 
                          defaultChecked 
                        />
                        <div>
                          <span className="text-sm text-foreground block">{t('settings.analyticsData', 'Analytics and usage data')}</span>
                          <span className="text-xs text-muted-foreground">{t('settings.analyticsDesc', 'Help us improve the app by sharing anonymous usage data')}</span>
                        </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 text-primary bg-card border-border rounded focus:ring-primary focus:ring-2 focus:ring-offset-0" 
                          defaultChecked 
                        />
                        <div>
                          <span className="text-sm text-foreground block">{t('settings.performanceMonitoring', 'Performance monitoring')}</span>
                          <span className="text-xs text-muted-foreground">{t('settings.performanceDesc', 'Monitor app performance and crashes')}</span>
                        </div>
                      </label>
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 text-primary bg-card border-border rounded focus:ring-primary focus:ring-2 focus:ring-offset-0" 
                        />
                        <div>
                          <span className="text-sm text-foreground block">{t('settings.marketingEmails', 'Marketing emails')}</span>
                          <span className="text-xs text-muted-foreground">{t('settings.marketingDesc', 'Receive updates about new features and tips')}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  
                  {/* Account Deletion */}
                  <div className="pt-4 border-t border-border">
                    <button
                      onClick={handleAccountDelete}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-lg transition-colors duration-200 border border-red-600 hover:border-red-700"
                    >
                      {t('settings.deleteAccount', 'Delete Account')}
                    </button>
                  </div>
            </div>
          </div>
        )}

        {/* Language Section */}
        {activeSection === 'language' && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {t('settings.language', 'Language')}
              </h2>
            </div>
            <LanguagePreferencesSection />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}