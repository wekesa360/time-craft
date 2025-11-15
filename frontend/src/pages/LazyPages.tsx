/**
 * Lazy-loaded Page Components
 * Route-based code splitting for better performance
 */

import { withLazyLoading as createLazyComponent, routeLoadingMessages } from '../utils/lazyLoading';

// Auth pages
export const LazyLoginPage = createLazyComponent(
  () => import('./auth/LoginPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading login...</div>
);

export const LazyRegisterPage = createLazyComponent(
  () => import('./auth/RegisterPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading registration...</div>
);

export const LazyForgotPasswordPage = createLazyComponent(
  () => import('./auth/ForgotPasswordPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading password reset...</div>
);

export const LazyResetPasswordPage = createLazyComponent(
  () => import('./auth/ResetPasswordPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading password reset...</div>
);

export const LazyEmailVerificationPage = createLazyComponent(
  () => import('./auth/EmailVerificationPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading email verification...</div>
);

// Public legal pages
export const LazyTermsOfServicePage = createLazyComponent(
  () => import('./TermsOfServicePage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading terms of service...</div>
);

export const LazyPrivacyPolicyPage = createLazyComponent(
  () => import('./PrivacyPolicyPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading privacy policy...</div>
);

// Main application pages
export const LazyDashboard = createLazyComponent(
  () => import('./Dashboard'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.dashboard}</div>
);

export const LazyTasksPage = createLazyComponent(
  () => import('./TasksPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.tasks}</div>
);

export const LazyHealthPage = createLazyComponent(
  () => import('./HealthPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.health}</div>
);

export const LazyCalendarPage = createLazyComponent(
  () => import('./CalendarPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.calendar}</div>
);

export const LazyFocusPage = createLazyComponent(
  () => import('./FocusPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.focus}</div>
);

export const LazyBadgesPage = createLazyComponent(
  () => import('./BadgesPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading badges...</div>
);

export const LazySocialPage = createLazyComponent(
  () => import('./SocialPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.social}</div>
);

export const LazyVoicePage = createLazyComponent(
  () => import('./VoicePage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.voice}</div>
);

export const LazyNotificationsPage = createLazyComponent(
  () => import('./NotificationsPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading notifications...</div>
);

export const LazyStudentPage = createLazyComponent(
  () => import('./StudentPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading student page...</div>
);

export const LazyAnalyticsPage = createLazyComponent(
  () => import('./AnalyticsPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.analytics}</div>
);

export const LazySettingsPage = createLazyComponent(
  () => import('./SettingsPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.settings}</div>
);

export const LazyLocalizationPage = createLazyComponent(
  () => import('../components/localization/LazyLocalizationComponents').then(module => ({ default: module.LocalizationPageWithSuspense })),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading localization...</div>
);

// Admin pages (lazy-loaded with admin guard)
export const LazyAdminDashboard = createLazyComponent(
  () => import('./admin/AdminDashboard'),
  () => <div className="flex items-center justify-center min-h-[200px]">{routeLoadingMessages.admin}</div>
);

// Demo pages
export const LazyAppearanceDemoPage = createLazyComponent(
  () => import('./AppearanceDemoPage'),
  () => <div className="flex items-center justify-center min-h-[200px]">Loading appearance demo...</div>
);

// Preload functions for route prefetching
export const preloadRoutes = {
  dashboard: () => import('./Dashboard'),
  tasks: () => import('./TasksPage'),
  health: () => import('./HealthPage'),
  calendar: () => import('./CalendarPage'),
  focus: () => import('./FocusPage'),
  badges: () => import('./BadgesPage'),
  social: () => import('./SocialPage'),
  voice: () => import('./VoicePage'),
  notifications: () => import('./NotificationsPage'),
  student: () => import('./StudentPage'),
  analytics: () => import('./AnalyticsPage'),
  settings: () => import('./SettingsPage'),
  localization: () => import('../components/localization/LazyLocalizationComponents'),
  admin: () => import('./admin/AdminDashboard'),
  terms: () => import('./TermsOfServicePage'),
  privacy: () => import('./PrivacyPolicyPage'),
  appearanceDemo: () => import('./AppearanceDemoPage'),
};