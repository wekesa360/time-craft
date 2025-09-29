-- Migration 006: Add missing tables for badges, social features, and focus analytics
-- This migration adds all the missing tables that are causing API errors

-- User badges table for badge system
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL,
  badge_key TEXT,
  unlocked_at INTEGER NOT NULL,
  tier TEXT CHECK(tier IN ('bronze','silver','gold','platinum')) DEFAULT 'bronze',
  metadata TEXT, -- JSON metadata
  created_at INTEGER NOT NULL
);

-- Achievement shares for social features
CREATE TABLE IF NOT EXISTS achievement_shares (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  badge_id TEXT NOT NULL,
  platform TEXT CHECK(platform IN ('twitter','facebook','linkedin','instagram','other')) NOT NULL,
  shared_at INTEGER NOT NULL,
  share_url TEXT,
  message TEXT,
  created_at INTEGER NOT NULL
);

-- Social connections for social features
CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id),
  addressee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','accepted','rejected','blocked')) DEFAULT 'pending',
  connection_type TEXT CHECK(connection_type IN ('friend','family','colleague','accountability_partner')) DEFAULT 'friend',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(requester_id, addressee_id)
);

-- Challenges for social features
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  created_by TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT CHECK(challenge_type IN ('habit','goal','fitness','mindfulness')) NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 10,
  is_public BOOLEAN DEFAULT 0,
  reward_type TEXT,
  reward_description TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at INTEGER NOT NULL,
  progress_data TEXT, -- JSON progress data
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(challenge_id, user_id)
);

-- Focus sessions for focus analytics
CREATE TABLE IF NOT EXISTS focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','break','meditation','exercise')) NOT NULL,
  template_key TEXT,
  planned_duration INTEGER NOT NULL, -- in minutes
  actual_duration INTEGER, -- in minutes
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  cancelled_at INTEGER,
  is_successful BOOLEAN DEFAULT 0,
  productivity_rating INTEGER CHECK(productivity_rating BETWEEN 1 AND 5),
  environment_id TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Focus analytics for analytics API
CREATE TABLE IF NOT EXISTS focus_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  metric_type TEXT CHECK(metric_type IN ('session_duration','productivity_rating','completion_rate','distraction_count')) NOT NULL,
  measurement_date INTEGER NOT NULL,
  value REAL NOT NULL,
  additional_data TEXT, -- JSON additional data
  created_at INTEGER NOT NULL
);

-- Focus environments for environment tracking
CREATE TABLE IF NOT EXISTS focus_environments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  environment_name TEXT NOT NULL,
  location_type TEXT CHECK(location_type IN ('home','office','cafe','library','outdoor','other')) NOT NULL,
  noise_level INTEGER CHECK(noise_level BETWEEN 1 AND 5) DEFAULT 3,
  lighting_quality INTEGER CHECK(lighting_quality BETWEEN 1 AND 5) DEFAULT 3,
  temperature_comfort INTEGER CHECK(temperature_comfort BETWEEN 1 AND 5) DEFAULT 3,
  ergonomics_rating INTEGER CHECK(ergonomics_rating BETWEEN 1 AND 5) DEFAULT 3,
  distraction_level INTEGER CHECK(distraction_level BETWEEN 1 AND 5) DEFAULT 3,
  session_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- in minutes
  productivity_rating REAL DEFAULT 0.0,
  is_favorite BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Distractions tracking
CREATE TABLE IF NOT EXISTS distractions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT REFERENCES focus_sessions(id),
  distraction_type TEXT CHECK(distraction_type IN ('phone','email','social_media','noise','interruption','other')) NOT NULL,
  description TEXT,
  duration INTEGER, -- in seconds
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Break reminders
CREATE TABLE IF NOT EXISTS break_reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  reminder_type TEXT CHECK(reminder_type IN ('micro_break','short_break','long_break','exercise','hydration','eye_rest')) NOT NULL,
  interval_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  last_triggered INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Focus templates
CREATE TABLE IF NOT EXISTS focus_templates (
  id TEXT PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','break','meditation','exercise')) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  break_duration_minutes INTEGER DEFAULT 5,
  is_default BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  language TEXT DEFAULT 'en',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Insert default focus templates
INSERT OR IGNORE INTO focus_templates (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at) VALUES
('template_1', 'pomodoro_25', 'Pomodoro 25min', 'Classic Pomodoro technique with 25-minute focus sessions', 'pomodoro', 25, 5, 1, 1, 'en', 1640995200000, 1640995200000),
('template_2', 'deep_work_90', 'Deep Work 90min', 'Extended deep work session for complex tasks', 'deep_work', 90, 15, 0, 1, 'en', 1640995200000, 1640995200000),
('template_3', 'meditation_10', 'Meditation 10min', 'Short meditation session for mindfulness', 'meditation', 10, 0, 0, 1, 'en', 1640995200000, 1640995200000),
('template_4', 'exercise_30', 'Exercise 30min', 'Physical exercise session', 'exercise', 30, 5, 0, 1, 'en', 1640995200000, 1640995200000);

-- Add missing columns to users table if they don't exist
-- Note: These will fail silently if columns already exist, which is fine
-- We'll handle this in the application code by checking for column existence

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_achievement_shares_user_id ON achievement_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_requester ON social_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_addressee ON social_connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_focus_analytics_user_date ON focus_analytics(user_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_focus_environments_user_id ON focus_environments(user_id);
CREATE INDEX IF NOT EXISTS idx_distractions_user_id ON distractions(user_id);
CREATE INDEX IF NOT EXISTS idx_break_reminders_user_id ON break_reminders(user_id);
