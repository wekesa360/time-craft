import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";
import { ThemeToggle } from "../theme/ThemeToggle";
import { NotificationCenter } from "../common/NotificationCenter";
import { SimpleLanguageSelector } from "../common/SimpleLanguageSelector";
import {
  AccessibilityProvider,
  useAccessibilityContext,
} from "../accessibility/AccessibilityProvider";
import { AccessibleNavigation } from "../ui/AccessibleNavigation";
import {
  GermanAccessibleNavigation,
  GermanAccessibleMain,
} from "../accessibility/GermanAccessibilityProvider";
import { Breadcrumbs } from "../navigation/Breadcrumbs";
import {
  LayoutDashboard,
  CheckSquare,
  Heart,
  Calendar,
  Target,
  Award,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Users,
  Mic,
  Shield,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Navigation items with translation keys
const getNavigationItems = (t: any) => [
  {
    name: t("navigation.dashboard"),
    href: "/dashboard",
    icon: LayoutDashboard,
    key: "dashboard",
  },
  {
    name: t("navigation.tasks"),
    href: "/tasks",
    icon: CheckSquare,
    key: "tasks",
  },
  { name: t("navigation.health"), href: "/health", icon: Heart, key: "health" },
  {
    name: t("navigation.calendar"),
    href: "/calendar",
    icon: Calendar,
    key: "calendar",
  },
  { name: t("navigation.focus"), href: "/focus", icon: Target, key: "focus" },
  { name: t("navigation.badges"), href: "/badges", icon: Award, key: "badges" },
  { name: t("navigation.social"), href: "/social", icon: Users, key: "social" },
  // { name: t('navigation.voice'), href: '/voice', icon: Mic, key: 'voice' },
  // { name: t('navigation.analytics'), href: '/analytics', icon: BarChart3, key: 'analytics' },
  // { name: t('navigation.admin'), href: '/admin', icon: Shield, key: 'admin' },
  {
    name: t("navigation.settings"),
    href: "/settings",
    icon: Settings,
    key: "settings",
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = getNavigationItems(t);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-white/20 dark:bg-black/20 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          aria-label={
            i18n.language === "de" ? "Seitenleiste schließen" : "Close sidebar"
          }
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Sidebar */}
      <div
        id="sidebar-navigation"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-background-secondary border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        role="complementary"
        aria-label={
          i18n.language === "de" ? "Seitennavigation" : "Sidebar navigation"
        }
        aria-hidden={!sidebarOpen ? "true" : "false"}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TC</span>
              </div>
              <span className="text-lg font-semibold text-foreground">
                TimeCraft
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden btn-ghost p-1"
              aria-label={
                i18n.language === "de"
                  ? "Seitenleiste schließen"
                  : "Close sidebar"
              }
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <GermanAccessibleNavigation
            className="flex-1 px-4 py-6 space-y-2"
            ariaLabel={
              i18n.language === "de" ? "Hauptnavigation" : "Main navigation"
            }
          >
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                        : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary"
                    }
                  `}
                  aria-label={
                    i18n.language === "de"
                      ? `${item.name} aufrufen`
                      : `Go to ${item.name}`
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </GermanAccessibleNavigation>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || "User"}
                </p>
                <p className="text-xs text-foreground-secondary">Free Plan</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-tertiary rounded-lg transition-colors"
              aria-label={i18n.language === "de" ? "Abmelden" : "Sign out"}
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>{t("auth.logout")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header
          className="bg-background border-b border-border"
          role="banner"
          aria-label={
            i18n.language === "de"
              ? "Kopfzeile der Anwendung"
              : "Application header"
          }
        >
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-ghost p-2"
              aria-label={
                i18n.language === "de" ? "Seitenleiste öffnen" : "Open sidebar"
              }
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-navigation"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex-1 lg:flex-none">
              <Breadcrumbs showHome={true} className="hidden sm:flex" />
            </div>

            <div
              className="flex items-center space-x-4"
              role="toolbar"
              aria-label={
                i18n.language === "de"
                  ? "Benutzer-Werkzeugleiste"
                  : "User toolbar"
              }
            >
              <NotificationCenter isOpen={false} onClose={() => {}} />
              <SimpleLanguageSelector
                variant="compact"
                className="data-testid=language-selector"
              />
              <ThemeToggle />

              {/* User menu */}
              <div className="relative">
                <button
                  className="btn-ghost p-2"
                  aria-label={
                    i18n.language === "de"
                      ? "Benutzermenü öffnen"
                      : "Open user menu"
                  }
                >
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" aria-hidden="true" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <GermanAccessibleMain
          className="p-6"
          ariaLabel={i18n.language === "de" ? "Hauptinhalt" : "Main content"}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </GermanAccessibleMain>
      </div>
    </div>
  );
}
