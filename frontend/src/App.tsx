import { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Stores
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';

// Utils
import { registerCacheServiceWorker } from './utils/serviceWorkerCache';
import { initializePerformanceMonitoring } from './utils/performance';

// Error Boundary
import { ErrorBoundary } from './components/error/ErrorBoundary';

// Providers
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './components/providers/ThemeProvider';
import { LocalizationProvider } from './contexts/LocalizationContext';
import { SSENotificationHandler } from './components/common/SSEStatus';
import { OfflineQueueHandler } from './components/common/OfflineQueueHandler';
import { AccessibilityProvider } from './components/accessibility/AccessibilityProvider';
import { GermanAccessibilityProvider } from './components/accessibility/GermanAccessibilityProvider';
import { AdminGuard, StudentGuard } from './components/auth/RoleGuard';

// Components
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import LegalLayout from './components/layout/LegalLayout';

// Lazy-loaded pages for better performance
import {
  LazyLoginPage,
  LazyRegisterPage,
  LazyForgotPasswordPage,
  LazyResetPasswordPage,
  LazyTermsOfServicePage,
  LazyPrivacyPolicyPage,
  LazyDashboard,
  LazyTasksPage,
  LazyHealthPage,
  LazyCalendarPage,
  LazyFocusPage,
  LazyBadgesPage,
  LazySocialPage,
  LazyVoicePage,
  LazyNotificationsPage,
  LazyStudentPage,
  LazyAnalyticsPage,
  LazySettingsPage,
  LazyLocalizationPage,
  LazyAdminDashboard,
} from './pages/LazyPages';

// React Query is now configured in QueryProvider

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Unprotected Route wrapper (accessible to both authenticated and non-authenticated users)
function UnprotectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function App() {
  const { i18n } = useTranslation();
  const { applyTheme } = useThemeStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Always initialize authentication to check token validity
    initialize();

    // Apply theme on mount
    applyTheme();

    // Set document language
    document.documentElement.lang = i18n.language;

    // Initialize performance monitoring
    const performanceMonitor = initializePerformanceMonitoring();

    // Register service worker for translation caching
    if (process.env.NODE_ENV === 'production') {
      registerCacheServiceWorker().then((registered) => {
        if (registered) {
          console.log('Translation cache service worker registered successfully');
        }
      }).catch((error) => {
        console.error('Failed to register translation cache service worker:', error);
      });
    }

    return () => {
      performanceMonitor?.destroy();
    };
  }, [applyTheme, i18n.language, initialize]);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <QueryProvider>
        <ThemeProvider>
          <LocalizationProvider>
            <AccessibilityProvider>
              <GermanAccessibilityProvider
                enableKeyboardShortcuts={true}
                enableHighContrastMode={true}
                enableScreenReaderSupport={true}
              >
              <Toaster position="top-right" />
              <SSENotificationHandler />
              <OfflineQueueHandler />
              <Router>
          <div className="App">
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LazyLoginPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LazyRegisterPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LazyForgotPasswordPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <LazyResetPasswordPage />
                  </AuthLayout>
                </PublicRoute>
              }
            />

            {/* Legal pages - publicly accessible */}
            <Route
              path="/terms"
              element={
                <UnprotectedRoute>
                  <LegalLayout>
                    <LazyTermsOfServicePage />
                  </LegalLayout>
                </UnprotectedRoute>
              }
            />
            <Route
              path="/privacy"
              element={
                <UnprotectedRoute>
                  <LegalLayout>
                    <LazyPrivacyPolicyPage />
                  </LegalLayout>
                </UnprotectedRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyTasksPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/health"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyHealthPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyCalendarPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/focus"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyFocusPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyBadgesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyAnalyticsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazySettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/localization"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyLocalizationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* New feature routes */}
            <Route
              path="/social"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazySocialPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/voice"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyVoicePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyNotificationsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <StudentGuard>
                    <AppLayout>
                      <LazyStudentPage />
                    </AppLayout>
                  </StudentGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AppLayout>
                      <LazyAdminDashboard />
                    </AppLayout>
                  </AdminGuard>
                </ProtectedRoute>
              }
            />

            {/* Redirect root based on authentication */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              },
              success: {
                style: {
                  background: 'var(--color-success-light)',
                  color: 'var(--color-success)',
                  border: '1px solid var(--color-success)',
                },
              },
              error: {
                style: {
                  background: 'var(--color-error-light)',
                  color: 'var(--color-error)',
                  border: '1px solid var(--color-error)',
                },
              },
            }}
          />
          </div>
        </Router>
            </GermanAccessibilityProvider>
            </AccessibilityProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;