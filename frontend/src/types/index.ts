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
  badgePoints: number; // Required field from backend
  avatar?: string; // User avatar URL
  mobileSettings?: Record<string, any>;
  securitySettings?: Record<string, any>;
  lastOfflineSync?: number;
  createdAt: number;
  updatedAt: number;
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
  user_id: string;
  title: string;
  description?: string | null;
  priority: 1 | 2 | 3 | 4; // 1 = low, 4 = urgent
  urgency: number | null; // Eisenhower Matrix urgency (1-4 scale)
  importance: number | null; // Eisenhower Matrix importance (1-4 scale)
  eisenhower_quadrant: 'do' | 'decide' | 'delegate' | 'delete' | null; // Eisenhower Matrix quadrant
  status: 'pending' | 'done' | 'archived'; // Match backend status values
  due_date?: number | null;
  estimated_duration?: number | null; // in minutes
  ai_priority_score?: number | null;
  ai_planning_session_id?: string | null;
  energy_level_required?: number | null; // 1-10 scale
  context_type?: string | null;
  // Eisenhower Matrix specific fields
  matrix_notes?: string | null;
  ai_matrix_confidence?: number | null;
  matrix_last_reviewed?: number | null;
  is_delegated?: boolean;
  delegated_to?: string | null;
  delegation_notes?: string | null;
  created_at: number;
  updated_at: number;
  completed_at?: number;
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

