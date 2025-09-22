# Frontend Integration Design Document

## Overview

This design document outlines the architecture and implementation approach for a comprehensive frontend that fully integrates with the Time & Wellness backend API (v2.0). The design builds upon the existing React/TypeScript foundation while implementing all 12 major backend features through a modern, scalable, and user-friendly interface.

The frontend will serve as a Progressive Web App (PWA) with offline capabilities, real-time updates, and responsive design that works seamlessly across desktop, tablet, and mobile devices.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React Components)                     │
│  ├── Pages (Dashboard, Tasks, Health, etc.)                │
│  ├── Components (UI, Forms, Charts, etc.)                  │
│  └── Layouts (Auth, App, Admin)                            │
├─────────────────────────────────────────────────────────────┤
│  State Management Layer (Zustand Stores)                   │
│  ├── Auth Store (user, tokens, permissions)                │
│  ├── Feature Stores (tasks, health, focus, etc.)          │
│  └── UI Store (theme, notifications, modals)               │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ├── API Client (axios with interceptors)                  │
│  ├── Real-time Service (WebSocket/SSE)                     │
│  ├── Offline Service (IndexedDB cache)                     │
│  ├── Notification Service (Push API)                       │
│  └── Voice Service (Web Audio API)                         │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                       │
│  ├── Router (React Router v7)                              │
│  ├── Query Client (TanStack Query)                         │
│  ├── i18n (react-i18next)                                  │
│  └── PWA Service Worker                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Time & Wellness Backend API v2.0              │
│  ├── Authentication & User Management                      │
│  ├── Task Management with Eisenhower Matrix                │
│  ├── Focus Sessions (Pomodoro)                             │
│  ├── Health Tracking with AI Insights                     │
│  ├── Badge System & Gamification                           │
│  ├── Social Features & Challenges                          │
│  ├── Voice Processing & Commands                           │
│  ├── AI Meeting Scheduling                                 │
│  ├── Push Notifications                                    │
│  ├── Student Verification                                  │
│  ├── German Localization                                   │
│  └── Admin Dashboard                                       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Core Framework:**
- React 19.1.1 with TypeScript
- Vite for build tooling and development
- React Router v7 for routing

**State Management:**
- Zustand for global state management
- TanStack Query for server state and caching
- React Hook Form for form state

**UI & Styling:**
- Tailwind CSS v4 for styling
- Headless UI for accessible components
- Lucide React for icons
- Framer Motion for animations

**Data & API:**
- Axios for HTTP client
- WebSocket for real-time updates
- IndexedDB for offline storage
- Service Worker for PWA features

**Internationalization:**
- react-i18next for translations
- Date-fns for date formatting
- Intl API for number/currency formatting

## Components and Interfaces

### Core Component Structure

```
src/
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Progress.tsx
│   │   ├── Chart.tsx
│   │   └── Timer.tsx
│   ├── forms/                  # Form components
│   │   ├── TaskForm.tsx
│   │   ├── HealthLogForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── VoiceRecorder.tsx
│   ├── layout/                 # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── features/               # Feature-specific components
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── EisenhowerMatrix.tsx
│   │   │   └── TaskFilters.tsx
│   │   ├── health/
│   │   │   ├── HealthDashboard.tsx
│   │   │   ├── ExerciseLogger.tsx
│   │   │   ├── NutritionTracker.tsx
│   │   │   ├── MoodTracker.tsx
│   │   │   └── HealthInsights.tsx
│   │   ├── focus/
│   │   │   ├── FocusTimer.tsx
│   │   │   ├── SessionTemplates.tsx
│   │   │   ├── DistractionLogger.tsx
│   │   │   └── FocusAnalytics.tsx
│   │   ├── badges/
│   │   │   ├── BadgeGrid.tsx
│   │   │   ├── BadgeCard.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   └── BadgeShare.tsx
│   │   ├── social/
│   │   │   ├── ConnectionsList.tsx
│   │   │   ├── ChallengeCard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── Leaderboard.tsx
│   │   ├── voice/
│   │   │   ├── VoiceRecorder.tsx
│   │   │   ├── VoiceNotesList.tsx
│   │   │   ├── CommandProcessor.tsx
│   │   │   └── VoiceAnalytics.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarView.tsx
│   │   │   ├── MeetingScheduler.tsx
│   │   │   ├── AvailabilityPicker.tsx
│   │   │   └── MeetingRequests.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── UserManagement.tsx
│   │       ├── SystemMetrics.tsx
│   │       └── FeatureFlags.tsx
│   └── common/                 # Common components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── NotificationCenter.tsx
│       ├── SearchBar.tsx
│       └── DataTable.tsx
```

