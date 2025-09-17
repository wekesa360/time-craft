-- Notifications System Enhancement
-- Adds notification history, user preferences, and OneSignal integration

-- Add OneSignal player ID to users table for push notifications
ALTER TABLE users ADD COLUMN onesignal_player_id TEXT;
ALTER TABLE users ADD COLUMN notification_preferences JSON DEFAULT '{"push": true, "email": true, "sms": false}';
ALTER TABLE users ADD COLUMN timezone_offset INTEGER DEFAULT 0; -- For scheduling notifications

-- Create notification history table
CREATE TABLE notification_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT CHECK(type IN ('badge_unlocked','task_reminder','health_insight','social_update','focus_break','habit_reminder','system')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  sent BOOLEAN DEFAULT false,
  delivery_method TEXT CHECK(delivery_method IN ('push','email','sms')) DEFAULT 'push',
  onesignal_id TEXT, -- OneSignal notification ID
  opened BOOLEAN DEFAULT false,
  opened_at INTEGER,
  scheduled_for INTEGER, -- When notification should be sent
  sent_at INTEGER, -- When notification was actually sent
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create notification templates table for localized content
CREATE TABLE notification_templates (
  id TEXT PRIMARY KEY,
  template_key TEXT NOT NULL,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data_schema JSON, -- JSON schema for required data fields
  category TEXT CHECK(category IN ('task','health','achievement','reminder','system','social')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(template_key, language)
);

-- Create notification schedules table for recurring notifications
CREATE TABLE notification_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  template_key TEXT NOT NULL,
  schedule_type TEXT CHECK(schedule_type IN ('daily','weekly','monthly','custom')) NOT NULL,
  schedule_data JSON NOT NULL, -- Cron-like schedule or specific times
  is_active BOOLEAN DEFAULT true,
  last_sent INTEGER,
  next_scheduled INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Create user device registrations for push notifications
CREATE TABLE user_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  device_type TEXT CHECK(device_type IN ('ios','android','web')) NOT NULL,
  device_token TEXT, -- FCM/APNS token
  onesignal_player_id TEXT,
  device_info JSON, -- Device model, OS version, app version, etc.
  is_active BOOLEAN DEFAULT true,
  last_seen INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  UNIQUE(user_id, device_token)
);

-- Create indexes for performance
CREATE INDEX idx_notification_history_user ON notification_history(user_id);
CREATE INDEX idx_notification_history_type ON notification_history(type);
CREATE INDEX idx_notification_history_sent ON notification_history(sent, sent_at);
CREATE INDEX idx_notification_history_scheduled ON notification_history(scheduled_for);
CREATE INDEX idx_notification_history_created ON notification_history(created_at DESC);

CREATE INDEX idx_notification_templates_key_lang ON notification_templates(template_key, language);
CREATE INDEX idx_notification_templates_category ON notification_templates(category);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active);

CREATE INDEX idx_notification_schedules_user ON notification_schedules(user_id);
CREATE INDEX idx_notification_schedules_active ON notification_schedules(is_active);
CREATE INDEX idx_notification_schedules_next ON notification_schedules(next_scheduled);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_user_devices_active ON user_devices(is_active);
CREATE INDEX idx_user_devices_onesignal ON user_devices(onesignal_player_id);

-- Insert default notification templates
INSERT INTO notification_templates (
  id, template_key, language, title, message, data_schema, category
) VALUES 
-- Badge unlocked templates
('tpl_badge_en', 'badge_unlocked', 'en', 
 '🎉 Badge Unlocked!', 
 'Congratulations! You''ve earned the "{{badgeName}}" badge and gained {{points}} points!',
 '{"badgeName": "string", "points": "number"}', 
 'achievement'),

('tpl_badge_de', 'badge_unlocked', 'de', 
 '🎉 Abzeichen freigeschaltet!', 
 'Glückwunsch! Du hast das "{{badgeName}}" Abzeichen verdient und {{points}} Punkte erhalten!',
 '{"badgeName": "string", "points": "number"}', 
 'achievement'),

-- Task reminder templates
('tpl_task_reminder_en', 'task_reminder', 'en', 
 '⏰ Task Reminder', 
 'Don''t forget: "{{taskTitle}}" is due {{dueTime}}',
 '{"taskTitle": "string", "dueTime": "string"}', 
 'task'),

('tpl_task_reminder_de', 'task_reminder', 'de', 
 '⏰ Aufgaben-Erinnerung', 
 'Vergiss nicht: "{{taskTitle}}" ist fällig {{dueTime}}',
 '{"taskTitle": "string", "dueTime": "string"}', 
 'task'),

