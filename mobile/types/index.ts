// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
  preferredLanguage: string;
  subscriptionType: 'free' | 'premium';
  isStudent: boolean;
  studentVerificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

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

// Task Types
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: number; // 1-4 (1=low, 4=urgent)
  status: 'pending' | 'done' | 'archived';
  dueDate?: string;
  estimatedDuration?: number; // in minutes
  aiPriorityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: number;
  dueDate?: string;
  estimatedDuration?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: number;
  status?: 'pending' | 'done' | 'archived';
  dueDate?: string;
  estimatedDuration?: number;
}

// Health Types
export interface HealthLog {
  id: string;
  userId: string;
  type: 'exercise' | 'nutrition' | 'mood' | 'sleep' | 'weight' | 'hydration' | 'medication';
  payload: any;
  recordedAt: string;
  createdAt: string;
}

export interface ExercisePayload {
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  activity: string;
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high';
  caloriesBurned?: number;
  notes?: string;
}

export interface MoodPayload {
  score: number; // 1-10
  energy: number; // 1-10
  stress: number; // 1-10
  notes?: string;
}

export interface SleepPayload {
  hours: number;
  minutes: number;
  quality: number; // 1-10
  bedtime?: string;
  wakeTime?: string;
  notes?: string;
}

export interface WeightPayload {
  weight: number; // kg
  bodyFat?: number; // percentage
  muscle?: number; // percentage
  notes?: string;
}

export interface HydrationPayload {
  glasses: number;
  totalMl: number;
  notes?: string;
}

export interface NutritionPayload {
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  notes?: string;
}

// Focus Types
export interface FocusSession {
  id: string;
  userId: string;
  sessionType: string;
  plannedDuration: number; // minutes
  actualDuration?: number; // minutes
  startedAt: string;
  completedAt?: string;
  isSuccessful: boolean;
  productivityRating?: number; // 1-5
  notes?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusTemplate {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  sessionType: string;
  durationMinutes: number;
  breakDurationMinutes: number;
  isDefault: boolean;
  isActive: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFocusSessionRequest {
  sessionType: string;
  plannedDuration: number;
  templateId?: string;
}

export interface UpdateFocusSessionRequest {
  actualDuration?: number;
  completedAt?: string;
  isSuccessful?: boolean;
  productivityRating?: number;
  notes?: string;
}

// Achievement Types
export interface Achievement {
  achievementKey: string;
  category: string;
  titleEn: string;
  titleDe: string;
  descriptionEn: string;
  descriptionDe: string;
  criteria: any;
  pointsAwarded: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementKey: string;
  unlockedAt: string;
  createdAt: string;
}

// Calendar Types
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  source: 'manual' | 'google' | 'outlook';
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Habit Types
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetDuration?: number; // minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Goal Types
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDate: string;
  milestones: any[];
  progressPercent: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface NotificationPreferences {
  userId: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskReminders: boolean;
    habitReminders: boolean;
    achievementNotifications: boolean;
    socialNotifications: boolean;
    marketingEmails: boolean;
  };
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Dashboard Types
export interface DashboardStats {
  tasksToday: number;
  tasksCompleted: number;
  focusTimeToday: number;
  healthScore: number;
  streakDays: number;
  weeklyProgress: number;
}

export interface RecentActivity {
  id: string;
  type: 'task' | 'health' | 'focus' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

// Biometric Types
export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedTypes: number[];
  hasHardware: boolean;
  isEnrolled: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'switch' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: any }[];
  validation?: any;
}

// Navigation Types
export interface TabBarIconProps {
  name: string;
  color: string;
  focused?: boolean;
}

// Storage Types
export interface StorageItem<T = any> {
  key: string;
  value: T;
  expiresAt?: number;
}

// Query Types
export interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: boolean | number;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}