### State Management Architecture

**Store Structure:**
```typescript
// Auth Store
interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Tasks Store
interface TasksStore {
  tasks: Task[];
  matrix: EisenhowerMatrix;
  filters: TaskFilters;
  isLoading: boolean;
  
  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (task: TaskForm) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchMatrix: () => Promise<void>;
}

// Health Store
interface HealthStore {
  logs: HealthLog[];
  insights: HealthInsights;
  goals: HealthGoal[];
  summary: HealthSummary;
  
  // Actions
  logExercise: (data: ExerciseData) => Promise<void>;
  logNutrition: (data: NutritionData) => Promise<void>;
  logMood: (data: MoodData) => Promise<void>;
  logHydration: (data: HydrationData) => Promise<void>;
  fetchInsights: () => Promise<void>;
}

// Focus Store
interface FocusStore {
  activeSession: FocusSession | null;
  templates: SessionTemplate[];
  sessions: FocusSession[];
  analytics: FocusAnalytics;
  
  // Actions
  startSession: (templateKey: string, taskId?: string) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: (rating: number, notes?: string) => Promise<void>;
  logDistraction: (type: string) => Promise<void>;
}

// Additional stores for badges, social, voice, calendar, notifications, etc.
```

### API Integration Layer

**Enhanced API Client:**
```typescript
class ApiClient {
  private client: AxiosInstance;
  private wsConnection: WebSocket | null = null;
  
  // Core HTTP methods
  async get<T>(url: string, params?: any): Promise<T>;
  async post<T>(url: string, data?: any): Promise<T>;
  async put<T>(url: string, data?: any): Promise<T>;
  async delete<T>(url: string): Promise<T>;
  
  // Real-time methods
  connectWebSocket(): void;
  subscribeToUpdates(callback: (data: any) => void): void;
  
  // Offline methods
  queueRequest(request: QueuedRequest): void;
  syncOfflineData(): Promise<void>;
  
  // Feature-specific methods
  tasks: TasksAPI;
  health: HealthAPI;
  focus: FocusAPI;
  badges: BadgesAPI;
  social: SocialAPI;
  voice: VoiceAPI;
  calendar: CalendarAPI;
  notifications: NotificationsAPI;
  admin: AdminAPI;
}
```

## Data Models

### Core Data Models

**User Model:**
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  timezone: string;
  preferredLanguage: 'en' | 'de';
  subscriptionType: 'free' | 'premium' | 'enterprise';
  isStudent: boolean;
  studentVerificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  badgePoints: number;
  createdAt: number;
  updatedAt: number;
}
```

**Task Model with Eisenhower Matrix:**
```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  urgency: 1 | 2 | 3 | 4 | 5;
  importance: 1 | 2 | 3 | 4 | 5;
  quadrant: 'do' | 'decide' | 'delegate' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: number;
  estimatedDuration?: number;
  energyLevelRequired?: number;
  contextType?: 'work' | 'personal' | 'health' | 'learning' | 'social';
  aiPriorityScore?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

interface EisenhowerMatrix {
  do: Task[];
  decide: Task[];
  delegate: Task[];
  delete: Task[];
  stats: {
    do: number;
    decide: number;
    delegate: number;
    delete: number;
  };
}
```

**Focus Session Model:**
```typescript
interface FocusSession {
  id: string;
  userId: string;
  templateKey: string;
  taskId?: string;
  environmentId?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  startTime: number;
  plannedEndTime: number;
  actualEndTime?: number;
  productivityRating?: number;
  notes?: string;
  distractions: Distraction[];
}

interface SessionTemplate {
  key: string;
  name: string;
  description: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}
```

**Health Models:**
```typescript
interface HealthLog {
  id: string;
  userId: string;
  type: 'exercise' | 'nutrition' | 'mood' | 'hydration';
  payload: ExerciseData | NutritionData | MoodData | HydrationData;
  recordedAt: number;
  source: 'manual' | 'auto' | 'device';
  deviceType?: string;
  createdAt: number;
}