-- Health insight templates
('tpl_health_insight_en', 'health_insight', 'en', 
 '💡 Health Insight', 
 '{{insight}}',
 '{"insight": "string"}', 
 'health'),

('tpl_health_insight_de', 'health_insight', 'de', 
 '💡 Gesundheits-Einsicht', 
 '{{insight}}',
 '{"insight": "string"}', 
 'health'),

-- Focus break templates
('tpl_focus_break_en', 'focus_break', 'en', 
 '🧘 Time for a Break', 
 'You''ve been focused for {{minutes}} minutes. Take a 5-minute break to recharge!',
 '{"minutes": "number"}', 
 'reminder'),

('tpl_focus_break_de', 'focus_break', 'de', 
 '🧘 Zeit für eine Pause', 
 'Du warst {{minutes}} Minuten konzentriert. Mach eine 5-minütige Pause zum Aufladen!',
 '{"minutes": "number"}', 
 'reminder'),

-- Habit reminder templates
('tpl_habit_reminder_en', 'habit_reminder', 'en', 
 '🎯 Habit Reminder', 
 'Time for your daily "{{habitName}}" habit!',
 '{"habitName": "string"}', 
 'reminder'),

('tpl_habit_reminder_de', 'habit_reminder', 'de', 
 '🎯 Gewohnheits-Erinnerung', 
 'Zeit für deine tägliche "{{habitName}}" Gewohnheit!',
 '{"habitName": "string"}', 
 'reminder'),

-- Water reminder templates
('tpl_water_reminder_en', 'water_reminder', 'en', 
 '💧 Hydration Reminder', 
 'Time to drink some water! Stay hydrated for better health.',
 '{}', 
 'reminder'),

('tpl_water_reminder_de', 'water_reminder', 'de', 
 '💧 Hydrations-Erinnerung', 
 'Zeit, etwas Wasser zu trinken! Bleib hydriert für bessere Gesundheit.',
 '{}', 
 'reminder'),

-- Exercise reminder templates
('tpl_exercise_reminder_en', 'exercise_reminder', 'en', 
 '🏃 Workout Time!', 
 'Time for your {{workoutType}} workout. Let''s get moving!',
 '{"workoutType": "string"}', 
 'reminder'),

('tpl_exercise_reminder_de', 'exercise_reminder', 'de', 
 '🏃 Trainingszeit!', 
 'Zeit für dein {{workoutType}} Training. Lass uns loslegen!',
 '{"workoutType": "string"}', 
 'reminder'),

-- Social update templates
('tpl_social_update_en', 'social_update', 'en', 
 '👥 Social Update', 
 '{{message}}',
 '{"message": "string"}', 
 'social'),

('tpl_social_update_de', 'social_update', 'de', 
 '👥 Soziales Update', 
 '{{message}}',
 '{"message": "string"}', 
 'social');

-- Insert default notification schedules for common reminders
-- These will be activated when users enable specific features

-- Daily water reminder (every 2 hours during waking hours)
INSERT INTO notification_schedules (
  id, user_id, template_key, schedule_type, schedule_data, is_active, next_scheduled
) VALUES 
('sched_water_template', 'template', 'water_reminder', 'daily', 
 '{"times": ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"], "timezone": "user"}', 
 false, 0);

-- Daily habit reminders (customizable per user)
INSERT INTO notification_schedules (
  id, user_id, template_key, schedule_type, schedule_data, is_active, next_scheduled
) VALUES 
('sched_habit_template', 'template', 'habit_reminder', 'daily', 
 '{"time": "09:00", "timezone": "user"}', 
 false, 0);

-- Weekly health check-in
INSERT INTO notification_schedules (
  id, user_id, template_key, schedule_type, schedule_data, is_active, next_scheduled
) VALUES 
('sched_health_template', 'template', 'health_insight', 'weekly', 
 '{"day": "sunday", "time": "19:00", "timezone": "user"}', 
 false, 0);

-- Create trigger to update notification opened status
CREATE TRIGGER update_notification_opened
AFTER UPDATE OF opened ON notification_history
WHEN NEW.opened = true AND OLD.opened = false
BEGIN
  UPDATE notification_history 
  SET opened_at = strftime('%s', 'now') * 1000
  WHERE id = NEW.id;
END;

-- Create trigger to update device last_seen
CREATE TRIGGER update_device_last_seen
AFTER UPDATE ON user_devices
BEGIN
  UPDATE user_devices 
  SET last_seen = strftime('%s', 'now') * 1000,
      updated_at = strftime('%s', 'now') * 1000
  WHERE id = NEW.id;
END;