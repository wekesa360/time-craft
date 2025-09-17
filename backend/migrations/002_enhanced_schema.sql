-- Enhanced schema migration for Time & Wellness Application
-- Adds internationalization, AI features, badges, student pricing, and missing modules

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN subscription_type TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at INTEGER;
ALTER TABLE users ADD COLUMN is_student BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN student_verification_status TEXT DEFAULT 'none';

-- Update users plan column to include student tier
-- Note: SQLite doesn't support modifying CHECK constraints directly, so we'll work with existing data
-- In a production system, you'd want to handle this more carefully

-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN ai_planning_session_id TEXT;
ALTER TABLE tasks ADD COLUMN energy_level_required INTEGER;
ALTER TABLE tasks ADD COLUMN context_type TEXT;
ALTER TABLE tasks ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);

-- Add missing columns to calendar_events table
ALTER TABLE calendar_events ADD COLUMN meeting_participants JSON;
ALTER TABLE calendar_events ADD COLUMN ai_confidence_score REAL;

-- Add missing columns to health_logs table
ALTER TABLE health_logs ADD COLUMN source TEXT CHECK(source IN ('auto','manual','device')) DEFAULT 'manual';
ALTER TABLE health_logs ADD COLUMN device_type TEXT;
ALTER TABLE health_logs ADD COLUMN created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);

-- Update achievement_definitions table structure
ALTER TABLE achievement_definitions ADD COLUMN id TEXT;
ALTER TABLE achievement_definitions ADD COLUMN badge_svg_template TEXT;
ALTER TABLE achievement_definitions ADD COLUMN rarity TEXT CHECK(rarity IN ('common','rare','epic','legendary')) DEFAULT 'common';

-- Update user_achievements table
ALTER TABLE user_achievements ADD COLUMN is_unlocked BOOLEAN DEFAULT false;
ALTER TABLE user_achievements ADD COLUMN badge_svg_content TEXT;
ALTER TABLE user_achievements ADD COLUMN custom_message TEXT;
ALTER TABLE user_achievements ADD COLUMN share_count INTEGER DEFAULT 0;

-- Create badge sharing system
CREATE TABLE badge_shares (
  id TEXT PRIMARY KEY,
  badge_id TEXT REFERENCES user_achievements(id),
  platform TEXT NOT NULL,
  shared_at INTEGER NOT NULL,
  click_count INTEGER DEFAULT 0,
  share_url TEXT
);

-- Create student verification system
CREATE TABLE student_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  verification_type TEXT CHECK(verification_type IN ('email','document')) NOT NULL,
  status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
  submitted_documents JSON,
  admin_notes TEXT,
  verified_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Create localized content table
CREATE TABLE localized_content (
  id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(content_key, language)
);

-- Add missing columns to file_assets table
ALTER TABLE file_assets ADD COLUMN content_type TEXT;
ALTER TABLE file_assets ADD COLUMN file_size INTEGER;

-- Create AI planning sessions table
CREATE TABLE smart_planning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  natural_language_input TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  context_data JSON,
  planned_tasks JSON NOT NULL,
  ai_confidence_score REAL,
  user_accepted BOOLEAN DEFAULT false,
  execution_success_rate REAL,
  created_at INTEGER NOT NULL
);

-- Create meeting scheduling requests table
CREATE TABLE meeting_requests (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  participants JSON NOT NULL,
  duration_minutes INTEGER NOT NULL,
  preferences JSON,
  ai_suggested_slots JSON,
  selected_slot JSON,
  status TEXT CHECK(status IN ('pending','scheduled','cancelled')) DEFAULT 'pending',
  created_at INTEGER NOT NULL
);

-- Create focus sessions table (for Pomodoro/Deep Work tracking)
CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','custom')) NOT NULL,
  planned_duration INTEGER NOT NULL, -- in minutes
  actual_duration INTEGER, -- in minutes
  task_id TEXT REFERENCES tasks(id),
  interruptions INTEGER DEFAULT 0,
  productivity_rating INTEGER CHECK(productivity_rating BETWEEN 1 AND 5),
  notes TEXT,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Create habit tracking table enhancements