interface HealthInsights {
  overallScore: number;
  trends: {
    exercise: 'improving' | 'stable' | 'declining';
    nutrition: 'improving' | 'stable' | 'declining';
    mood: 'improving' | 'stable' | 'declining';
  };
  recommendations: HealthRecommendation[];
  correlations: HealthCorrelation[];
}
```

**Badge System Models:**
```typescript
interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'productivity' | 'health' | 'social' | 'streak' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}
```

**Social Features Models:**
```typescript
interface Connection {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'accepted' | 'declined';
  connectedAt?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'exercise_streak' | 'task_completion' | 'focus_time' | 'health_logging';
  targetValue: number;
  startDate: number;
  endDate: number;
  isPublic: boolean;
  participants: ChallengeParticipant[];
  leaderboard: LeaderboardEntry[];
}
```

**Voice Processing Models:**
```typescript
interface VoiceNote {
  id: string;
  userId: string;
  transcription: string;
  confidence: number;
  analysis: {
    sentiment: 'positive' | 'neutral' | 'negative';
    actionItems: string[];
    priority: 'low' | 'medium' | 'high';
  };
  audioUrl: string;
  createdAt: number;
}

interface VoiceCommand {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
}
```

## Error Handling

### Error Handling Strategy

**Error Boundary Implementation:**
```typescript
class FeatureErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('Feature error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**API Error Handling:**
```typescript
// Centralized error handling in API client
const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Handle authentication errors
    authStore.logout();
    router.navigate('/login');
  } else if (error.response?.status === 429) {
    // Handle rate limiting
    toast.error('Too many requests. Please try again later.');
  } else if (error.response?.status >= 500) {
    // Handle server errors
    toast.error('Server error. Please try again.');
  } else {
    // Handle validation errors
    const message = error.response?.data?.error || 'An error occurred';
    toast.error(message);
  }
};
```

**Offline Error Handling:**
```typescript
// Queue failed requests for retry when online
const queueFailedRequest = (request: FailedRequest) => {
  offlineStore.addToQueue(request);
  toast.info('Request queued for when you\'re back online');
};

// Retry queued requests when connection restored
window.addEventListener('online', () => {
  offlineStore.retryQueuedRequests();
});
```

## Testing Strategy

### Testing Approach

**Unit Testing:**
- Jest + React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking
- Test coverage target: 80%+ for critical components

**Integration Testing:**
- End-to-end user flows with Playwright
- API integration tests with real backend
- Cross-browser compatibility testing

**Performance Testing:**
- Lighthouse CI for performance monitoring
- Bundle size analysis with webpack-bundle-analyzer
- Core Web Vitals tracking

**Accessibility Testing:**
- axe-core for automated a11y testing
- Manual testing with screen readers
- Keyboard navigation testing

### Test Structure

```
src/
├── __tests__/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── features/
│   ├── stores/
│   ├── services/
│   └── utils/
├── e2e/
│   ├── auth.spec.ts
│   ├── tasks.spec.ts
│   ├── health.spec.ts
│   └── focus.spec.ts
└── mocks/
    ├── handlers.ts
    ├── data.ts
    └── server.ts
```

## Performance Optimization

### Performance Strategy

**Code Splitting:**
```typescript
// Route-based code splitting
const TasksPage = lazy(() => import('../pages/TasksPage'));
const HealthPage = lazy(() => import('../pages/HealthPage'));
const FocusPage = lazy(() => import('../pages/FocusPage'));

// Component-based code splitting for heavy features
const EisenhowerMatrix = lazy(() => import('../components/features/tasks/EisenhowerMatrix'));
const HealthInsights = lazy(() => import('../components/features/health/HealthInsights'));
```

**Data Optimization:**
```typescript
// React Query for caching and background updates
const useTasksQuery = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.tasks.getTasks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Virtual scrolling for large lists
const TaskList = () => {
  const { data: tasks } = useTasksQuery();
  
  return (
    <VirtualizedList
      items={tasks}
      itemHeight={80}
      renderItem={({ item }) => <TaskCard task={item} />}
    />
  );
};
```

**Asset Optimization:**
```typescript
// Image optimization with lazy loading
const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

// Service Worker for caching
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

## Security Considerations

### Security Implementation

**Authentication Security:**
```typescript
// Secure token storage
const TokenManager = {
  setTokens: (tokens: AuthTokens) => {
    // Store in httpOnly cookie for production
    if (process.env.NODE_ENV === 'production') {
      document.cookie = `accessToken=${tokens.accessToken}; Secure; SameSite=Strict`;
    } else {
      localStorage.setItem('accessToken', tokens.accessToken);
    }
  },
  
  clearTokens: () => {
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('accessToken');
  }
};
```

**Input Validation:**
```typescript
// Zod schemas for form validation
const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.number().min(1).max(4),
  dueDate: z.number().optional(),
});

