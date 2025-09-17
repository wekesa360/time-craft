import { useEffect } from 'react';
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
  const { isAuthenticated, initialize, isLoading } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          {/* Animated logo */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary-600"></div>
              </div>
              <div className="absolute -inset-4">
                <div className="w-24 h-24 border-2 border-primary-300 dark:border-primary-700 rounded-full animate-spin border-t-primary-600"></div>
              </div>
            </div>
          </div>
          
          {/* App name and loading message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('app.name')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('loading')}...
          </p>
          
          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

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

  useEffect(() => {
    // Apply theme on mount
    applyTheme();

    // Set up theme change listener
    const handleThemeChange = () => applyTheme();
    window.addEventListener('themeChange', handleThemeChange);

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
      window.removeEventListener('themeChange', handleThemeChange);
      performanceMonitor?.destroy();
    };
  }, [applyTheme, i18n.language]);

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

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
          </LocalizationProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;