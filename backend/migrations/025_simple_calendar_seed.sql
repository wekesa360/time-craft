-- Migration 025: Simple Calendar Seed Data
-- Seed calendar events for michaelwekesa@kabarak.ac.ke

-- Check if user exists and insert calendar events
INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Software Engineering Lecture',
  strftime('%s', 'now', '+1 day', '+9 hours') * 1000,
  strftime('%s', 'now', '+1 day', '+11 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Database Systems Lab',
  strftime('%s', 'now', '+2 days', '+14 hours') * 1000,
  strftime('%s', 'now', '+2 days', '+17 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Project Presentation',
  strftime('%s', 'now', '+5 days', '+10 hours') * 1000,
  strftime('%s', 'now', '+5 days', '+12 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Group Study Session - Algorithms',
  strftime('%s', 'now', '+1 day', '+15 hours') * 1000,
  strftime('%s', 'now', '+1 day', '+18 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Academic Advisor Meeting',
  strftime('%s', 'now', '+4 days', '+11 hours') * 1000,
  strftime('%s', 'now', '+4 days', '+12 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Morning Workout',
  strftime('%s', 'now', '+1 day', '+6 hours') * 1000,
  strftime('%s', 'now', '+1 day', '+7 hours 30 minutes') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Programming Club Meeting',
  strftime('%s', 'now', '+7 days', '+17 hours') * 1000,
  strftime('%s', 'now', '+7 days', '+19 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Object-Oriented Programming Exam',
  strftime('%s', 'now', '-3 days', '+9 hours') * 1000,
  strftime('%s', 'now', '-3 days', '+12 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now', '-3 days') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Team Project Meeting',
  strftime('%s', 'now', '-2 days', '+15 hours') * 1000,
  strftime('%s', 'now', '-2 days', '+17 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now', '-2 days') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');

INSERT OR IGNORE INTO calendar_events (
  id,
  user_id,
  title,
  start,
  "end",
  source,
  ai_generated,
  created_at
)
SELECT
  'cal_' || lower(hex(randomblob(16))),
  (SELECT id FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke'),
  'Virtual Tech Talk - AI in Education',
  strftime('%s', 'now', '+3 days', '+16 hours') * 1000,
  strftime('%s', 'now', '+3 days', '+18 hours') * 1000,
  'manual',
  false,
  strftime('%s', 'now') * 1000
WHERE EXISTS (SELECT 1 FROM users WHERE email = 'michaelwekesa@kabarak.ac.ke');