CREATE TABLE habit_completions (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  completed_at INTEGER NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  streak_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Create mood tracking table (enhanced health logs)
CREATE TABLE mood_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mood_score INTEGER CHECK(mood_score BETWEEN 1 AND 10) NOT NULL,
  energy_level INTEGER CHECK(energy_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK(stress_level BETWEEN 1 AND 10),
  tags JSON, -- array of mood tags like ["happy", "productive", "tired"]
  notes TEXT,
  weather_condition TEXT,
  recorded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create sleep tracking table
CREATE TABLE sleep_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  bedtime INTEGER NOT NULL,
  wake_time INTEGER NOT NULL,
  sleep_quality INTEGER CHECK(sleep_quality BETWEEN 1 AND 10),
  sleep_duration_hours REAL,
  dream_notes TEXT,
  sleep_environment JSON, -- temperature, noise, etc.
  recorded_at INTEGER NOT NULL,
  source TEXT CHECK(source IN ('manual','device')) DEFAULT 'manual',
  device_data JSON,
  created_at INTEGER NOT NULL
);

-- Create nutrition tracking table
CREATE TABLE nutrition_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  meal_type TEXT CHECK(meal_type IN ('breakfast','lunch','dinner','snack')) NOT NULL,
  food_items JSON NOT NULL, -- array of food items with quantities
  calories INTEGER,
  macros JSON, -- protein, carbs, fat, fiber
  water_intake_ml INTEGER,
  meal_photo_url TEXT,
  notes TEXT,
  recorded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create exercise tracking table (enhanced health logs)
CREATE TABLE exercise_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  exercise_type TEXT NOT NULL, -- cardio, strength, yoga, etc.
  activity_name TEXT NOT NULL, -- running, squats, etc.
  duration_minutes INTEGER,
  intensity_level INTEGER CHECK(intensity_level BETWEEN 1 AND 10),
  calories_burned INTEGER,
  distance_km REAL,
  repetitions INTEGER,
  weight_kg REAL,
  sets INTEGER,
  notes TEXT,
  recorded_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create financial tracking table
CREATE TABLE financial_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  transaction_type TEXT CHECK(transaction_type IN ('income','expense','investment','saving')) NOT NULL,
  category TEXT NOT NULL, -- food, transport, entertainment, etc.
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  tags JSON,
  payment_method TEXT,
  location TEXT,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  transaction_date INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create budget goals table
CREATE TABLE budget_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  alert_threshold REAL DEFAULT 0.8, -- alert when 80% of budget used
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create time tracking sessions table
CREATE TABLE time_tracking_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  project_name TEXT,
  task_id TEXT REFERENCES tasks(id),
  category TEXT, -- work, personal, learning, etc.
  description TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  duration_minutes INTEGER,
  is_billable BOOLEAN DEFAULT false,
  hourly_rate REAL,
  tags JSON,
  notes TEXT,
  created_at INTEGER NOT NULL
);

-- Create social features table
CREATE TABLE user_connections (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id),
  addressee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','accepted','blocked')) DEFAULT 'pending',
  connection_type TEXT CHECK(connection_type IN ('friend','family','colleague','accountability_partner')) DEFAULT 'friend',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(requester_id, addressee_id)
);

-- Create social challenges table
CREATE TABLE social_challenges (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK(challenge_type IN ('habit','goal','fitness','mindfulness')) NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT false,
  reward_type TEXT,
  reward_description TEXT,
  created_at INTEGER NOT NULL
);

-- Create challenge participants table
CREATE TABLE challenge_participants (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES social_challenges(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at INTEGER NOT NULL,
  progress_data JSON,
  completion_status TEXT CHECK(completion_status IN ('active','completed','dropped')) DEFAULT 'active',
  final_score REAL,
  UNIQUE(challenge_id, user_id)
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_type, subscription_expires_at);
CREATE INDEX idx_users_student ON users(is_student, student_verification_status);

CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_ai_priority ON tasks(ai_priority_score DESC);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);

CREATE INDEX idx_calendar_events_user_timerange ON calendar_events(user_id, start, "end");
CREATE INDEX idx_calendar_events_ai ON calendar_events(ai_generated, ai_confidence_score);

CREATE INDEX idx_health_logs_user_type_date ON health_logs(user_id, type, recorded_at);
CREATE INDEX idx_health_logs_source ON health_logs(source);

CREATE INDEX idx_focus_sessions_user_date ON focus_sessions(user_id, started_at);
CREATE INDEX idx_focus_sessions_task ON focus_sessions(task_id);

CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, completed_at);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_at);

CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, recorded_at);
CREATE INDEX idx_sleep_entries_user_date ON sleep_entries(user_id, recorded_at);
CREATE INDEX idx_nutrition_entries_user_date ON nutrition_entries(user_id, recorded_at);
CREATE INDEX idx_exercise_entries_user_date ON exercise_entries(user_id, recorded_at);

CREATE INDEX idx_financial_entries_user_date ON financial_entries(user_id, transaction_date);
CREATE INDEX idx_financial_entries_category ON financial_entries(category);

CREATE INDEX idx_time_tracking_user_date ON time_tracking_sessions(user_id, started_at);
CREATE INDEX idx_time_tracking_project ON time_tracking_sessions(project_name);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(is_unlocked, unlocked_at);

CREATE INDEX idx_badge_shares_platform ON badge_shares(platform);
CREATE INDEX idx_badge_shares_platform_date ON badge_shares(platform, shared_at);

CREATE INDEX idx_student_verifications_user ON student_verifications(user_id);
CREATE INDEX idx_student_verifications_status ON student_verifications(status);

CREATE INDEX idx_localized_content_key_lang ON localized_content(content_key, language);

CREATE INDEX idx_smart_planning_user_date ON smart_planning_sessions(user_id, created_at);
CREATE INDEX idx_meeting_requests_organizer ON meeting_requests(organizer_id);
CREATE INDEX idx_meeting_requests_status ON meeting_requests(status);

CREATE INDEX idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX idx_user_connections_addressee ON user_connections(addressee_id);
CREATE INDEX idx_user_connections_status ON user_connections(status);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);