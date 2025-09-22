import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import i18n from '../i18n';

// Create a test query client
export const createTestQueryClient = () => new QueryClient({
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

// All providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialLanguage?: string;
}

export const AllProviders: React.FC<AllProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  initialLanguage = 'en'
}) => {
  // Set initial language
  React.useEffect(() => {
    i18n.changeLanguage(initialLanguage);
  }, [initialLanguage]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
};

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialLanguage?: string;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, initialLanguage, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllProviders queryClient={queryClient} initialLanguage={initialLanguage}>
      {children}
    </AllProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<{ data: T }>((resolve) => {
    setTimeout(() => resolve({ data }), delay);
  });
};

export const mockApiError = (message: string, status = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Language test utilities
export const switchLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
};

export const getTranslation = (key: string, options?: any) => {
  return i18n.t(key, options);
};

// DOM test utilities
export const createMockElement = (overrides: Partial<HTMLElement> = {}) => {
  return {
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
    },
    style: {},
    textContent: '',
    innerHTML: '',
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    ...overrides,
  } as unknown as HTMLElement;
};

export const createMockMediaQuery = (matches = false) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Accessibility test utilities
export const mockScreenReader = () => {
  const announcements: string[] = [];
  
  const mockCreateElement = vi.fn().mockImplementation((tagName: string) => {
    const element = createMockElement();
    
    if (tagName === 'div') {
      Object.defineProperty(element, 'textContent', {
        set: (value: string) => {
          if (element.getAttribute('aria-live')) {
            announcements.push(value);
          }
        },
        get: () => '',
      });
    }
    
    return element;
  });

  Object.defineProperty(document, 'createElement', {
    value: mockCreateElement,
    writable: true,
  });

  return {
    getAnnouncements: () => announcements,
    clearAnnouncements: () => announcements.splice(0, announcements.length),
  };
};

// German text test utilities
export const createGermanTextSample = () => ({
  shortText: 'Hallo Welt',
  mediumText: 'Dies ist ein mittellanger deutscher Text.',
  longText: 'Dies ist ein sehr langer deutscher Text mit vielen zusammengesetzten Wörtern wie Benutzereinstellungsverwaltung und Gesundheitsüberwachungssystem.',
  compoundWords: [
    'Benutzereinstellungen',
    'Gesundheitsüberwachung',
    'Softwareentwicklung',
    'Donaudampfschifffahrt',
    'Kraftfahrzeughaftpflichtversicherung'
  ],
  commonPhrases: [
    'Guten Morgen',
    'Wie geht es Ihnen?',
    'Vielen Dank',
    'Auf Wiedersehen',
    'Entschuldigung'
  ]
});

// Test data factories
export const createMockLanguage = (overrides: Partial<any> = {}) => ({
  code: 'de',
  name: 'German',
  nativeName: 'Deutsch',
  ...overrides,
});

export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: '1',
  email: 'test@example.com',
  language: 'en',
  ...overrides,
});

export const createMockLocalizationContent = (overrides: Partial<any> = {}) => ({
  translations: {
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
  },
  metadata: {
    language: 'de',
    coverage: 95,
    lastUpdated: '2024-01-01T00:00:00Z',
  },
  ...overrides,
});

// Async test utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Custom matchers for German text
export const expectGermanText = (element: HTMLElement) => ({
  toHaveGermanAttributes: () => {
    const hasLangAttribute = element.getAttribute('lang') === 'de' || 
                           element.closest('[lang="de"]') !== null;
    const hasGermanClass = element.classList.contains('german-text') ||
                          element.closest('.german-text') !== null;
    
    return {
      pass: hasLangAttribute || hasGermanClass,
      message: () => 'Expected element to have German language attributes'
    };
  },
  toHaveHyphenation: () => {
    const style = window.getComputedStyle(element);
    const hasHyphens = style.hyphens === 'auto' || 
                      element.style.hyphens === 'auto';
    
    return {
      pass: hasHyphens,
      message: () => 'Expected element to have hyphenation enabled'
    };
  }
});

// Export everything for easy importing
export * from '@testing-library/react';
export { vi } from 'vitest';