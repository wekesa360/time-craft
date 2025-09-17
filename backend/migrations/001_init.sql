-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  tz TEXT DEFAULT 'UTC',
  plan TEXT CHECK(plan IN ('free','premium')) DEFAULT 'free',
  stripe_customer_id TEXT,
  subscription_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tasks
CREATE TABLE tasks (
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

-- Calendar events
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  start INTEGER NOT NULL,
  "end" INTEGER NOT NULL,
  source TEXT CHECK(source IN ('manual','auto','google','outlook','icloud')) DEFAULT 'manual',
  ai_generated BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Health logs (exercise, nutrition, mood, hydration)
CREATE TABLE health_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT CHECK(type IN ('exercise','nutrition','mood','hydration')) NOT NULL,
  payload JSON NOT NULL,
  recorded_at INTEGER NOT NULL
);

-- Habits
CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  target_duration INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Gratitude
CREATE TABLE gratitude_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entry_text TEXT NOT NULL,
  category TEXT,
  logged_at INTEGER NOT NULL
);

-- Reflection / journal
CREATE TABLE reflection_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  voice_file_key TEXT,
  transcription TEXT,
  ai_analysis JSON,
  logged_at INTEGER NOT NULL
);

-- Goals & milestones
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  target_date INTEGER,
  milestones JSON,
  progress_percent REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- External OAuth tokens (encrypted)
CREATE TABLE external_tokens (
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT CHECK(provider IN ('google','outlook','apple','fitbit')) NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at INTEGER,
  PRIMARY KEY (user_id, provider)
);

-- Achievements
CREATE TABLE achievement_definitions (
  achievement_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_de TEXT NOT NULL,
  description_en TEXT,
  description_de TEXT,
  criteria JSON NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  achievement_key TEXT NOT NULL,
  unlocked_at INTEGER,
  created_at INTEGER NOT NULL
);

-- File assets in R2
CREATE TABLE file_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  r2_url TEXT,
  related_entity_id TEXT,
  created_at INTEGER NOT NULL
);