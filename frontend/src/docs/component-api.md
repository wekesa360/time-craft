# Component API Documentation

This document provides comprehensive API documentation for all frontend components in the Time & Wellness application.

## Table of Contents

- [Core Components](#core-components)
- [Feature Components](#feature-components)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Error Components](#error-components)
- [Accessibility Components](#accessibility-components)

## Core Components

### App

The main application component that provides the overall structure and routing.

```typescript
interface AppProps {
  // No props - root component
}

// Usage
<App />
```

**Features:**
- Global error boundary
- Theme provider
- Query client provider
- Router setup
- Accessibility provider

### Layout

Main layout wrapper for all pages.

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

// Usage
<Layout title="Dashboard" description="Your personal dashboard">
  <DashboardContent />
</Layout>
```

**Features:**
- Responsive design
- SEO optimization
- Accessibility support
- Theme switching

## Feature Components

### AnalyticsDashboard

Comprehensive analytics dashboard with charts and metrics.

```typescript
interface AnalyticsDashboardProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  category?: 'all' | 'tasks' | 'health' | 'focus' | 'social';
  onTimeRangeChange?: (range: string) => void;
  onCategoryChange?: (category: string) => void;
  className?: string;
}

// Usage
<AnalyticsDashboard 
  timeRange="30d"
  category="tasks"
  onTimeRangeChange={handleTimeRangeChange}
/>
```

**Features:**
- Interactive charts
- Time range filtering
- Category filtering
- Real-time data updates
- Export functionality

### SecurityDashboard

Admin security dashboard for monitoring and audit logs.

```typescript
interface SecurityDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '90d';
  filters?: SecurityFilters;
  onFiltersChange?: (filters: SecurityFilters) => void;
  onExport?: () => void;
  className?: string;
}

interface SecurityFilters {
  severity?: 'all' | 'critical' | 'high' | 'medium' | 'low';
  type?: 'all' | 'login' | 'logout' | 'failed_login' | 'password_change';
  status?: 'all' | 'success' | 'failed' | 'blocked';
  user?: string;
}

// Usage
<SecurityDashboard 
  timeRange="7d"
  filters={{ severity: 'high', type: 'failed_login' }}
  onFiltersChange={handleFiltersChange}
/>
```

**Features:**
- Security event monitoring
- Audit log viewing
- Threat intelligence
- Compliance reporting
- Real-time alerts

### EisenhowerMatrix

Task management using the Eisenhower Matrix methodology.

```typescript
interface EisenhowerMatrixProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onCreateTask: (task: Partial<Task>) => void;
  className?: string;
}

// Usage
<EisenhowerMatrix 
  tasks={tasks}
  onTaskComplete={handleTaskComplete}
  onTaskEdit={handleTaskEdit}
  onTaskDelete={handleTaskDelete}
  onCreateTask={handleCreateTask}
/>
```

**Features:**
- Four-quadrant task organization
- Drag and drop support
- Task creation and editing
- Progress tracking
- AI-powered suggestions

## UI Components

### Button

Versatile button component with multiple variants and states.

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
}

// Usage
<Button 
  variant="primary" 
  size="md" 
  onClick={handleClick}
  loading={isLoading}
>
  Save Changes
</Button>
```

**Features:**
- Multiple variants and sizes
- Loading states
- Accessibility support
- Keyboard navigation
- Icon support

### Input

Form input component with validation and error states.

```typescript
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  disabled?: boolean;
  required?: boolean;
  error?: string;
  touched?: boolean;
  label?: string;
  description?: string;
  className?: string;
  'aria-describedby'?: string;
}

// Usage
<Input
  value={email}
  onChange={setEmail}
  type="email"
  label="Email Address"
  error={errors.email}
  touched={touched.email}
  required
/>
```

**Features:**
- Type validation
- Error states
- Accessibility labels
- Keyboard navigation
- Auto-complete support

### Modal

Modal dialog component for overlays and popups.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  className?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Usage
<Modal
  isOpen={isModalOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="Are you sure you want to proceed?"
  size="md"
>
  <ConfirmationContent />
</Modal>
```

**Features:**
- Focus management
- Escape key handling
- Backdrop click to close
- Responsive sizing
- Accessibility support

## Form Components

### FormField

Generic form field wrapper with validation and accessibility.

```typescript
interface FormFieldProps<T> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: (props: FieldProps<T>) => React.ReactNode;
}

interface FieldProps<T> {
  value: T;
  onChange: (value: T) => void;
  onBlur: () => void;
  error?: string;
  touched: boolean;
  dirty: boolean;
  required: boolean;
  disabled: boolean;
  id: string;
  'aria-describedby'?: string;
}

// Usage
<FormField name="email" label="Email" required>
  {(props) => <Input {...props} type="email" />}
