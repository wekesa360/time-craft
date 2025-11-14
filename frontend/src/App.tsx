import { useEffect, useState } from 'react';
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
import { PreferencesTest } from './components/PreferencesTest';

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
  LazyAppearanceDemoPage,
} from './pages/LazyPages';

// React Query is now configured in QueryProvider

// Protected Route wrapper with middleware to handle auth initialization
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Wait for auth initialization to complete
  useEffect(() => {
    // If still loading from store, wait
    if (isLoading) {
      setIsCheckingAuth(true);
      return;
    }

    // Check if we have tokens in localStorage
    // If we do, wait a bit for the store to authenticate
    const checkStoredAuth = () => {
      try {
        const authData = localStorage.getItem('timecraft-auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          const hasTokens = parsed?.state?.tokens?.accessToken || parsed?.tokens?.accessToken;
          
          if (hasTokens && !isAuthenticated) {
            console.log('Tokens found in storage, waiting for auth to complete...');
            // Give store time to finish initialization
            setTimeout(() => {
              setIsCheckingAuth(false);
            }, 1500);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to check auth storage:', error);
      }
      
      // No tokens or already authenticated - proceed with check
      setIsCheckingAuth(false);
    };

    checkStoredAuth();
  }, [isAuthenticated, isLoading]);

  // Wait while checking authentication
  if (isCheckingAuth || isLoading) {
    return null; // or a loading spinner
  }

  // Now make authentication decision
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
    // Auth initialization is handled by the rehydration callback in storePersistence.ts
    // No need to call it here to avoid duplicate initialization
    
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
                  <LazyLoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <LazyRegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <LazyForgotPasswordPage />
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

            {/* Demo and Test Routes */}
            <Route
              path="/test-preferences"
              element={
                <ProtectedRoute>
                  <PreferencesTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appearance-demo"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LazyAppearanceDemoPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/design-demo"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div className="p-0">
                      <div className="min-h-screen bg-background">
                        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                          <div className="max-w-[1600px] mx-auto">
                            <div className="mb-6">
                              <h1 className="text-2xl font-bold text-foreground mb-2">Design System Demo</h1>
                              <p className="text-muted-foreground">v0-fitness-app-ui components showcase</p>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                              {/* Component demos would go here */}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AppLayout>
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