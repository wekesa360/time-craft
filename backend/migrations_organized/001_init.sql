-- Initial Database Schema
-- Creates core tables for the Time & Wellness Application

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

-- Gratitude entries
CREATE TABLE gratitude_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  entry_text TEXT NOT NULL,
  category TEXT,
  logged_at INTEGER NOT NULL
);

-- Reflection entries
CREATE TABLE reflection_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  voice_file_key TEXT,
  transcription TEXT,
  ai_analysis TEXT,
  logged_at INTEGER NOT NULL
);

-- Goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  target_date INTEGER,
  milestones TEXT,
  progress_percent REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- External OAuth tokens
CREATE TABLE external_tokens (
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT CHECK(provider IN ('google','outlook','apple','fitbit')) NOT NULL,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  expires_at INTEGER,
  PRIMARY KEY (user_id, provider)
);

-- Achievement definitions
CREATE TABLE achievement_definitions (
  achievement_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_de TEXT NOT NULL,
  description_en TEXT,
  description_de TEXT,
  criteria TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1
);

-- User achievements
CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  achievement_key TEXT NOT NULL,
  unlocked_at INTEGER,
  created_at INTEGER NOT NULL
);

-- File assets
CREATE TABLE file_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  r2_url TEXT,
  related_entity_id TEXT,
  created_at INTEGER NOT NULL
);

-- Focus sessions
CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  status TEXT CHECK(status IN ('active','completed','cancelled')) DEFAULT 'active',
  template_id TEXT,
  environment TEXT,
  distractions TEXT,
  created_at INTEGER NOT NULL
);

-- Focus session templates
CREATE TABLE focus_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  environment TEXT,
  is_public BOOLEAN DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Distractions
CREATE TABLE distractions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  session_id TEXT REFERENCES focus_sessions(id),
  type TEXT NOT NULL,
  description TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Voice notes
CREATE TABLE voice_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT,
  transcription TEXT,
  audio_file_key TEXT,
  duration INTEGER,
  language TEXT DEFAULT 'en',
  ai_analysis TEXT,
  created_at INTEGER NOT NULL
);

-- Voice commands
CREATE TABLE voice_commands (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  command TEXT NOT NULL,
  action TEXT NOT NULL,
  parameters TEXT,
  success BOOLEAN NOT NULL,
  response TEXT,
  created_at INTEGER NOT NULL
);

-- Notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  read BOOLEAN DEFAULT 0,
  sent_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  channels TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Social connections
CREATE TABLE social_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  connected_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT CHECK(status IN ('pending','accepted','blocked')) DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Challenges
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  criteria TEXT NOT NULL,
  reward_points INTEGER DEFAULT 0,
  start_date INTEGER,
  end_date INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- User challenge participation
CREATE TABLE user_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  challenge_id TEXT NOT NULL REFERENCES challenges(id),
  status TEXT CHECK(status IN ('active','completed','dropped')) DEFAULT 'active',
  progress REAL DEFAULT 0,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Student verification
CREATE TABLE student_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  institution TEXT NOT NULL,
  document_url TEXT,
  status TEXT CHECK(status IN ('pending','verified','rejected')) DEFAULT 'pending',
  verification_code TEXT,
  verified_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Localization content
CREATE TABLE localization_content (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Admin users
CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT CHECK(role IN ('super_admin','admin','moderator')) NOT NULL,
  permissions TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Feature flags
CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT 0,
  rollout_percentage INTEGER DEFAULT 0,
  target_users TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Support tickets
CREATE TABLE support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK(status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
  priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  assigned_to TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Offline queue
CREATE TABLE offline_queue (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  processed_at INTEGER
);
