/**
 * Test Utilities
 * Custom render functions and test helpers for consistent testing
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AccessibilityProvider } from '../components/accessibility/AccessibilityProvider';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import i18n from '../i18n';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Custom render function with all providers
interface AllTheProvidersProps {
  children: ReactNode;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <AccessibilityProvider>
              {children}
            </AccessibilityProvider>
          </ThemeProvider>
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Minimal wrapper for testing components that don't need full context
interface MinimalProvidersProps {
  children: ReactNode;
}

const MinimalProviders: React.FC<MinimalProvidersProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
};

const minimalRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: MinimalProviders, ...options });
};

// Accessibility testing wrapper
interface AccessibilityTestProvidersProps {
  children: ReactNode;
}

const AccessibilityTestProviders: React.FC<AccessibilityTestProvidersProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </I18nextProvider>
  );
};

const accessibilityRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AccessibilityTestProviders, ...options });
};

// Mock data generators
export const mockUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  subscription: 'free' as const,
  preferences: {
    theme: 'light' as const,
    language: 'en' as const,
    notifications: true,
  },
};

export const mockTask = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'This is a test task',
  completed: false,
  urgency: 5,
  importance: 5,
  dueDate: new Date().toISOString(),
  tags: ['test', 'example'],
  userId: 'test-user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockFocusSession = {
  id: 'test-session-1',
  userId: 'test-user-1',
  duration: 1500, // 25 minutes
  type: 'work' as const,
  status: 'completed' as const,
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 1500000).toISOString(),
  taskId: 'test-task-1',
  notes: 'Test focus session',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Utility functions for testing
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
};

export const mockMediaQuery = (query: string, matches: boolean = false) => {
  const mockMatchMedia = vi.fn().mockImplementation(() => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });

  return mockMatchMedia;
};

export const mockLocalStorage = () => {
  const mockStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
  });

  return mockStorage;
};

// Custom matchers and assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name);
};

export const expectElementToHaveRole = (element: HTMLElement, role: string) => {
  expect(element).toHaveRole(role);
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Export custom render functions
export { 
  customRender as render, 
  minimalRender,
  accessibilityRender,
  createTestQueryClient 
};