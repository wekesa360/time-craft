-- Migration 023: Seed Calendar Events for michaelwekesa@kabarak.ac.ke
-- This migration adds sample calendar events for the user to demonstrate calendar functionality

-- Get user ID for michaelwekesa@kabarak.ac.ke
-- Note: description, location, and eventType columns are added in migration 024
-- So we only use columns that exist at this point
INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  meeting_participants,
  ai_confidence_score,
  created_at
) VALUES
-- Academic Events
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Software Engineering Lecture',
  strftime('%s', 'now', '+1 day', '+9 hours') * 1000,
  strftime('%s', 'now', '+1 day', '+11 hours') * 1000,
  'manual',
  false,
  json_array('Dr. Sarah Johnson', 'Software Engineering Class'),
  0.85,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Database Systems Lab',
  strftime('%s', 'now', '+2 days', '+14 hours') * 1000,
  strftime('%s', 'now', '+2 days', '+17 hours') * 1000,
  'manual',
  false,
  json_array('Prof. Michael Chen', 'Lab Assistant'),
  0.90,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Project Presentation',
  strftime('%s', 'now', '+5 days', '+10 hours') * 1000,
  strftime('%s', 'now', '+5 days', '+12 hours') * 1000,
  'manual',
  false,
  json_array('Project Supervisor', 'External Examiner', 'Classmates'),
  0.95,
  strftime('%s', 'now') * 1000
),

-- Study Sessions
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Group Study Session - Algorithms',
  strftime('%s', 'now', '+1 day', '+15 hours') * 1000,
  strftime('%s', 'now', '+1 day', '+18 hours') * 1000,
  'manual',
  false,
  json_array('John Doe', 'Jane Smith', 'Michael Brown'),
  0.75,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Individual Study - Data Structures',
  strftime('%s', 'now', '+3 days', '+19 hours') * 1000,
  strftime('%s', 'now', '+3 days', '+21 hours') * 1000,
  'manual',
  false,
  NULL,
  0.80,
  strftime('%s', 'now') * 1000
),

-- Meetings and Appointments
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Academic Advisor Meeting',
  strftime('%s', 'now', '+4 days', '+11 hours') * 1000,
  strftime('%s', 'now', '+4 days', '+12 hours') * 1000,
  'manual',
  false,
  json_array('Dr. Elizabeth Wilson'),
  0.85,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Career Counseling Session',
  strftime('%s', 'now', '+6 days', '+13 hours') * 1000,
  strftime('%s', 'now', '+6 days', '+14 hours') * 1000,
  'manual',
  false,
  json_array('Career Counselor'),
  0.90,
  strftime('%s', 'now') * 1000
),

-- Personal Activities
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Morning Workout',
  strftime('%s', 'now', '+1 day', '+6 hours') * 1000,
  strftime('%s', 'now', '+1 day', '+7 hours 30 minutes') * 1000,
  'manual',
  false,
  NULL,
  0.70,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Lunch with Friends',
  strftime('%s', 'now', '+2 days', '+12 hours') * 1000,
  strftime('%s', 'now', '+2 days', '+13 hours') * 1000,
  'manual',
  false,
  json_array('Roommate 1', 'Roommate 2'),
  0.60,
  strftime('%s', 'now') * 1000
),

-- Weekly Recurring Events (next week)
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Programming Club Meeting',
  strftime('%s', 'now', '+7 days', '+17 hours') * 1000,
  strftime('%s', 'now', '+7 days', '+19 hours') * 1000,
  'manual',
  false,
  json_array('Club Members', 'Guest Speaker'),
  0.85,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Research Methodology Seminar',
  strftime('%s', 'now', '+8 days', '+10 hours') * 1000,
  strftime('%s', 'now', '+8 days', '+12 hours') * 1000,
  'manual',
  false,
  json_array('Research Faculty', 'Graduate Students'),
  0.90,
  strftime('%s', 'now') * 1000
),

-- Past Events (for analytics and history)
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Object-Oriented Programming Exam',
  strftime('%s', 'now', '-3 days', '+9 hours') * 1000,
  strftime('%s', 'now', '-3 days', '+12 hours') * 1000,
  'manual',
  false,
  NULL,
  0.95,
  strftime('%s', 'now', '-3 days') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Team Project Meeting',
  strftime('%s', 'now', '-2 days', '+15 hours') * 1000,
  strftime('%s', 'now', '-2 days', '+17 hours') * 1000,
  'manual',
  false,
  json_array('Team Lead', 'Backend Developer', 'UI Designer'),
  0.80,
  strftime('%s', 'now', '-2 days') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Coding Bootcamp Workshop',
  strftime('%s', 'now', '-1 day', '+9 hours') * 1000,
  strftime('%s', 'now', '-1 day', '+17 hours') * 1000,
  'manual',
  false,
  json_array('Industry Mentors', 'Fellow Participants'),
  0.90,
  strftime('%s', 'now', '-1 day') * 1000
),

