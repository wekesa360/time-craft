-- Initialize database with correct schema
-- Users table with all required fields
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferred_language TEXT DEFAULT 'en',
  subscription_type TEXT CHECK(subscription_type IN ('free','premium')) DEFAULT 'free',
  subscription_expires_at INTEGER,
  stripe_customer_id TEXT,
  is_student BOOLEAN DEFAULT 0,
  student_verification_status TEXT CHECK(student_verification_status IN ('none','pending','verified','rejected')) DEFAULT 'none',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER CHECK(priority BETWEEN 1 AND 4) DEFAULT 1,
  status TEXT CHECK(status IN ('pending','done','archived')) DEFAULT 'pending',
  due_date INTEGER,
  estimated_duration INTEGER,
  ai_priority_score REAL,
  created_at INTEGER NOT NULL
);

-- Health logs table
CREATE TABLE IF NOT EXISTS health_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT CHECK(type IN ('exercise','nutrition','mood','hydration','sleep','weight')) NOT NULL,
  payload TEXT NOT NULL, -- JSON stored as TEXT
  recorded_at INTEGER NOT NULL
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  start INTEGER NOT NULL,
  "end" INTEGER NOT NULL,
  source TEXT CHECK(source IN ('manual','auto','google','outlook','icloud')) DEFAULT 'manual',
  ai_generated BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  target_duration INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Gratitude entries table
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entry_text TEXT NOT NULL,
  category TEXT,
  logged_at INTEGER NOT NULL
);

-- Reflection entries table
CREATE TABLE IF NOT EXISTS reflection_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  voice_file_key TEXT,
  transcription TEXT,
  ai_analysis TEXT, -- JSON stored as TEXT
  logged_at INTEGER NOT NULL
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  target_date INTEGER,
  milestones TEXT, -- JSON stored as TEXT
  progress_percent REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- External OAuth tokens table
CREATE TABLE IF NOT EXISTS external_tokens (
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT CHECK(provider IN ('google','outlook','apple','fitbit')) NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at INTEGER,
  PRIMARY KEY (user_id, provider)
);

-- Achievement definitions table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  achievement_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_de TEXT NOT NULL,
  description_en TEXT,
  description_de TEXT,
  criteria TEXT NOT NULL, -- JSON stored as TEXT
  points_awarded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  achievement_key TEXT NOT NULL,
  unlocked_at INTEGER,
  created_at INTEGER NOT NULL
);

-- File assets table
CREATE TABLE IF NOT EXISTS file_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  r2_url TEXT,
  related_entity_id TEXT,
  created_at INTEGER NOT NULL
);
