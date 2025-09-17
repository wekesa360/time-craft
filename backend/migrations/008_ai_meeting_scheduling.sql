-- AI Meeting Scheduling System
-- Comprehensive meeting scheduling with AI optimization and external calendar integration

-- Enhanced meeting requests table (building on existing structure)
-- Note: meeting_requests table already exists from migration 002, we'll add missing columns
ALTER TABLE meeting_requests ADD COLUMN meeting_type TEXT CHECK(meeting_type IN ('one_on_one','team','interview','presentation','workshop','standup')) DEFAULT 'team';
ALTER TABLE meeting_requests ADD COLUMN priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium';
ALTER TABLE meeting_requests ADD COLUMN location_type TEXT CHECK(location_type IN ('in_person','video_call','phone','hybrid')) DEFAULT 'video_call';
ALTER TABLE meeting_requests ADD COLUMN location_details TEXT; -- Zoom link, room number, etc.
ALTER TABLE meeting_requests ADD COLUMN agenda TEXT;
ALTER TABLE meeting_requests ADD COLUMN preparation_time INTEGER DEFAULT 0; -- minutes needed before meeting
ALTER TABLE meeting_requests ADD COLUMN buffer_time INTEGER DEFAULT 15; -- minutes buffer after meeting
ALTER TABLE meeting_requests ADD COLUMN recurring_pattern JSON; -- For recurring meetings
ALTER TABLE meeting_requests ADD COLUMN ai_analysis JSON; -- AI insights about optimal scheduling
ALTER TABLE meeting_requests ADD COLUMN external_calendar_sync BOOLEAN DEFAULT false;
ALTER TABLE meeting_requests ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000);

-- Meeting participants with detailed availability
CREATE TABLE meeting_participants (
  id TEXT PRIMARY KEY,
  meeting_request_id TEXT NOT NULL REFERENCES meeting_requests(id),
  participant_email TEXT NOT NULL,
  participant_name TEXT,
  participant_role TEXT CHECK(participant_role IN ('organizer','required','optional','presenter','observer')),
  response_status TEXT CHECK(response_status IN ('pending','accepted','declined','tentative')) DEFAULT 'pending',
  availability_data JSON, -- Time slots when participant is available
  timezone TEXT DEFAULT 'UTC',
  external_calendar_id TEXT, -- Google/Outlook calendar ID
  constraints JSON, -- Specific constraints like "no meetings before 9 AM"
  responded_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(meeting_request_id, participant_email)
);

-- AI-generated meeting time slots with scoring
CREATE TABLE meeting_time_slots (
  id TEXT PRIMARY KEY,
  meeting_request_id TEXT NOT NULL REFERENCES meeting_requests(id),
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  ai_score REAL NOT NULL, -- 0-100 score from AI analysis
  confidence_level REAL NOT NULL, -- 0-1 confidence in the score
  reasoning TEXT NOT NULL, -- AI explanation for the score
  participant_conflicts JSON, -- List of participants with conflicts
  availability_summary JSON, -- Summary of participant availability
  optimal_factors JSON, -- Factors that make this slot optimal
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- External calendar integrations
CREATE TABLE calendar_integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT CHECK(provider IN ('google','outlook','apple','exchange')) NOT NULL,
  calendar_id TEXT NOT NULL,
  calendar_name TEXT,
  access_token_enc TEXT NOT NULL, -- Encrypted access token
  refresh_token_enc TEXT, -- Encrypted refresh token
  token_expires_at INTEGER,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at INTEGER,
  sync_status TEXT CHECK(sync_status IN ('active','error','expired','disabled')) DEFAULT 'active',
  sync_error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(user_id, provider, calendar_id)
);

