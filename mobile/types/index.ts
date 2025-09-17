// Core application types that match the backend API

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  timezone: string;
  preferredLanguage: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'ko' | 'zh';
  subscriptionType: 'free' | 'premium' | 'enterprise';
  subscriptionExpiresAt: number | null;
  isStudent: boolean;
  studentVerificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  createdAt: number;
  updatedAt: number;
  badgePoints?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4; // 1 = low, 4 = urgent
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: number;
  estimatedDuration?: number; // in minutes
  aiPriorityScore?: number;
  aiPlanningSessionId?: string;
  energyLevelRequired?: number; // 1-10 scale
  contextType?: 'work' | 'personal' | 'health' | 'learning' | 'social';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface HealthLog {
  id: string;
  userId: string;
  type: 'exercise' | 'nutrition' | 'mood' | 'hydration';
  payload: any; // JSON data specific to the health type
  recordedAt: number;
  source: 'auto' | 'manual' | 'device';
  deviceType?: string;
  createdAt: number;
}

export interface ExerciseData {
  activity: string;
  durationMinutes: number;
  intensity: number; // 1-10 scale
  caloriesBurned?: number;
  distance?: number; // in km
  heartRateAvg?: number;
  heartRateMax?: number;
  notes?: string;
}

export interface NutritionData {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories?: number;
  protein?: number; // in grams
  carbs?: number; // in grams
  fat?: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
}

export interface MoodData {
  score: number; // 1-10 scale
  energy: number; // 1-10 scale
  stress: number; // 1-10 scale
  sleep?: number; // 1-10 scale for sleep quality
  notes?: string;
  tags?: string[];
}

export interface HydrationData {
  amount: number; // in ml
  drinkType: 'water' | 'coffee' | 'tea' | 'juice' | 'sports_drink' | 'other';
  temperature?: 'hot' | 'warm' | 'room_temp' | 'cold' | 'ice_cold';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'tasks' | 'health' | 'streak' | 'milestone' | 'achievement';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: number;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  location?: string;
  eventType: 'meeting' | 'appointment' | 'task' | 'reminder' | 'break';
  status: 'confirmed' | 'tentative' | 'cancelled';
  attendees?: string[];
  recurrenceRule?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  duration: number; // planned duration in minutes
  actualDuration?: number; // actual duration in minutes
  type: 'pomodoro' | 'deep_work' | 'break';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  wasProductive?: boolean;
  distractions?: number;
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_reminder' | 'health_reminder' | 'achievement' | 'system' | 'social';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  scheduledFor?: number;
  createdAt: number;
  readAt?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  plan: 'premium' | 'enterprise';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  timezone: string;
  preferredLanguage: string;
  isStudent: boolean;
}

export interface TaskForm {
  title: string;
  description?: string;
  priority: 1 | 2 | 3 | 4;
  dueDate?: string;
  estimatedDuration?: number;
  contextType?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ProfileForm {
  firstName: string;
  lastName: string;
  timezone: string;
  preferredLanguage: string;
}

// Store State Types
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  filters: {
    status?: string;
    priority?: number;
    contextType?: string;
  };
}

export interface HealthState {
  logs: HealthLog[];
  isLoading: boolean;
  summary: {
    exerciseCount: number;
    nutritionCount: number;
    moodAverage: number;
    hydrationTotal: number;
  };
}

export interface UIState {
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'tasks' | 'health' | 'calendar' | 'focus' | 'badges' | 'settings';
  theme: 'light' | 'dark';
  notifications: Notification[];
}