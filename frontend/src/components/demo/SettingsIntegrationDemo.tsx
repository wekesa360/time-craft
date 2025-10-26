import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, User, Bell, Shield, Database, Check, ArrowRight } from 'lucide-react';

/**
 * Demo component showcasing settings page integration with German localization
 */
export const SettingsIntegrationDemo: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState('language');
  const isGerman = i18n.language === 'de';

  const settingsSections = [
    {
      id: 'appearance',
      name: t('settings.themeSettings.appearance', 'Appearance'),
      icon: Settings,
      description: t('settings.themeSettings.title', 'Theme settings and visual preferences')
    },
    {
      id: 'account',
      name: t('settings.account', 'Account'),
      icon: User,
      description: t('settings.profileForm.email', 'Profile and account information')
    },
    {
      id: 'language',
      name: t('settings.language', 'Language'),
      icon: Globe,
      description: t('localization.languageSettings', 'Language preferences and localization')
    },
    {
      id: 'notifications',
      name: t('settings.notifications', 'Notifications'),
      icon: Bell,
      description: t('settings.taskReminders', 'Notification preferences')
    },
    {
      id: 'privacy',
      name: t('settings.privacy', 'Privacy'),
      icon: Shield,
      description: t('settings.dataCollection', 'Privacy and security settings')
    },
    {
      id: 'data',
      name: t('settings.dataManagement', 'Data'),
      icon: Database,
      description: t('settings.storageUsage', 'Data management and storage')
    }
  ];

  if (!isGerman) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Settings Integration Demo</h2>
        <p className="text-foreground-secondary">
          Switch to German language to see the settings page integration in action.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-primary-500" />
          <h2 className="text-lg font-semibold">
            Einstellungsseiten-Integration
          </h2>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-foreground-secondary">
            Die Einstellungsseite wurde vollständig für die deutsche Lokalisierung optimiert:
          </p>

          {/* Settings Navigation Demo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Navigation Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-muted dark:bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3 text-foreground-secondary">
                  Navigationsleiste:
                </h3>
                <nav className="space-y-2">
                  {settingsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left
                        ${
                          activeSection === section.id
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                            : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
                        }
                      `}
                    >
                      <section.icon className="w-4 h-4" aria-hidden="true" />
                      <span>{section.name}</span>
                      {activeSection === section.id && (
                        <ArrowRight className="w-3 h-3 ml-auto" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-muted border border-border rounded-lg p-6">
                {activeSection === 'language' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Globe className="w-5 h-5 text-primary-500" />
                      <h3 className="text-lg font-semibold">Spracheinstellungen</h3>
                    </div>
                    
                    <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🇩🇪</span>
                        <div>
                          <h4 className="font-medium text-primary-900 dark:text-primary-100">
                            Aktuelle Sprache: Deutsch
                          </h4>
                          <p className="text-sm text-primary-700 dark:text-primary-300">
                            Aktiv • 95% Abdeckung
                          </p>
                        </div>
                        <Check className="w-5 h-5 text-primary-600 dark:text-primary-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                )}
                
                {activeSection !== 'language' && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">
                      {settingsSections.find(s => s.id === activeSection)?.icon && 
                        React.createElement(settingsSections.find(s => s.id === activeSection)!.icon, {
                          className: "w-12 h-12 mx-auto text-muted-foreground"
                        })
                      }
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {settingsSections.find(s => s.id === activeSection)?.name}
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      {settingsSections.find(s => s.id === activeSection)?.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};