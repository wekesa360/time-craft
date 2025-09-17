/**
 * Lazy-loaded Page Components
 * Route-based code splitting for better performance
 */

import { createLazyComponent, routeLoadingMessages } from '../utils/lazyLoading';

// Auth pages
export const LazyLoginPage = createLazyComponent(
  () => import('./auth/LoginPage'),
  'Loading login...'
);

export const LazyRegisterPage = createLazyComponent(
  () => import('./auth/RegisterPage'),
  'Loading registration...'
);

export const LazyForgotPasswordPage = createLazyComponent(
  () => import('./auth/ForgotPasswordPage'),
  'Loading password reset...'
);

// Public legal pages
export const LazyTermsOfServicePage = createLazyComponent(
  () => import('./TermsOfServicePage'),
  'Loading terms of service...'
);

export const LazyPrivacyPolicyPage = createLazyComponent(
  () => import('./PrivacyPolicyPage'),
  'Loading privacy policy...'
);

// Main application pages
export const LazyDashboard = createLazyComponent(
  () => import('./Dashboard'),
  routeLoadingMessages.dashboard
);

export const LazyTasksPage = createLazyComponent(
  () => import('./TasksPage'),
  routeLoadingMessages.tasks
);

export const LazyHealthPage = createLazyComponent(
  () => import('./HealthPage'),
  routeLoadingMessages.health
);

export const LazyCalendarPage = createLazyComponent(
  () => import('./CalendarPage'),
  routeLoadingMessages.calendar
);

export const LazyFocusPage = createLazyComponent(
  () => import('./FocusPage'),
  routeLoadingMessages.focus
);

export const LazyBadgesPage = createLazyComponent(
  () => import('./BadgesPage'),
  routeLoadingMessages.badges
);

export const LazySocialPage = createLazyComponent(
  () => import('./SocialPage'),
  routeLoadingMessages.social
);

export const LazyVoicePage = createLazyComponent(
  () => import('./VoicePage').then(module => ({ default: module.VoicePage })),
  routeLoadingMessages.voice
);

export const LazyNotificationsPage = createLazyComponent(
  () => import('./NotificationsPage').then(module => ({ default: module.NotificationsPage })),
  routeLoadingMessages.notifications
);

export const LazyStudentPage = createLazyComponent(
  () => import('./StudentPage').then(module => ({ default: module.StudentPage })),
  routeLoadingMessages.student
);

export const LazyAnalyticsPage = createLazyComponent(
  () => import('./AnalyticsPage'),
  routeLoadingMessages.analytics
);

export const LazySettingsPage = createLazyComponent(
  () => import('./SettingsPage'),
  routeLoadingMessages.settings
);

export const LazyLocalizationPage = createLazyComponent(
  () => import('../components/localization/LazyLocalizationComponents').then(module => ({ default: module.LocalizationPageWithSuspense })),
  routeLoadingMessages.localization
);

// Admin pages (lazy-loaded with admin guard)
export const LazyAdminDashboard = createLazyComponent(
  () => import('./admin/AdminDashboard'),
  routeLoadingMessages.admin
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
};