-- Remote/Online Events
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Virtual Tech Talk - AI in Education',
  strftime('%s', 'now', '+3 days', '+16 hours') * 1000,
  strftime('%s', 'now', '+3 days', '+18 hours') * 1000,
  'manual',
  false,
  json_array('Dr. Alex Turner', 'Students', 'Faculty'),
  0.85,
  strftime('%s', 'now') * 1000
),
(
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Online Course - Machine Learning Basics',
  strftime('%s', 'now', '+4 days', '+20 hours') * 1000,
  strftime('%s', 'now', '+4 days', '+22 hours') * 1000,
  'manual',
  false,
  NULL,
  0.75,
  strftime('%s', 'now') * 1000
);

-- Create calendar integration record for Google Calendar
-- Note: calendar_integrations table is created in migration 024, so this is commented out
-- INSERT OR IGNORE INTO calendar_integrations (
--   id,
--   user_id,
--   provider_type,
--   provider_email,
--   access_token,
--   refresh_token,
--   sync_enabled,
--   last_sync_at,
--   calendar_list,
--   sync_settings,
--   created_at,
--   updated_at
-- ) VALUES (
--   'int_' || lower(hex(randomblob(16))),
--   (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
--   'google',
--   'michaelwekesa@kabarak.ac.ke',
--   'sample_access_token_' || lower(hex(randomblob(32))),
--   'sample_refresh_token_' || lower(hex(randomblob(32))),
--   true,
--   strftime('%s', 'now') * 1000,
--   json_array(
--     json_object('id', 'primary', 'name', 'Michael Wekesa', 'primary', true),
--     json_object('id', 'academic', 'name', 'Academic Calendar', 'primary', false),
--     json_object('id', 'personal', 'name', 'Personal Events', 'primary', false)
--   ),
--   json_object(
--     'syncFrequency', 15,
--     'conflictResolution', 'external',
--     'twoWaySync', true,
--     'syncPastEvents', false,
--     'syncFutureMonths', 6
--   ),
--   strftime('%s', 'now') * 1000,
--   strftime('%s', 'now') * 1000
-- );

-- Add some calendar reminders
-- Note: notifications table doesn't exist - only push_notifications exists, so this is commented out
-- INSERT OR IGNORE INTO notifications (
--   id,
--   user_id,
--   type,
--   title,
--   message,
--   data,
--   priority,
--   status,
--   scheduled_for,
--   created_at
-- ) VALUES
-- (
--   'notif_' || lower(hex(randomblob(16))),
--   (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
--   'calendar_reminder',
--   'Upcoming: Software Engineering Lecture',
--   'Your lecture starts in 30 minutes at Room 204, Computer Science Building',
--   json_object('event_id', 'cal_upcoming_lecture', 'reminder_minutes', 30),
--   'medium',
--   'pending',
--   strftime('%s', 'now', '+1 day', '+8 hours 30 minutes') * 1000,
--   strftime('%s', 'now') * 1000
-- ),
-- (
--   'notif_' || lower(hex(randomblob(16))),
--   (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
--   'calendar_reminder',
--   'Don\'t forget: Project Presentation',
--   'Your final project presentation is tomorrow at 10:00 AM',
--   json_object('event_id', 'cal_project_presentation', 'reminder_minutes', 1440),
--   'high',
--   'pending',
--   strftime('%s', 'now', '+4 days', '+10 hours') * 1000,
--   strftime('%s', 'now') * 1000
-- );

-- Add calendar sync activity logs
-- Note: activity_feed table is created in migration 024, so this is commented out
-- INSERT OR IGNORE INTO activity_feed (
--   id,
--   user_id,
--   type,
--   title,
--   description,
--   data,
--   created_at
-- ) VALUES
-- (
--   'activity_' || lower(hex(randomblob(16))),
--   (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
--   'calendar_sync',
--   'Google Calendar Connected',
--   'Successfully connected and synced your Google Calendar with 15 events imported',
--   json_object('provider', 'google', 'events_imported', 15, 'calendars_synced', 3),
--   strftime('%s', 'now', '-1 hour') * 1000
-- ),
-- (
--   'activity_' || lower(hex(randomblob(16))),
--   (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
--   'calendar_event',
--   'New Event Created',
--   'Added "Project Presentation" to your calendar',
--   json_object('event_title', 'Project Presentation', 'event_type', 'meeting'),
--   strftime('%s', 'now', '-30 minutes') * 1000
-- );