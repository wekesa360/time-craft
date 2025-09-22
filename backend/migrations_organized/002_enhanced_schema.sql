-- Enhanced schema migration for Time & Wellness Application
-- Adds internationalization, AI features, badges, student pricing, and missing modules

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN subscription_type TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN subscription_expires_at INTEGER;
ALTER TABLE users ADD COLUMN is_student BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN student_verification_status TEXT DEFAULT 'none';

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

-- Create localized content table
CREATE TABLE localized_content (
  id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL,
  language TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(content_key, language)
);

-- Create meeting requests table
CREATE TABLE meeting_requests (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  status TEXT CHECK(status IN ('draft','sent','scheduled','cancelled','completed')) DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create health goals table
CREATE TABLE health_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_type TEXT CHECK(goal_type IN ('weight','exercise','nutrition','sleep','hydration','mental_health')) NOT NULL,
  target_value REAL NOT NULL,
  current_value REAL DEFAULT 0,
  unit TEXT NOT NULL,
  target_date INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Create health insights table
CREATE TABLE health_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  insight_type TEXT CHECK(insight_type IN ('trend','recommendation','achievement','warning')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data TEXT, -- JSON stored as TEXT
  confidence_score REAL DEFAULT 0.8,
  is_actionable BOOLEAN DEFAULT false,
  action_suggestions TEXT, -- JSON stored as TEXT
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Create API usage statistics table
CREATE TABLE api_usage_stats (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  user_id TEXT,
  response_time INTEGER,
  status_code INTEGER,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create performance metrics table
CREATE TABLE performance_metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_type TEXT CHECK(metric_type IN ('counter','gauge','histogram','summary')) NOT NULL,
  labels TEXT, -- JSON stored as TEXT
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create system metrics table
CREATE TABLE system_metrics (
  id TEXT PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  unit TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create audit logs table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details TEXT, -- JSON stored as TEXT
  ip_address TEXT,
  user_agent TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create security incidents table
CREATE TABLE security_incidents (
  id TEXT PRIMARY KEY,
  incident_type TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('low','medium','high','critical')) NOT NULL,
  description TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  details TEXT, -- JSON stored as TEXT
  resolved BOOLEAN DEFAULT 0,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start ON calendar_events(start);
CREATE INDEX idx_calendar_events_source ON calendar_events(source);

CREATE INDEX idx_health_logs_user_id ON health_logs(user_id);
CREATE INDEX idx_health_logs_type ON health_logs(type);
CREATE INDEX idx_health_logs_recorded_at ON health_logs(recorded_at);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_is_active ON habits(is_active);

CREATE INDEX idx_gratitude_entries_user_id ON gratitude_entries(user_id);
CREATE INDEX idx_gratitude_entries_logged_at ON gratitude_entries(logged_at);

CREATE INDEX idx_reflection_entries_user_id ON reflection_entries(user_id);
CREATE INDEX idx_reflection_entries_logged_at ON reflection_entries(logged_at);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_target_date ON goals(target_date);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_key ON user_achievements(achievement_key);

CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_status ON focus_sessions(status);
CREATE INDEX idx_focus_sessions_start_time ON focus_sessions(start_time);

CREATE INDEX idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX idx_voice_notes_created_at ON voice_notes(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX idx_social_connections_status ON social_connections(status);

CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);

CREATE INDEX idx_student_verifications_user_id ON student_verifications(user_id);
CREATE INDEX idx_student_verifications_status ON student_verifications(status);

CREATE INDEX idx_localized_content_key_lang ON localized_content(content_key, language);

CREATE INDEX idx_meeting_requests_organizer ON meeting_requests(organizer_id);
CREATE INDEX idx_meeting_requests_status ON meeting_requests(status);

CREATE INDEX idx_health_goals_user_id ON health_goals(user_id);
CREATE INDEX idx_health_goals_type ON health_goals(goal_type);
CREATE INDEX idx_health_goals_active ON health_goals(is_active);

CREATE INDEX idx_health_insights_user_id ON health_insights(user_id);
CREATE INDEX idx_health_insights_type ON health_insights(insight_type);
CREATE INDEX idx_health_insights_created_at ON health_insights(created_at);

CREATE INDEX idx_api_usage_stats_endpoint ON api_usage_stats(endpoint);
CREATE INDEX idx_api_usage_stats_user_id ON api_usage_stats(user_id);
CREATE INDEX idx_api_usage_stats_timestamp ON api_usage_stats(timestamp);

CREATE INDEX idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

CREATE INDEX idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

CREATE INDEX idx_security_incidents_type ON security_incidents(incident_type);
CREATE INDEX idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX idx_security_incidents_resolved ON security_incidents(resolved);
