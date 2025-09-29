// Database types for Time & Wellness Application
// Comprehensive TypeScript definitions for all tables

export type SupportedLanguage = 'en' | 'de';
export type SubscriptionType = 'free' | 'standard' | 'student';
export type TaskStatus = 'pending' | 'done' | 'archived';
export type TaskPriority = 1 | 2 | 3 | 4;
export type HealthLogType = 'exercise' | 'nutrition' | 'mood' | 'hydration';
export type HealthLogSource = 'auto' | 'manual' | 'device';
export type CalendarEventSource = 'manual' | 'auto' | 'google' | 'outlook' | 'icloud' | 'ai_scheduled';
export type OAuthProvider = 'google' | 'outlook' | 'apple' | 'fitbit';
export type StudentVerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type FocusSessionType = 'pomodoro' | 'deep_work' | 'custom';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ExerciseType = 'cardio' | 'strength' | 'flexibility' | 'sports' | 'yoga';
export type TransactionType = 'income' | 'expense' | 'investment' | 'saving';
export type ConnectionStatus = 'pending' | 'accepted' | 'blocked';
export type ConnectionType = 'friend' | 'family' | 'colleague' | 'accountability_partner';
export type ChallengeType = 'habit' | 'goal' | 'fitness' | 'mindfulness';
export type ParticipationStatus = 'active' | 'completed' | 'dropped';

// Core database tables
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  timezone: string;
  preferred_language: SupportedLanguage;
  subscription_type: SubscriptionType;
  subscription_expires_at: number | null;
  stripe_customer_id: string | null;
  is_student: boolean;
  student_verification_status: StudentVerificationStatus;
  created_at: number;
  updated_at: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: number | null;
  estimated_duration: number | null;
  ai_priority_score: number | null;
  ai_planning_session_id: string | null;
  energy_level_required: number | null;
  context_type: string | null;
  // Eisenhower Matrix fields
  urgency: number | null;
  importance: number | null;
  eisenhower_quadrant: 'do' | 'decide' | 'delegate' | 'delete' | null;
  matrix_notes: string | null;
  ai_matrix_confidence: number | null;
  matrix_last_reviewed: number | null;
  is_delegated: boolean;
  delegated_to: string | null;
  delegation_notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  start: number;
  end: number;
  source: CalendarEventSource;
  ai_generated: boolean;
  meeting_participants: any[] | null; // JSON array
  ai_confidence_score: number | null;
  created_at: number;
}

export interface HealthLog {
  id: string;
  user_id: string;
  type: HealthLogType;
  payload: any; // JSON object
  recorded_at: number;
  source: HealthLogSource;
  device_type: string | null;
  created_at: number;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  target_duration: number | null;
  is_active: boolean;
  created_at: number;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: number;
  duration_minutes: number | null;
  notes: string | null;
  streak_count: number;
  created_at: number;
}

export interface GratitudeEntry {
  id: string;
  user_id: string;
  entry_text: string;
  category: string | null;
  logged_at: number;
}

export interface ReflectionEntry {
  id: string;
  user_id: string;
  content: string;
  voice_file_key: string | null;
  transcription: string | null;
  ai_analysis: any | null; // JSON object
  logged_at: number;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: number | null;
  milestones: any | null; // JSON array
  progress_percent: number;
  created_at: number;
}

export interface ExternalToken {
  user_id: string;
  provider: OAuthProvider;
  access_token_enc: string;
  refresh_token_enc: string | null;
  expires_at: number | null;
}

export interface AchievementDefinition {
  id: string;
  achievement_key: string;
  category: string;
  title_en: string;
  title_de: string;
  description_en: string;
  description_de: string;
  criteria: any; // JSON object
  points_awarded: number;
  badge_svg_template: string | null;
  rarity: AchievementRarity;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  is_unlocked: boolean;
  unlocked_at: number | null;
  badge_svg_content: string | null;
  custom_message: string | null;
  share_count: number;
  created_at: number;
}

export interface BadgeShare {
  id: string;
  badge_id: string;
  platform: string;
  shared_at: number;
  click_count: number;
  share_url: string | null;
}

export interface StudentVerification {
  id: string;
  user_id: string;
  verification_type: 'email' | 'document';
  status: 'pending' | 'approved' | 'rejected';
  submitted_documents: any | null; // JSON array
  admin_notes: string | null;
  verified_at: number | null;
  expires_at: number | null;
  created_at: number;
}

export interface LocalizedContent {
  id: string;
  content_key: string;
  language: SupportedLanguage;
  content: string;
  created_at: number;
}

export interface FileAsset {
  id: string;
  user_id: string;
  file_type: string;
  r2_key: string;
  r2_url: string;
  related_entity_id: string | null;
  content_type: string | null;
  file_size: number | null;
  created_at: number;
}

export interface SmartPlanningSession {
  id: string;
  user_id: string;
  natural_language_input: string;
  language: SupportedLanguage;
  context_data: any | null; // JSON object
  planned_tasks: any; // JSON array
  ai_confidence_score: number | null;
  user_accepted: boolean;
  execution_success_rate: number | null;
  created_at: number;
}

