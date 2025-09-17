-- Voice Processing and Audio Storage System
-- Enables voice notes, transcription, and audio file management with R2 storage

-- Voice recordings table for audio file management
CREATE TABLE voice_recordings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  recording_type TEXT CHECK(recording_type IN ('voice_note','reflection','task_creation','meeting_note','health_log','habit_reminder')) NOT NULL,
  title TEXT,
  description TEXT,
  duration_seconds REAL, -- Audio duration in seconds
  file_size_bytes INTEGER, -- File size in bytes
  audio_format TEXT CHECK(audio_format IN ('mp3','wav','m4a','ogg','webm')) NOT NULL,
  sample_rate INTEGER, -- Audio sample rate (e.g., 44100)
  bit_rate INTEGER, -- Audio bit rate (e.g., 128000)
  r2_key TEXT NOT NULL, -- R2 storage key
  r2_url TEXT NOT NULL, -- R2 public URL
  r2_bucket TEXT DEFAULT 'wellness-audio', -- R2 bucket name
  upload_status TEXT CHECK(upload_status IN ('uploading','completed','failed','processing')) DEFAULT 'uploading',
  upload_error TEXT, -- Error message if upload failed
  transcription_status TEXT CHECK(transcription_status IN ('pending','processing','completed','failed','skipped')) DEFAULT 'pending',
  transcription_text TEXT, -- Transcribed text content
  transcription_confidence REAL, -- Transcription confidence score (0-1)
  transcription_language TEXT DEFAULT 'en', -- Detected/specified language
  transcription_service TEXT CHECK(transcription_service IN ('deepgram','openai','google','azure')) DEFAULT 'deepgram',
  transcription_error TEXT, -- Error message if transcription failed
  ai_analysis JSON, -- AI analysis of the voice content
  ai_analysis_status TEXT CHECK(ai_analysis_status IN ('pending','processing','completed','failed','skipped')) DEFAULT 'pending',
  related_entity_type TEXT, -- 'task', 'health_log', 'reflection', etc.
  related_entity_id TEXT, -- ID of related entity
  tags JSON, -- Array of tags for categorization
  is_private BOOLEAN DEFAULT true, -- Privacy setting
  is_archived BOOLEAN DEFAULT false, -- Archive status
  play_count INTEGER DEFAULT 0, -- Number of times played
  last_played_at INTEGER, -- Last time the recording was played
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Voice processing jobs queue for async operations
CREATE TABLE voice_processing_jobs (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL REFERENCES voice_recordings(id),
  job_type TEXT CHECK(job_type IN ('transcription','ai_analysis','format_conversion','cleanup')) NOT NULL,
  status TEXT CHECK(status IN ('queued','processing','completed','failed','cancelled')) DEFAULT 'queued',
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)
  attempts INTEGER DEFAULT 0, -- Number of processing attempts
  max_attempts INTEGER DEFAULT 3, -- Maximum retry attempts
  processor_service TEXT, -- Which service is processing this job
  job_data JSON, -- Job-specific configuration and parameters
  result_data JSON, -- Job results and output
  error_message TEXT, -- Error details if job failed
  started_at INTEGER, -- When processing started
  completed_at INTEGER, -- When processing completed
  next_retry_at INTEGER, -- When to retry if failed
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Voice templates for common use cases
CREATE TABLE voice_templates (
  id TEXT PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_de TEXT NOT NULL,
  description_en TEXT,
  description_de TEXT,
  recording_type TEXT NOT NULL,
  suggested_duration INTEGER, -- Suggested recording duration in seconds
  prompt_text_en TEXT, -- Suggested prompt for user
  prompt_text_de TEXT,
  ai_analysis_config JSON, -- Configuration for AI analysis
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- User voice preferences and settings
CREATE TABLE user_voice_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  preferred_audio_format TEXT CHECK(preferred_audio_format IN ('mp3','wav','m4a','ogg','webm')) DEFAULT 'mp3',
  preferred_quality TEXT CHECK(preferred_quality IN ('low','medium','high','lossless')) DEFAULT 'medium',
  auto_transcription BOOLEAN DEFAULT true,
  transcription_language TEXT DEFAULT 'auto', -- 'auto', 'en', 'de', etc.
  ai_analysis_enabled BOOLEAN DEFAULT true,
  voice_activation_enabled BOOLEAN DEFAULT false, -- Voice-activated recording
  noise_reduction BOOLEAN DEFAULT true,
  auto_delete_after_days INTEGER, -- Auto-delete recordings after X days (null = never)
  storage_limit_mb INTEGER DEFAULT 1000, -- Storage limit in MB
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Voice analytics for insights and optimization
CREATE TABLE voice_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  recording_id TEXT REFERENCES voice_recordings(id),
  metric_type TEXT CHECK(metric_type IN ('recording_duration','transcription_accuracy','ai_analysis_quality','user_satisfaction','usage_frequency')) NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT, -- 'seconds', 'percentage', 'score', etc.
  measurement_date INTEGER NOT NULL,
  additional_data JSON,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create indexes for performance
CREATE INDEX idx_voice_recordings_user ON voice_recordings(user_id);
CREATE INDEX idx_voice_recordings_type ON voice_recordings(recording_type);
CREATE INDEX idx_voice_recordings_status ON voice_recordings(upload_status, transcription_status);
CREATE INDEX idx_voice_recordings_created ON voice_recordings(created_at DESC);
CREATE INDEX idx_voice_recordings_related ON voice_recordings(related_entity_type, related_entity_id);
CREATE INDEX idx_voice_recordings_archived ON voice_recordings(is_archived, created_at DESC);

CREATE INDEX idx_voice_processing_jobs_recording ON voice_processing_jobs(recording_id);
CREATE INDEX idx_voice_processing_jobs_status ON voice_processing_jobs(status, priority);
CREATE INDEX idx_voice_processing_jobs_retry ON voice_processing_jobs(next_retry_at);
CREATE INDEX idx_voice_processing_jobs_type ON voice_processing_jobs(job_type);

CREATE INDEX idx_voice_templates_key ON voice_templates(template_key);
CREATE INDEX idx_voice_templates_type ON voice_templates(recording_type);
CREATE INDEX idx_voice_templates_active ON voice_templates(is_active);

CREATE INDEX idx_voice_analytics_user ON voice_analytics(user_id);
CREATE INDEX idx_voice_analytics_recording ON voice_analytics(recording_id);
CREATE INDEX idx_voice_analytics_type ON voice_analytics(metric_type);
CREATE INDEX idx_voice_analytics_date ON voice_analytics(measurement_date DESC);

-- Insert default voice templates
INSERT INTO voice_templates (
  id, template_key, name_en, name_de, description_en, description_de,
  recording_type, suggested_duration, prompt_text_en, prompt_text_de, ai_analysis_config
) VALUES 
-- Daily reflection template
('tpl_daily_reflection', 'daily_reflection', 'Daily Reflection', 'Tägliche Reflexion',
 'Record your thoughts about the day', 'Nimm deine Gedanken über den Tag auf',
 'reflection', 180, 
 'How was your day? What went well? What could be improved?',
 'Wie war dein Tag? Was lief gut? Was könnte verbessert werden?',
 '{"analyze_mood": true, "extract_insights": true, "identify_patterns": true}'),

-- Voice task creation
('tpl_voice_task', 'voice_task', 'Voice Task', 'Sprach-Aufgabe',
 'Create tasks by speaking naturally', 'Erstelle Aufgaben durch natürliches Sprechen',
 'task_creation', 60,
 'Describe the task you want to create, including any details or deadlines',
 'Beschreibe die Aufgabe, die du erstellen möchtest, einschließlich Details oder Fristen',
 '{"extract_tasks": true, "identify_priority": true, "detect_deadlines": true}'),

-- Health voice log
('tpl_health_log', 'health_voice_log', 'Health Voice Log', 'Gesundheits-Sprachprotokoll',
 'Log your health activities and feelings', 'Protokolliere deine Gesundheitsaktivitäten und Gefühle',
 'health_log', 120,
 'Tell me about your exercise, meals, mood, or any health-related activities today',
 'Erzähle mir von deinem Sport, Mahlzeiten, Stimmung oder gesundheitsbezogenen Aktivitäten heute',
 '{"extract_health_data": true, "analyze_mood": true, "identify_activities": true}'),

-- Meeting notes
('tpl_meeting_notes', 'meeting_notes', 'Meeting Notes', 'Besprechungsnotizen',
 'Record important points from meetings', 'Nimm wichtige Punkte aus Besprechungen auf',
 'meeting_note', 300,
 'Record the key points, decisions, and action items from your meeting',
 'Nimm die wichtigsten Punkte, Entscheidungen und Aktionspunkte deiner Besprechung auf',
 '{"extract_action_items": true, "identify_decisions": true, "summarize_content": true}'),

-- Quick voice note
('tpl_quick_note', 'quick_note', 'Quick Voice Note', 'Schnelle Sprachnotiz',
 'Capture quick thoughts and ideas', 'Halte schnelle Gedanken und Ideen fest',
 'voice_note', 30,
 'What''s on your mind? Record any quick thoughts or ideas',
 'Was beschäftigt dich? Nimm schnelle Gedanken oder Ideen auf',
 '{"extract_keywords": true, "categorize_content": true}'),

-- Habit reminder response
('tpl_habit_response', 'habit_response', 'Habit Check-in', 'Gewohnheits-Check-in',
 'Respond to habit reminders with voice', 'Antworte auf Gewohnheitserinnerungen mit Sprache',
 'habit_reminder', 45,
 'How did your habit go today? Any challenges or successes to share?',
 'Wie lief deine Gewohnheit heute? Gibt es Herausforderungen oder Erfolge zu teilen?',
 '{"track_progress": true, "identify_obstacles": true, "measure_satisfaction": true}');

-- Insert default user voice settings for existing users
INSERT INTO user_voice_settings (user_id, created_at, updated_at)
SELECT id, created_at, updated_at FROM users 
WHERE id NOT IN (SELECT user_id FROM user_voice_settings);

-- Create triggers for automatic processing job creation
CREATE TRIGGER create_transcription_job
AFTER INSERT ON voice_recordings
WHEN NEW.transcription_status = 'pending'
BEGIN
  INSERT INTO voice_processing_jobs (
    id, recording_id, job_type, priority, job_data, created_at
  ) VALUES (
    'job_transcribe_' || NEW.id,
    NEW.id,
    'transcription',
    3, -- Medium priority
    json_object(
      'service', 'deepgram',
      'language', NEW.transcription_language,
      'model', 'nova-2'
    ),
    strftime('%s', 'now') * 1000
  );
END;

-- Create trigger for AI analysis job after transcription
CREATE TRIGGER create_ai_analysis_job
AFTER UPDATE OF transcription_status ON voice_recordings
WHEN NEW.transcription_status = 'completed' AND OLD.transcription_status != 'completed'
  AND NEW.ai_analysis_status = 'pending'
BEGIN
  INSERT INTO voice_processing_jobs (
    id, recording_id, job_type, priority, job_data, created_at
  ) VALUES (
    'job_analyze_' || NEW.id,
    NEW.id,
    'ai_analysis',
    4, -- Lower priority than transcription
    json_object(
      'service', 'openai',
      'model', 'gpt-4o-mini',
      'recording_type', NEW.recording_type
    ),
    strftime('%s', 'now') * 1000
  );
END;

-- Create trigger to update play count and last played
CREATE TRIGGER update_voice_play_stats
AFTER UPDATE OF play_count ON voice_recordings
WHEN NEW.play_count > OLD.play_count
BEGIN
  UPDATE voice_recordings 
  SET last_played_at = strftime('%s', 'now') * 1000,
      updated_at = strftime('%s', 'now') * 1000
  WHERE id = NEW.id;
END;

-- Create trigger for voice analytics on recording completion
CREATE TRIGGER record_voice_analytics
AFTER UPDATE OF upload_status ON voice_recordings
WHEN NEW.upload_status = 'completed' AND OLD.upload_status != 'completed'
BEGIN
  INSERT INTO voice_analytics (
    id, user_id, recording_id, metric_type, metric_value, 
    metric_unit, measurement_date, additional_data
  ) VALUES (
    'analytics_' || NEW.id || '_duration',
    NEW.user_id,
    NEW.id,
    'recording_duration',
    COALESCE(NEW.duration_seconds, 0),
    'seconds',
    strftime('%s', 'now') * 1000,
    json_object('recording_type', NEW.recording_type, 'file_size', NEW.file_size_bytes)
  );
END;

-- Create view for voice recording dashboard
CREATE VIEW voice_dashboard_view AS
SELECT 
  vr.id,
  vr.user_id,
  vr.recording_type,
  vr.title,
  vr.duration_seconds,
  vr.upload_status,
  vr.transcription_status,
  vr.ai_analysis_status,
  vr.created_at,
  vr.play_count,
  CASE 
    WHEN vr.transcription_text IS NOT NULL THEN length(vr.transcription_text)
    ELSE 0
  END as transcription_length,
  COUNT(vpj.id) as processing_jobs_count,
  COUNT(CASE WHEN vpj.status = 'failed' THEN 1 END) as failed_jobs_count
FROM voice_recordings vr
LEFT JOIN voice_processing_jobs vpj ON vr.id = vpj.recording_id
WHERE vr.is_archived = false
GROUP BY vr.id;

-- Create view for voice analytics summary
CREATE VIEW voice_analytics_summary AS
SELECT 
  user_id,
  COUNT(*) as total_recordings,
  SUM(duration_seconds) as total_duration_seconds,
  AVG(duration_seconds) as avg_duration_seconds,
  COUNT(CASE WHEN transcription_status = 'completed' THEN 1 END) as transcribed_count,
  COUNT(CASE WHEN ai_analysis_status = 'completed' THEN 1 END) as analyzed_count,
  SUM(play_count) as total_plays,
  MAX(created_at) as last_recording_at
FROM voice_recordings
WHERE is_archived = false
GROUP BY user_id;