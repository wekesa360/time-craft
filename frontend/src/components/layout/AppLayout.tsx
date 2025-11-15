import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/auth";
import { useThemeStore } from "../../stores/theme";
import {
  Sparkles,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Navigation items with translation keys
const getNavigationItems = (t: any) => [
  {
    name: t("navigation.dashboard") || "Dashboard",
    href: "/dashboard",
    key: "dashboard",
  },
  {
    name: t("navigation.tasks") || "Tasks",
    href: "/tasks",
    key: "tasks",
  },
  { 
    name: t("navigation.health") || "Health", 
    href: "/health", 
    key: "health" 
  },
  {
    name: t("navigation.calendar") || "Calendar",
    href: "/calendar",
    key: "calendar",
  },
  { 
    name: t("navigation.focus") || "Focus", 
    href: "/focus", 
    key: "focus" 
  },
  { 
    name: t("navigation.badges") || "Badges", 
    href: "/badges", 
    key: "badges" 
  },
  { 
    name: t("navigation.social") || "Social", 
    href: "/social", 
    key: "social" 
  },
];

const secondaryNav = [
  { name: "Settings", href: "/settings" }
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { effectiveTheme, toggleTheme } = useThemeStore();

  const navigation = getNavigationItems(t);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-card border-r border-border overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
              <img 
                src="/favicon_io/android-chrome-192x192.png" 
                alt="Ploracs Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ploracs</h1>
              <p className="text-xs text-muted-foreground">Time & Wellness</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={`
                    block px-6 py-4 rounded-xl text-lg font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                  aria-label={
                    i18n.language === "de"
                      ? `${item.name} aufrufen`
                      : `Go to ${item.name}`
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="px-4 pb-4 space-y-2 border-t border-border pt-4">
            {secondaryNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    block px-6 py-4 rounded-xl text-lg font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="w-full text-left px-6 py-4 rounded-xl text-lg font-medium text-foreground hover:bg-muted transition-all"
              aria-label={i18n.language === "de" ? "Abmelden" : "Sign out"}
            >
              {t("auth.logout") || "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {navigation.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.key}
                to={item.href}
                className={`
                  flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium transition-all min-w-[70px]
                  ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
                `}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