</FormField>
```

**Features:**
- Automatic validation
- Error handling
- Accessibility labels
- Field state management

### TaskForm

Specialized form for creating and editing tasks.

```typescript
interface TaskFormProps {
  initialValues?: Partial<Task>;
  onSubmit: (task: Task) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

// Usage
<TaskForm
  initialValues={task}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isSubmitting={isSubmitting}
/>
```

**Features:**
- Eisenhower Matrix integration
- Validation with Zod
- Auto-save functionality
- Optimistic updates

## Error Components

### ErrorBoundary

Catches JavaScript errors in component tree and displays fallback UI.

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

// Usage
<ErrorBoundary 
  onError={handleError}
  showDetails={process.env.NODE_ENV === 'development'}
>
  <AppContent />
</ErrorBoundary>
```

**Features:**
- Error reporting
- Fallback UI
- Development details
- Retry functionality

### RouteErrorBoundary

Specialized error boundary for route-level errors.

```typescript
interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  routeName?: string;
}

// Usage
<RouteErrorBoundary routeName="Dashboard">
  <DashboardPage />
</RouteErrorBoundary>
```

**Features:**
- Route-specific error handling
- Navigation options
- Error context

## Accessibility Components

### GermanAccessibleButton

Button component with German accessibility features.

```typescript
interface GermanAccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Usage
<GermanAccessibleButton
  onClick={handleClick}
  aria-label="Speichern"
>
  Speichern
</GermanAccessibleButton>
```

**Features:**
- German keyboard shortcuts
- High contrast mode
- Screen reader support
- ARIA labels

### AccessibilityProvider

Context provider for accessibility features.

```typescript
interface AccessibilityProviderProps {
  children: React.ReactNode;
  enableKeyboardShortcuts?: boolean;
  enableHighContrastMode?: boolean;
  enableScreenReaderSupport?: boolean;
}

// Usage
<AccessibilityProvider
  enableKeyboardShortcuts={true}
  enableHighContrastMode={true}
  enableScreenReaderSupport={true}
>
  <App />
</AccessibilityProvider>
```

**Features:**
- Global accessibility state
- Keyboard navigation
- Screen reader announcements
- High contrast detection

## Hooks

### useFormState

Comprehensive form state management hook.

```typescript
interface UseFormStateOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnMount?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
  onError?: (errors: Partial<Record<keyof T, string>>) => void;
  transform?: {
    input?: (values: T) => T;
    output?: (values: T) => T;
  };
}

// Usage
const formState = useFormState({
  initialValues: { email: '', password: '' },
  validationSchema: loginSchema,
  validateOnBlur: true,
  onSubmit: handleSubmit
});
```

**Features:**
- Zod validation
- Field-level validation
- Optimistic updates
- Form persistence
- Error handling

### useErrorTracking

Hook for error tracking and reporting.

```typescript
interface UseErrorTrackingReturn {
  captureError: (error: Error, context?: ErrorContext) => void;
  captureMessage: (message: string, context?: ErrorContext) => void;
  captureBreadcrumb: (message: string, category: string, data?: any) => void;
}

// Usage
const { captureError, captureMessage } = useErrorTracking();

captureError(new Error('Something went wrong'), {
  component: 'TaskForm',
  action: 'submit'
});
```

**Features:**
- Error reporting
- Breadcrumb tracking
- Performance monitoring
- Context capture

## Utilities

### bundleAnalyzer

Bundle analysis and optimization utilities.

```typescript
interface BundleAnalyzer {
  analyzeBundle(): BundleStats;
  getOptimizationRecommendations(): OptimizationRecommendation[];
  shouldLazyLoad(moduleName: string): boolean;
  getOptimalChunkSize(moduleName: string): number;
}

// Usage
const stats = bundleAnalyzer.analyzeBundle();
const recommendations = bundleAnalyzer.getOptimizationRecommendations();
```

**Features:**
- Bundle size analysis
- Optimization recommendations
- Lazy loading suggestions
- Performance monitoring

### lazyLoading

Lazy loading utilities for components and pages.

```typescript
interface LazyLoadingUtils {
  withLazyLoading: <P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    fallback?: ComponentType
  ) => ComponentType<P>;
  preloader: {
    preload: (importFn: () => Promise<any>) => Promise<any>;
    preloadOnHover: (element: HTMLElement, importFn: () => Promise<any>) => void;
    preloadOnIntersection: (element: HTMLElement, importFn: () => Promise<any>) => void;
  };
}

// Usage
const LazyComponent = withLazyLoading(() => import('./HeavyComponent'));
preloader.preloadOnHover(buttonElement, () => import('./NextPage'));
```

**Features:**
- Component lazy loading
- Preloading strategies
- Error boundaries
- Performance monitoring

## Best Practices

### Component Design

1. **Props Interface**: Always define clear TypeScript interfaces for props
2. **Default Props**: Provide sensible defaults for optional props
3. **Accessibility**: Include ARIA labels and keyboard navigation
4. **Error Handling**: Implement proper error boundaries and fallbacks
5. **Performance**: Use React.memo and useMemo for expensive operations

### Form Management

1. **Validation**: Use Zod schemas for type-safe validation
2. **State Management**: Leverage useFormState for complex forms
3. **Error Display**: Show field-level errors with proper ARIA attributes
4. **Loading States**: Provide visual feedback during submission
5. **Persistence**: Auto-save form data to prevent data loss

### Accessibility

1. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
2. **Screen Readers**: Provide proper ARIA labels and descriptions
3. **High Contrast**: Support high contrast mode for better visibility
4. **Focus Management**: Manage focus properly in modals and dynamic content
5. **Internationalization**: Support multiple languages with proper RTL support

### Performance

1. **Code Splitting**: Use lazy loading for non-critical components
2. **Bundle Optimization**: Monitor and optimize bundle sizes
3. **Caching**: Implement proper caching strategies for data and assets
4. **Debouncing**: Debounce expensive operations like search and validation
5. **Memoization**: Use React.memo and useMemo to prevent unnecessary re-renders

## Testing

### Unit Testing

```typescript
// Example test for Button component
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveTextContent('Click me');
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Integration Testing

```typescript
// Example test for TaskForm
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from '../TaskForm';

test('submits form with valid data', async () => {
  const handleSubmit = jest.fn();
  render(<TaskForm onSubmit={handleSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test Task' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  
  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'Test Task',
      // ... other form fields
    });
  });
});
```

### Accessibility Testing

```typescript
// Example accessibility test
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';

expect.extend(toHaveNoViolations);

test('button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

This documentation provides a comprehensive guide to all components in the Time & Wellness application. Each component includes TypeScript interfaces, usage examples, features, and best practices for implementation and testing.
