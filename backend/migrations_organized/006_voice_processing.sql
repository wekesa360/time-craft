-- Voice Processing and AI Features
-- Enhanced voice note processing with AI analysis and commands

-- Enhanced voice notes table (add missing columns)
ALTER TABLE voice_notes ADD COLUMN file_size INTEGER;
ALTER TABLE voice_notes ADD COLUMN quality_score REAL;
ALTER TABLE voice_notes ADD COLUMN language_detected TEXT;
ALTER TABLE voice_notes ADD COLUMN sentiment_score REAL;
ALTER TABLE voice_notes ADD COLUMN keywords TEXT; -- JSON array of extracted keywords
ALTER TABLE voice_notes ADD COLUMN processing_status TEXT CHECK(processing_status IN ('pending','processing','completed','failed')) DEFAULT 'pending';
ALTER TABLE voice_notes ADD COLUMN processing_error TEXT;
ALTER TABLE voice_notes ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);

-- Enhanced voice commands table (add missing columns)
ALTER TABLE voice_commands ADD COLUMN confidence_score REAL;
ALTER TABLE voice_commands ADD COLUMN processing_time INTEGER; -- milliseconds
ALTER TABLE voice_commands ADD COLUMN context_data TEXT; -- JSON context
ALTER TABLE voice_commands ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);

-- Voice processing queue
CREATE TABLE voice_processing_queue (
  id TEXT PRIMARY KEY,
  voice_note_id TEXT NOT NULL REFERENCES voice_notes(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  processing_type TEXT CHECK(processing_type IN ('transcription','analysis','command_extraction','sentiment')) NOT NULL,
  priority INTEGER DEFAULT 1,
  status TEXT CHECK(status IN ('queued','processing','completed','failed')) DEFAULT 'queued',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER
);

-- AI voice models and versions
CREATE TABLE voice_ai_models (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT CHECK(model_type IN ('transcription','analysis','command','sentiment')) NOT NULL,
  language_support TEXT NOT NULL, -- JSON array of supported languages
  accuracy_score REAL,
  processing_speed_ms INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Voice command templates
CREATE TABLE voice_command_templates (
  id TEXT PRIMARY KEY,
  command_pattern TEXT NOT NULL, -- Regex pattern for command matching
  action_type TEXT NOT NULL, -- Type of action to perform
  parameters_schema TEXT NOT NULL, -- JSON schema for parameters
  description_en TEXT NOT NULL,
  description_de TEXT NOT NULL,
  example_phrases TEXT NOT NULL, -- JSON array of example phrases
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Voice analytics and insights
CREATE TABLE voice_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  metric_type TEXT CHECK(metric_type IN ('usage_frequency','accuracy_rate','command_success','processing_time','sentiment_trends')) NOT NULL,
  metric_value REAL NOT NULL,
  time_period TEXT CHECK(time_period IN ('daily','weekly','monthly')) NOT NULL,
  measurement_date INTEGER NOT NULL,
  additional_data TEXT, -- JSON additional metrics
  created_at INTEGER NOT NULL
);

-- Voice feedback for model improvement
CREATE TABLE voice_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  voice_note_id TEXT REFERENCES voice_notes(id),
  voice_command_id TEXT REFERENCES voice_commands(id),
  feedback_type TEXT CHECK(feedback_type IN ('transcription_accuracy','command_understanding','sentiment_analysis','overall_quality')) NOT NULL,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
  feedback_text TEXT,
  correction_data TEXT, -- What the user expected vs what was provided
  created_at INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_voice_notes_user_id ON voice_notes(user_id);
CREATE INDEX idx_voice_notes_processing_status ON voice_notes(processing_status);
CREATE INDEX idx_voice_notes_created_at ON voice_notes(created_at DESC);
CREATE INDEX idx_voice_notes_language ON voice_notes(language);

CREATE INDEX idx_voice_commands_user_id ON voice_commands(user_id);
CREATE INDEX idx_voice_commands_success ON voice_commands(success);
CREATE INDEX idx_voice_commands_created_at ON voice_commands(created_at DESC);

CREATE INDEX idx_voice_processing_queue_status ON voice_processing_queue(status);
CREATE INDEX idx_voice_processing_queue_priority ON voice_processing_queue(priority DESC);
CREATE INDEX idx_voice_processing_queue_created_at ON voice_processing_queue(created_at);

CREATE INDEX idx_voice_ai_models_type ON voice_ai_models(model_type);
CREATE INDEX idx_voice_ai_models_active ON voice_ai_models(is_active);

CREATE INDEX idx_voice_command_templates_action ON voice_command_templates(action_type);
CREATE INDEX idx_voice_command_templates_active ON voice_command_templates(is_active);

CREATE INDEX idx_voice_analytics_user_id ON voice_analytics(user_id);
CREATE INDEX idx_voice_analytics_type ON voice_analytics(metric_type);
CREATE INDEX idx_voice_analytics_date ON voice_analytics(measurement_date DESC);

CREATE INDEX idx_voice_feedback_user_id ON voice_feedback(user_id);
CREATE INDEX idx_voice_feedback_type ON voice_feedback(feedback_type);
CREATE INDEX idx_voice_feedback_rating ON voice_feedback(rating);

-- Insert default voice AI models
INSERT INTO voice_ai_models (
  id, model_name, model_version, model_type, language_support, 
  accuracy_score, processing_speed_ms, created_at, updated_at
) VALUES 
('whisper_base', 'Whisper Base', '1.0', 'transcription', 
 '["en", "de", "es", "fr", "it", "pt", "ru", "ja", "ko", "zh"]', 
 0.85, 2000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('whisper_small', 'Whisper Small', '1.0', 'transcription', 
 '["en", "de", "es", "fr", "it", "pt", "ru", "ja", "ko", "zh"]', 
 0.90, 3000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('sentiment_analyzer', 'Sentiment Analyzer', '1.0', 'sentiment', 
 '["en", "de"]', 0.88, 500, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('command_classifier', 'Command Classifier', '1.0', 'command', 
 '["en", "de"]', 0.92, 300, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- Insert default voice command templates
INSERT INTO voice_command_templates (
  id, command_pattern, action_type, parameters_schema, 
  description_en, description_de, example_phrases, created_at, updated_at
) VALUES 
('create_task', '^(create|add|new)\\s+(task|todo)', 'create_task', 
 '{"title": "string", "priority": "number", "due_date": "string"}',
 'Create a new task', 'Neue Aufgabe erstellen',
 '["create task", "add todo", "new task"]', 
 strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('schedule_event', '^(schedule|book|meeting)\\s+(.*)', 'create_calendar_event', 
 '{"title": "string", "start_time": "string", "duration": "number"}',
 'Schedule a calendar event', 'Kalendertermin planen',
 '["schedule meeting", "book appointment", "meeting with John"]', 
 strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('log_mood', '^(log|record|track)\\s+(mood|feeling)', 'log_health', 
 '{"type": "mood", "value": "number", "notes": "string"}',
 'Log mood or feeling', 'Stimmung oder Gefühl protokollieren',
 '["log mood", "record feeling", "track mood"]', 
 strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('start_focus', '^(start|begin)\\s+(focus|pomodoro|work)', 'start_focus_session', 
 '{"duration": "number", "type": "string"}',
 'Start a focus session', 'Fokussitzung starten',
 '["start focus", "begin pomodoro", "start work session"]', 
 strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