export interface SessionTemplate {
  key: string;
  name: string;
  description: string;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export interface Distraction {
  id: string;
  sessionId: string;
  type: string;
  description?: string;
  timestamp: number;
}

export interface FocusEnvironment {
  id: string;
  userId: string;
  name: string;
  description?: string;
  settings: {
    lighting?: string;
    noise?: string;
    temperature?: string;
    tools?: string[];
  };
  isDefault: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_reminder' | 'health_reminder' | 'achievement' | 'system' | 'social' | 'info' | 'success' | 'warning' | 'error';
  category: 'tasks' | 'health' | 'social' | 'system' | 'security' | 'billing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  isRead: boolean; // Keep both for compatibility
  timestamp: number; // Add timestamp property
  actionUrl?: string;
  actionLabel?: string;
  scheduledFor?: number;
  createdAt: number;
  readAt?: number;
  persistent?: boolean;
  metadata?: Record<string, any>;
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

// Backend API Response Types (matching actual backend responses)
export interface TasksResponse {
  tasks: Task[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}

export interface TaskResponse {
  task: Task;
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
  priority: number;
  urgency?: number;
  importance?: number;
  eisenhower_quadrant?: 'do' | 'decide' | 'delegate' | 'delete';
  dueDate?: number;
  estimatedDuration?: number;
  contextType?: string;
  status?: 'pending' | 'done' | 'archived';
  matrixNotes?: string;
  isDelegated?: boolean;
  delegatedTo?: string;
  delegationNotes?: string;
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
  currentView: 'dashboard' | 'tasks' | 'health' | 'calendar' | 'focus' | 'badges' | 'social' | 'voice' | 'settings' | 'admin';
  theme: 'light' | 'dark';
  notifications: Notification[];
}

// Eisenhower Matrix Types
export interface EisenhowerMatrix {
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

export interface MatrixStats {
  quadrantDistribution: {
    do: number;
    decide: number;
    delegate: number;
    delete: number;
  };
  completionRates: {
    do: number;
    decide: number;
    delegate: number;
    delete: number;
  };
  recommendations: string[];
}

// Health Insights Types
export interface HealthInsights {
  overallScore: number;
  trends: {
    exercise: 'improving' | 'stable' | 'declining';
    nutrition: 'improving' | 'stable' | 'declining';
    mood: 'improving' | 'stable' | 'declining';
  };
  recommendations: HealthRecommendation[];
  correlations: HealthCorrelation[];
}

export interface HealthRecommendation {
  type: 'exercise' | 'nutrition' | 'mood' | 'hydration';
  priority: 'low' | 'medium' | 'high';
  message: string;
  actionable: boolean;
}

export interface HealthCorrelation {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: 'low' | 'medium' | 'high';
  insight: string;
}

export interface HealthGoal {
  id: string;
  userId: string;
  type: 'exercise_frequency' | 'nutrition_calories' | 'mood_average' | 'hydration_daily';
  targetValue: number;
  targetPeriod: 'daily' | 'weekly' | 'monthly';
  startDate: number;
  endDate: number;
  description: string;
  progress: {
    current: number;
    percentage: number;
  };
  isActive: boolean;
}

// Social Features Types
export interface Connection {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  status: 'pending' | 'accepted' | 'declined';
  connectedAt?: number;
  message?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'exercise_streak' | 'task_completion' | 'focus_time' | 'health_logging';
  targetValue: number;
  startDate: number;
  endDate: number;
  isPublic: boolean;
  createdBy: string;
  participants: ChallengeParticipant[];
  leaderboard: LeaderboardEntry[];
  isActive: boolean;
}

export interface ChallengeParticipant {
  userId: string;
  firstName: string;
  lastName: string;
  joinedAt: number;
  progress: number;
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  score: number;
  rank: number;
  badgePoints?: number;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  type: 'badge_unlock' | 'challenge_join' | 'challenge_complete' | 'achievement_share';
  content: any;
  timestamp: number;
}

// Voice Processing Types
export interface VoiceNote {
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
  duration: number;
  createdAt: number;
}

export interface VoiceCommand {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
}

export interface VoiceSettings {
  language: 'en' | 'de';
  autoTranscribe: boolean;
  commandsEnabled: boolean;
  noiseReduction: boolean;
  confidenceThreshold: number;
}

export interface VoiceAnalytics {
  totalNotes: number;
  totalDuration: number;
  averageConfidence: number;
  commandsExecuted: number;
  topCommands: string[];
  accuracyTrend: number[];
}

// Meeting Scheduling Types
export interface MeetingRequest {
  id: string;
  title: string;
  description?: string;
  duration: number;
  participants: string[];
  preferredTimeSlots: TimeSlot[];
  suggestedSlots: SuggestedTimeSlot[];
  meetingType: 'video_call' | 'phone_call' | 'in_person';
  status: 'pending_responses' | 'confirmed' | 'cancelled';
  createdBy: string;
  createdAt: number;
}

export interface TimeSlot {
  start: number;
  end: number;
}

export interface SuggestedTimeSlot extends TimeSlot {
  score: number;
  conflicts: string[];
  participants: string[];
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

// Notification Types
export interface NotificationPreferences {
  taskReminders: boolean;
  healthReminders: boolean;
  socialNotifications: boolean;
  badgeUnlocks: boolean;
  challengeUpdates: boolean;
  meetingReminders: boolean;
  deadlineAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface NotificationDevice {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  isActive: boolean;
  registeredAt: number;
}

// Student Verification Types
export interface StudentVerification {
  id: string;
  userId: string;
  studentEmail: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  otpSentAt?: number;
  verifiedAt?: number;
  rejectionReason?: string;
}

export interface StudentPricing {
  regular: {
    monthly: number;
    yearly: number;
  };
  student: {
    monthly: number;
    yearly: number;
    discount: number;
  };
}

// Localization Types
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
  rtl?: boolean;
}

export interface LocalizationContent {
  language: string;
  content: Record<string, string>;
  metadata?: {
    version: string;
    lastUpdated: string;
    completeness: number;
  };
  pricing?: {
    currency: string;
    monthly: string;
    yearly: string;
  };
}



// Admin Dashboard Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  revenue: number;
  supportTickets: {
    open: number;
    resolved: number;
  };
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SystemMetrics {
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseConnections: number;
}

// Server-Sent Events Types
export interface SSEMessage {
  type: 'badge_unlocked' | 'challenge_update' | 'notification' | 'task_reminder' | 'health_insight' | 'focus_session_complete' | 'system_alert';
  data: any;
  timestamp: number;
}

export interface SSEConnectionState {
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessageTime: number;
}

// Offline Support Types
export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineState {
  isOnline: boolean;
  queuedRequests: QueuedRequest[];
  lastSyncTime: number;
}