// XSS prevention
const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input);
};
```

**Content Security Policy:**
```typescript
// CSP headers for security
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "wss:", "https://api.timeandwellness.com"],
};
```

## Accessibility Features

### Accessibility Implementation

**Keyboard Navigation:**
```typescript
// Focus management for modals
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      // Handle Tab and Shift+Tab
    }
  }, [isOpen]);
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};
```

**Screen Reader Support:**
```typescript
// ARIA labels and live regions
const TaskList = ({ tasks }) => {
  return (
    <div role="main" aria-label="Task list">
      <div aria-live="polite" aria-atomic="true">
        {tasks.length} tasks found
      </div>
      <ul role="list">
        {tasks.map(task => (
          <li key={task.id} role="listitem">
            <TaskCard task={task} />
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Color and Contrast:**
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
  .button {
    border: 2px solid;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Internationalization

### i18n Implementation

**Translation Structure:**
```typescript
// Translation files
// en/common.json
{
  "app": {
    "name": "Time & Wellness",
    "tagline": "Your personal productivity and wellness companion"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "tasks": "Tasks",
    "health": "Health",
    "focus": "Focus",
    "badges": "Badges",
    "social": "Social",
    "calendar": "Calendar",
    "settings": "Settings"
  }
}

// de/common.json
{
  "app": {
    "name": "Zeit & Wellness",
    "tagline": "Ihr persönlicher Produktivitäts- und Wellness-Begleiter"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "tasks": "Aufgaben",
    "health": "Gesundheit",
    "focus": "Fokus",
    "badges": "Abzeichen",
    "social": "Sozial",
    "calendar": "Kalender",
    "settings": "Einstellungen"
  }
}
```

**Cultural Adaptations:**
```typescript
// Date and number formatting
const formatDate = (date: Date, locale: string) => {
  const formats = {
    'en': 'MM/dd/yyyy',
    'de': 'dd.MM.yyyy'
  };
  
  return format(date, formats[locale] || formats['en']);
};

const formatCurrency = (amount: number, locale: string) => {
  const currencies = {
    'en': 'USD',
    'de': 'EUR'
  };
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencies[locale] || currencies['en']
  }).format(amount);
};
```

## Real-time Features

### WebSocket Integration

**Real-time Updates:**
```typescript
// WebSocket service for real-time updates
class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect() {
    this.ws = new WebSocket('wss://api.timeandwellness.com/ws');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }
  
  private handleMessage(data: any) {
    switch (data.type) {
      case 'badge_unlocked':
        badgesStore.addBadge(data.badge);
        toast.success(`🎉 Badge unlocked: ${data.badge.name}!`);
        break;
      case 'challenge_update':
        socialStore.updateChallenge(data.challenge);
        break;
      case 'notification':
        notificationStore.addNotification(data.notification);
        break;
    }
  }
}
```

**Live Data Synchronization:**
```typescript
// Optimistic updates with rollback
const useOptimisticUpdate = () => {
  const queryClient = useQueryClient();
  
  const updateTask = useMutation({
    mutationFn: (task: Task) => apiClient.tasks.updateTask(task.id, task),
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['tasks']);
      
      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: Task[]) =>
        old.map(task => task.id === newTask.id ? newTask : task)
      );
      
      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previousTasks);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries(['tasks']);
    },
  });
  
  return updateTask;
};
```

This comprehensive design document provides the foundation for implementing a fully-featured frontend that integrates with all backend capabilities while maintaining excellent user experience, performance, and accessibility standards.