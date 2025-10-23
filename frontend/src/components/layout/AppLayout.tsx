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
  Sparkles,
  Moon,
  Sun,
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
  const [isDark, setIsDark] = useState(false);

  const navigation = getNavigationItems(t);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="min-h-screen flex">
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
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-[var(--color-card)] border-r border-[var(--color-border)] overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-foreground)]">TimeCraft</h1>
              <p className="text-xs text-[var(--color-muted-foreground)]">Your AI Companion</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white shadow-md"
                        : "text-[var(--color-foreground)] hover:bg-[var(--color-card-hover)]"
                    }
                  `}
                  aria-label={
                    i18n.language === "de"
                      ? `${item.name} aufrufen`
                      : `Go to ${item.name}`
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="px-4 pb-4 space-y-1 border-t border-[var(--color-border)] pt-4">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-card-hover)] transition-all"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-card-hover)] transition-all"
              aria-label={i18n.language === "de" ? "Abmelden" : "Sign out"}
            >
              <LogOut className="w-5 h-5" />
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top header */}
        <header
          className="bg-[var(--color-card)] border-b border-[var(--color-border)]"
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
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
