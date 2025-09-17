// UI state store with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '../types';

export type ViewType = 
  | 'dashboard' 
  | 'tasks' 
  | 'health' 
  | 'calendar' 
  | 'focus' 
  | 'badges' 
  | 'analytics'
  | 'settings'
  | 'profile';

export interface UIState {
  // Navigation
  sidebarOpen: boolean;
  currentView: ViewType;
  mobileMenuOpen: boolean;
  
  // Modals and overlays
  modals: {
    taskForm: boolean;
    healthForm: boolean;
    eventForm: boolean;
    profileSettings: boolean;
    themeSettings: boolean;
    notifications: boolean;
  };
  
  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  
  // Loading states
  globalLoading: boolean;
  
  // Layout preferences
  preferences: {
    sidebarCollapsed: boolean;
    compactMode: boolean;
    animationsEnabled: boolean;
    showWelcomeTour: boolean;
  };
}

interface UIStore extends UIState {
  // Navigation actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentView: (view: ViewType) => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Modal actions
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateUnreadCount: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  
  // Preference actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setShowWelcomeTour: (show: boolean) => void;
  updatePreference: <K extends keyof UIState['preferences']>(
    key: K, 
    value: UIState['preferences'][K]
  ) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      currentView: 'dashboard',
      mobileMenuOpen: false,
      
      modals: {
        taskForm: false,
        healthForm: false,
        eventForm: false,
        profileSettings: false,
        themeSettings: false,
        notifications: false,
      },
      
      notifications: [],
      unreadNotificationsCount: 0,
      globalLoading: false,
      
      preferences: {
        sidebarCollapsed: false,
        compactMode: false,
        animationsEnabled: true,
        showWelcomeTour: true,
      },

      // Navigation actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
      },

      setCurrentView: (view) => {
        set({ currentView: view });
        // Close mobile menu when navigating
        if (get().mobileMenuOpen) {
          set({ mobileMenuOpen: false });
        }
      },

      setMobileMenuOpen: (open) => {
        set({ mobileMenuOpen: open });
      },

      // Modal actions
      openModal: (modal) => {
        set((state) => ({
          modals: { ...state.modals, [modal]: true },
        }));
      },

      closeModal: (modal) => {
        set((state) => ({
          modals: { ...state.modals, [modal]: false },
        }));
      },

      closeAllModals: () => {
        set({
          modals: {
            taskForm: false,
            healthForm: false,
            eventForm: false,
            profileSettings: false,
            themeSettings: false,
            notifications: false,
          },
        });
      },

      // Notification actions
      setNotifications: (notifications) => {
        set({ notifications });
        get().updateUnreadCount();
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
        }));
        get().updateUnreadCount();
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
        get().updateUnreadCount();
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true, readAt: Date.now() } : n
          ),
        }));
        get().updateUnreadCount();
      },

      markAllNotificationsAsRead: () => {
        const now = Date.now();
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt || now,
          })),
        }));
        get().updateUnreadCount();
      },

      updateUnreadCount: () => {
        const { notifications } = get();
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ unreadNotificationsCount: unreadCount });
      },

      // Loading actions
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading });
      },

      // Preference actions
      setSidebarCollapsed: (collapsed) => {
        set((state) => ({
          preferences: { ...state.preferences, sidebarCollapsed: collapsed },
        }));
      },

      setCompactMode: (compact) => {
        set((state) => ({
          preferences: { ...state.preferences, compactMode: compact },
        }));
      },

      setAnimationsEnabled: (enabled) => {
        set((state) => ({
          preferences: { ...state.preferences, animationsEnabled: enabled },
        }));
        
        // Apply to document for CSS animations
        if (typeof window !== 'undefined') {
          document.documentElement.style.setProperty(
            '--animation-duration',
            enabled ? '0.2s' : '0s'
          );
        }
      },

      setShowWelcomeTour: (show) => {
        set((state) => ({
          preferences: { ...state.preferences, showWelcomeTour: show },
        }));
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
      }),
    }
  )
);