export interface MeetingRequest {
  id: string;
  organizer_id: string;
  title: string;
  participants: any; // JSON array
  duration_minutes: number;
  preferences: any | null; // JSON object
  ai_suggested_slots: any | null; // JSON array
  selected_slot: any | null; // JSON object
  status: 'pending' | 'scheduled' | 'cancelled';
  created_at: number;
}

export interface FocusSession {
  id: string;
  user_id: string;
  session_type: FocusSessionType;
  planned_duration: number;
  actual_duration: number | null;
  task_id: string | null;
  interruptions: number;
  productivity_rating: number | null;
  notes: string | null;
  started_at: number;
  completed_at: number | null;
  created_at: number;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  energy_level: number | null;
  stress_level: number | null;
  tags: any | null; // JSON array
  notes: string | null;
  weather_condition: string | null;
  recorded_at: number;
  created_at: number;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  bedtime: number;
  wake_time: number;
  sleep_quality: number | null;
  sleep_duration_hours: number | null;
  dream_notes: string | null;
  sleep_environment: any | null; // JSON object
  recorded_at: number;
  source: HealthLogSource;
  device_data: any | null; // JSON object
  created_at: number;
}

export interface NutritionEntry {
  id: string;
  user_id: string;
  meal_type: MealType;
  food_items: any; // JSON array
  calories: number | null;
  macros: any | null; // JSON object
  water_intake_ml: number | null;
  meal_photo_url: string | null;
  notes: string | null;
  recorded_at: number;
  created_at: number;
}

export interface ExerciseEntry {
  id: string;
  user_id: string;
  exercise_type: ExerciseType;
  activity_name: string;
  duration_minutes: number | null;
  intensity_level: number | null;
  calories_burned: number | null;
  distance_km: number | null;
  repetitions: number | null;
  weight_kg: number | null;
  sets: number | null;
  notes: string | null;
  recorded_at: number;
  created_at: number;
}

export interface FinancialEntry {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  tags: any | null; // JSON array
  payment_method: string | null;
  location: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  transaction_date: number;
  created_at: number;
}

export interface BudgetGoal {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  currency: string;
  alert_threshold: number;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface TimeTrackingSession {
  id: string;
  user_id: string;
  project_name: string | null;
  task_id: string | null;
  category: string | null;
  description: string | null;
  started_at: number;
  ended_at: number | null;
  duration_minutes: number | null;
  is_billable: boolean;
  hourly_rate: number | null;
  tags: any | null; // JSON array
  notes: string | null;
  created_at: number;
}

export interface UserConnection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  connection_type: ConnectionType;
  created_at: number;
  updated_at: number;
}

export interface SocialChallenge {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  start_date: number;
  end_date: number;
  max_participants: number;
  is_public: boolean;
  reward_type: string | null;
  reward_description: string | null;
  created_at: number;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: number;
  progress_data: any | null; // JSON object
  completion_status: ParticipationStatus;
  final_score: number | null;
}

// Query helper types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface DateRangeParams {
  start_date?: number;
  end_date?: number;
}

export interface TaskFilters extends PaginationParams, DateRangeParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  context_type?: string;
  search?: string;
  // Eisenhower Matrix filters
  quadrant?: 'do' | 'decide' | 'delegate' | 'delete';
  urgency?: number;
  importance?: number;
  is_delegated?: boolean;
}

export interface HealthLogFilters extends PaginationParams, DateRangeParams {
  type?: HealthLogType;
  source?: HealthLogSource;
}

export interface FinancialFilters extends PaginationParams, DateRangeParams {
  transaction_type?: TransactionType;
  category?: string;
  min_amount?: number;
  max_amount?: number;
}

// API Response types
export interface DatabaseResult<T> {
  data: T[];
  total?: number;
  hasMore?: boolean;
  nextCursor?: string;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

// Utility types for database operations
export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'email' | 'created_at'>>;
export type CreateTask = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTask = Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>;

// JSON payload types for specific health logs
export interface ExercisePayload {
  activity: string;
  duration_minutes: number;
  intensity: number; // 1-10
  calories_burned?: number;
  distance?: number;
  notes?: string;
}

export interface NutritionPayload {
  meal_type: MealType;
  foods: Array<{
    name: string;
    quantity: string;
    calories?: number;
  }>;
  total_calories?: number;
  water_ml?: number;
}

export interface MoodPayload {
  score: number; // 1-10
  energy: number; // 1-10
  stress: number; // 1-10
  notes?: string;
  tags?: string[];
}

export interface HydrationPayload {
  amount_ml: number;
  type: 'water' | 'coffee' | 'tea' | 'juice' | 'sports_drink' | 'other';
  notes?: string;
}

// Achievement criteria types
export interface TaskCompletionCriteria {
  type: 'task_completion';
  count: number;
}

export interface StreakCriteria {
  type: 'habit_streak' | 'consecutive_days';
  days: number;
}

export interface ScoreCriteria {
  type: 'total_score' | 'average_score';
  threshold: number;
}

export type AchievementCriteria = 
  | TaskCompletionCriteria 
  | StreakCriteria 
  | ScoreCriteria 
  | { type: string; [key: string]: any };