-- Meeting scheduling analytics
CREATE TABLE meeting_analytics (
  id TEXT PRIMARY KEY,
  meeting_request_id TEXT NOT NULL REFERENCES meeting_requests(id),
  metric_type TEXT CHECK(metric_type IN ('scheduling_time','participant_response_rate','optimal_slot_accuracy','rescheduling_rate')) NOT NULL,
  metric_value REAL NOT NULL,
  measurement_date INTEGER NOT NULL,
  additional_data JSON,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Meeting feedback for AI improvement
CREATE TABLE meeting_feedback (
  id TEXT PRIMARY KEY,
  meeting_request_id TEXT NOT NULL REFERENCES meeting_requests(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  feedback_type TEXT CHECK(feedback_type IN ('scheduling_quality','time_slot_accuracy','ai_suggestions','overall_experience')) NOT NULL,
  rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
  feedback_text TEXT,
  improvement_suggestions JSON,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Smart availability patterns (learned from user behavior)
CREATE TABLE availability_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pattern_type TEXT CHECK(pattern_type IN ('daily','weekly','monthly','seasonal')) NOT NULL,
  pattern_data JSON NOT NULL, -- Time patterns, preferences, etc.
  confidence_score REAL NOT NULL, -- How confident we are in this pattern
  usage_count INTEGER DEFAULT 0, -- How often this pattern was used
  accuracy_rate REAL DEFAULT 0, -- How accurate predictions were
  last_updated INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(user_id, pattern_type)
);

-- Create indexes for performance
CREATE INDEX idx_meeting_requests_organizer_status ON meeting_requests(organizer_id, status);
CREATE INDEX idx_meeting_requests_created ON meeting_requests(created_at DESC);
CREATE INDEX idx_meeting_requests_priority ON meeting_requests(priority);

CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_request_id);
CREATE INDEX idx_meeting_participants_email ON meeting_participants(participant_email);
CREATE INDEX idx_meeting_participants_status ON meeting_participants(response_status);

CREATE INDEX idx_meeting_time_slots_meeting ON meeting_time_slots(meeting_request_id);
CREATE INDEX idx_meeting_time_slots_score ON meeting_time_slots(ai_score DESC);
CREATE INDEX idx_meeting_time_slots_time ON meeting_time_slots(start_time, end_time);

CREATE INDEX idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX idx_calendar_integrations_sync ON calendar_integrations(sync_enabled, last_sync_at);

CREATE INDEX idx_meeting_analytics_meeting ON meeting_analytics(meeting_request_id);
CREATE INDEX idx_meeting_analytics_type ON meeting_analytics(metric_type);
CREATE INDEX idx_meeting_analytics_date ON meeting_analytics(measurement_date DESC);

CREATE INDEX idx_meeting_feedback_meeting ON meeting_feedback(meeting_request_id);
CREATE INDEX idx_meeting_feedback_user ON meeting_feedback(user_id);
CREATE INDEX idx_meeting_feedback_type ON meeting_feedback(feedback_type);

CREATE INDEX idx_availability_patterns_user ON availability_patterns(user_id);
CREATE INDEX idx_availability_patterns_type ON availability_patterns(pattern_type);
CREATE INDEX idx_availability_patterns_confidence ON availability_patterns(confidence_score DESC);

-- Insert default meeting templates and preferences
INSERT INTO localized_content (
  id, content_key, language, content, created_at
) VALUES 
-- Meeting invitation templates
('meeting_invite_en', 'meeting_invitation', 'en', 
 'You''re invited to "{{title}}" scheduled for {{date}} at {{time}}. Duration: {{duration}} minutes. {{agenda}}',
 strftime('%s', 'now') * 1000),

('meeting_invite_de', 'meeting_invitation', 'de', 
 'Sie sind zu "{{title}}" am {{date}} um {{time}} eingeladen. Dauer: {{duration}} Minuten. {{agenda}}',
 strftime('%s', 'now') * 1000),

-- Meeting reminder templates
('meeting_reminder_en', 'meeting_reminder', 'en', 
 'Reminder: "{{title}}" starts in {{minutes}} minutes. Join: {{location}}',
 strftime('%s', 'now') * 1000),

('meeting_reminder_de', 'meeting_reminder', 'de', 
 'Erinnerung: "{{title}}" beginnt in {{minutes}} Minuten. Beitreten: {{location}}',
 strftime('%s', 'now') * 1000),

-- AI scheduling suggestions
('ai_suggestion_en', 'ai_scheduling_suggestion', 'en', 
 'Based on participant availability, I suggest {{date}} at {{time}}. This slot has {{score}}% compatibility.',
 strftime('%s', 'now') * 1000),

('ai_suggestion_de', 'ai_scheduling_suggestion', 'de', 
 'Basierend auf der Verfügbarkeit der Teilnehmer schlage ich {{date}} um {{time}} vor. Dieser Slot hat {{score}}% Kompatibilität.',
 strftime('%s', 'now') * 1000);

-- Create triggers for meeting analytics
CREATE TRIGGER meeting_request_analytics
AFTER UPDATE OF status ON meeting_requests
WHEN NEW.status = 'scheduled' AND OLD.status != 'scheduled'
BEGIN
  INSERT INTO meeting_analytics (
    id, meeting_request_id, metric_type, metric_value, measurement_date
  ) VALUES (
    'analytics_' || NEW.id || '_' || strftime('%s', 'now'),
    NEW.id,
    'scheduling_time',
    (strftime('%s', 'now') * 1000 - NEW.created_at) / 1000.0 / 60.0, -- minutes to schedule
    strftime('%s', 'now') * 1000
  );
END;

-- Create trigger to update participant response rates
CREATE TRIGGER participant_response_analytics
AFTER UPDATE OF response_status ON meeting_participants
WHEN NEW.response_status != 'pending' AND OLD.response_status = 'pending'
BEGIN
  INSERT INTO meeting_analytics (
    id, meeting_request_id, metric_type, metric_value, measurement_date, additional_data
  ) VALUES (
    'analytics_' || NEW.meeting_request_id || '_' || strftime('%s', 'now'),
    NEW.meeting_request_id,
    'participant_response_rate',
    1.0, -- Individual response (will be aggregated later)
    strftime('%s', 'now') * 1000,
    json_object('participant_email', NEW.participant_email, 'response', NEW.response_status)
  );
END;

-- Create view for meeting dashboard
CREATE VIEW meeting_dashboard_view AS
SELECT 
  mr.id,
  mr.title,
  mr.organizer_id,
  mr.status,
  mr.priority,
  mr.meeting_type,
  mr.duration_minutes,
  mr.created_at,
  COUNT(mp.id) as participant_count,
  COUNT(CASE WHEN mp.response_status = 'accepted' THEN 1 END) as accepted_count,
  COUNT(CASE WHEN mp.response_status = 'declined' THEN 1 END) as declined_count,
  COUNT(CASE WHEN mp.response_status = 'pending' THEN 1 END) as pending_count,
  AVG(mts.ai_score) as avg_ai_score,
  MAX(mts.ai_score) as best_ai_score
FROM meeting_requests mr
LEFT JOIN meeting_participants mp ON mr.id = mp.meeting_request_id
LEFT JOIN meeting_time_slots mts ON mr.id = mts.meeting_request_id
GROUP BY mr.id;

-- Insert sample availability patterns for common scenarios
INSERT INTO availability_patterns (
  id, user_id, pattern_type, pattern_data, confidence_score, last_updated, created_at
) VALUES 
-- Template patterns that can be copied for new users
('pattern_template_daily', 'template', 'daily', 
 '{"preferred_hours": {"start": 9, "end": 17}, "break_times": [{"start": 12, "end": 13}], "buffer_minutes": 15}',
 0.8, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),

('pattern_template_weekly', 'template', 'weekly', 
 '{"preferred_days": [1,2,3,4,5], "avoid_days": [0,6], "meeting_heavy_days": [2,3,4], "focus_days": [1,5]}',
 0.7, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);