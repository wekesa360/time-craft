# German Localization Developer Guide

Quick reference guide for developers working with German localization features in TimeCraft.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Translation Hooks](#translation-hooks)
3. [Component Usage](#component-usage)
4. [Performance Optimization](#performance-optimization)
5. [Testing](#testing)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Translation Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome.title', 'Welcome')}</h1>
      <p>{t('welcome.description', 'Welcome to TimeCraft')}</p>
    </div>
  );
}
```

### Optimized Translation Hook

```typescript
import { useOptimizedTranslation } from '../hooks/useOptimizedTranslation';

function MyComponent() {
  const { t } = useOptimizedTranslation({
    enableCache: true,
    keyPrefix: 'myComponent'
  });
  
  return <h1>{t('title', 'Default Title')}</h1>;
}
```

### Language Selector Integration

```typescript
import { LanguageSelector } from '../components/common/LanguageSelector';

function Header() {
  return (
    <header>
      <LanguageSelector 
        variant="compact"
        showFlags={true}
        onLanguageChange={(lang) => console.log('Language changed:', lang)}
      />
    </header>
  );
}
```

## Translation Hooks

### useOptimizedTranslation

Optimized translation hook with caching and performance enhancements.

```typescript
const { t, tBatch, tWithValues } = useOptimizedTranslation({
  enableCache: true,        // Enable translation caching
  namespace: 'common',      // Translation namespace
  keyPrefix: 'buttons',     // Key prefix for all translations
  fallback: 'Loading...'    // Default fallback text
});

// Basic usage
const title = t('save', 'Save');

// Batch translations
const [save, cancel, submit] = tBatch(['save', 'cancel', 'submit']);

// With interpolation
const greeting = tWithValues('greeting', { name: 'John' }, 'Hello {{name}}');
```

### useStaticTranslation

For translations that don't change often (better performance).

```typescript
const staticTexts = useStaticTranslation([
  'navigation.dashboard',
  'navigation.tasks',
  'navigation.settings'
], 'navigation');

// Returns: { 'navigation.dashboard': 'Dashboard', ... }
```

### useFormTranslation

Specialized hook for form translations.

```typescript
const { getFieldLabel, getFieldError, getFieldPlaceholder } = useFormTranslation('loginForm');

const emailLabel = getFieldLabel('email');        // "E-Mail-Adresse"
const emailError = getFieldError('email', 'required'); // "E-Mail ist erforderlich"
const emailPlaceholder = getFieldPlaceholder('email'); // "ihre.email@beispiel.de"
```

### useNavigationTranslation

Pre-optimized navigation translations.

```typescript
const { navigationItems } = useNavigationTranslation();

// Returns object with all navigation items translated
// { dashboard: 'Dashboard', tasks: 'Aufgaben', ... }
```

## Component Usage

### Language Selector Variants

```typescript
// Dropdown variant (full featured)
<LanguageSelector 
  variant="dropdown"
  showLabel={true}
  showFlags={true}
  className="settings-language-selector"
/>

// Compact variant (header usage)
<LanguageSelector 
  variant="compact"
  showFlags={true}
  className="header-language-selector"
/>

// Button variant (settings page)
<LanguageSelector 
  variant="buttons"
  showLabel={true}
  showFlags={true}
/>
```

### German Text Optimizer

Optimizes text layout for German content.

```typescript
import { GermanTextOptimizer, GermanTitle } from '../components/common/GermanTextOptimizer';

function MyComponent() {
  return (
    <GermanTextOptimizer className="my-component">
      <GermanTitle level={1} className="main-title">
        {t('page.title', 'Page Title')}
      </GermanTitle>
      <p>{t('page.description', 'Description text')}</p>
    </GermanTextOptimizer>
  );
}
```

### Lazy Loading Components

```typescript
import { 
  LocalizationPageWithSuspense,
  CacheManagementSectionWithSuspense 
} from '../components/localization/LazyLocalizationComponents';

// Use in routes
<Route path="/localization" element={<LocalizationPageWithSuspense />} />

// Use in settings
<CacheManagementSectionWithSuspense />
```

## Performance Optimization

### Component Memoization

```typescript
import { memoWithComparison, shallowEqual } from '../utils/performanceOptimization';

const MyComponent = memoWithComparison(
  ({ data, onUpdate }) => {
    const { t } = useOptimizedTranslation();
    return <div>{t('title')}</div>;
  },
  shallowEqual // Custom comparison function
);
```

### Performance Monitoring

```typescript
import { withPerformanceMonitoring } from '../utils/performanceOptimization';

const MonitoredComponent = withPerformanceMonitoring(
  MyComponent,
  'MyComponent' // Label for monitoring
);
```

### Translation Caching

```typescript
import { translationCache } from '../utils/translationCache';

// Manual cache operations
const cachedTranslation = await translationCache.get('de', '1.0.0');
await translationCache.set('de', translations, metadata);
translationCache.clear();

// Cache statistics
const stats = translationCache.getStats();
console.log('Cache hit rate:', stats.hitRate);
```

## Testing

### Translation Testing

```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../test-utils/i18n-test';

// Mock translations for testing
const mockTranslations = {
  en: { translation: { 'button.save': 'Save' } },
  de: { translation: { 'button.save': 'Speichern' } }
};

test('renders German translation', () => {
  i18n.changeLanguage('de');
  
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(screen.getByText('Speichern')).toBeInTheDocument();
});
```

### Performance Testing

```typescript
import { performanceMonitor } from '../utils/performanceOptimization';

test('component renders within performance budget', () => {
  const endTiming = performanceMonitor.startTiming('test-render');
  
  render(<MyComponent />);
  
  endTiming();
  
  const metrics = performanceMonitor.getMetrics('test-render');
  expect(metrics.avg).toBeLessThan(16); // 60fps budget
});
```

### Cache Testing

```typescript
import { translationCache } from '../utils/translationCache';

beforeEach(() => {
  translationCache.clear();
});

test('caches translations correctly', async () => {
  const testData = { hello: 'Hallo' };
  const metadata = { language: 'de', version: '1.0.0', coverage: 100 };
  
  await translationCache.set('de', testData, metadata);
  const cached = await translationCache.get('de', '1.0.0');
  
  expect(cached.data).toEqual(testData);
});
```

## Common Patterns

### Conditional Translation Loading

```typescript
function MyComponent({ showGerman = false }) {
  const { t } = useOptimizedTranslation({
    enableCache: showGerman, // Only cache if German might be used
    namespace: showGerman ? 'german' : 'common'
  });
  
  return <div>{t('content')}</div>;
}
```

### Form Validation with German Messages

```typescript
import { useFormTranslation } from '../hooks/useOptimizedTranslation';

function LoginForm() {
  const { getFieldError } = useFormTranslation('auth');
  
  const validationSchema = {
    email: {
      required: getFieldError('email', 'required'),
      invalid: getFieldError('email', 'invalid')
    }
  };
  
  return <form>{/* form content */}</form>;
}
```

### Dynamic Translation Keys

```typescript
function StatusBadge({ status }) {
  const { t } = useOptimizedTranslation({ keyPrefix: 'status' });
  
  // Dynamically construct translation key
  const statusText = t(status, status); // e.g., t('completed', 'completed')
  
  return <span className={`status-${status}`}>{statusText}</span>;
}
```

### Pluralization

```typescript
function TaskCounter({ count }) {
  const { t } = useTranslation();
  
  return (
    <span>
      {t('tasks.count', '{{count}} task', { 
        count, 
        defaultValue_plural: '{{count}} tasks' 
      })}
    </span>
  );
}
```

### Context-Aware Translations

```typescript
function ContextualButton({ context, action }) {
  const { t } = useOptimizedTranslation({ keyPrefix: `actions.${context}` });
  
  return (
    <button>
      {t(action, action)} {/* e.g., t('save') in 'actions.form' context */}
    </button>
  );
}
```

## Troubleshooting

### Common Issues and Solutions

#### Translation Not Updating
```typescript
// Force translation refresh
import { clearTranslationCache } from '../utils/translationCache';

clearTranslationCache();
window.location.reload();
```

#### Performance Issues
```typescript
// Check performance metrics
import { performanceMonitor } from '../utils/performanceOptimization';

const allMetrics = performanceMonitor.getAllMetrics();
console.table(allMetrics);

// Clear performance data
performanceMonitor.clear();
```

#### Cache Issues
```typescript
// Validate cache integrity
const integrity = translationCache.validateIntegrity();
console.log('Cache integrity:', integrity);

// Clear corrupted cache
if (integrity.corrupted > 0) {
  translationCache.clear();
}
```

### Debug Mode

```typescript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  window.debugTranslations = true;
  
  // Log all translation requests
  const originalT = i18n.t;
  i18n.t = (...args) => {
    console.log('Translation request:', args);
    return originalT.apply(i18n, args);
  };
}
```

### Performance Profiling

```typescript
import { performanceMonitor } from '../utils/performanceOptimization';

// Profile component rendering
function ProfiledComponent() {
  const endTiming = performanceMonitor.startTiming('ProfiledComponent');
  
  useEffect(() => {
    return () => endTiming();
  }, [endTiming]);
  
  return <div>Component content</div>;
}
```

## Best Practices

### Do's
- ✅ Use `useOptimizedTranslation` for better performance
- ✅ Enable caching for frequently used translations
- ✅ Use lazy loading for large localization components
- ✅ Implement proper fallbacks for missing translations
- ✅ Test with both English and German content
- ✅ Monitor performance with built-in tools

### Don'ts
- ❌ Don't use raw `useTranslation` in performance-critical components
- ❌ Don't forget to clear cache during development
- ❌ Don't hardcode text strings in components
- ❌ Don't ignore performance metrics warnings
- ❌ Don't skip testing with German content
- ❌ Don't disable caching without good reason

### Performance Tips
- Use `React.memo` for components with stable props
- Implement lazy loading for non-critical localization features
- Enable translation caching for better user experience
- Monitor cache hit rates and optimize accordingly
- Use bundle splitting to reduce initial load time

---

*For more detailed information, refer to the complete feature documentation and user guide.*