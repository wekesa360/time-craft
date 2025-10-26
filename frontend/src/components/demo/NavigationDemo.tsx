import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Heart, 
  Calendar, 
  Target, 
  Award, 
  BarChart3, 
  Settings,
  Users,
  Mic,
  Shield
} from 'lucide-react';

/**
 * Demo component showcasing navigation with German translations
 */
export const NavigationDemo: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isGerman = i18n.language === 'de';

  // Navigation items with translation keys
  const navigationItems = [
    { name: t('navigation.dashboard'), icon: LayoutDashboard, key: 'dashboard' },
    { name: t('navigation.tasks'), icon: CheckSquare, key: 'tasks' },
    { name: t('navigation.health'), icon: Heart, key: 'health' },
    { name: t('navigation.calendar'), icon: Calendar, key: 'calendar' },
    { name: t('navigation.focus'), icon: Target, key: 'focus' },
    { name: t('navigation.badges'), icon: Award, key: 'badges' },
    { name: t('navigation.social'), icon: Users, key: 'social' },
    { name: t('navigation.voice'), icon: Mic, key: 'voice' },
    { name: t('navigation.analytics'), icon: BarChart3, key: 'analytics' },
    { name: t('navigation.admin'), icon: Shield, key: 'admin' },
    { name: t('navigation.settings'), icon: Settings, key: 'settings' },
  ];

  if (!isGerman) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Navigation Demo</h2>
        <p className="text-foreground-secondary">
          Switch to German language to see the navigation translations in action.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Navigation mit deutschen Übersetzungen</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-foreground-secondary">
            Die Navigation wurde vollständig ins Deutsche übersetzt und unterstützt Barrierefreiheit:
          </p>

          {/* Navigation Preview */}
          <div className="bg-muted dark:bg-muted rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3 text-foreground-secondary">Navigationsvorschau:</h3>
            <nav className="space-y-2" aria-label="Beispiel-Navigation">
              {navigationItems.map((item, index) => (
                <div
                  key={item.key}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
                    ${
                      index === 0 
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300' 
                        : 'text-foreground-secondary hover:text-foreground hover:bg-background-tertiary'
                    }
                  `}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.name} aufrufen`}
                  aria-current={index === 0 ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.name}</span>
                  {index === 0 && (
                    <span className="ml-auto text-xs bg-primary-200 dark:bg-primary-800 px-2 py-1 rounded">
                      Aktiv
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};