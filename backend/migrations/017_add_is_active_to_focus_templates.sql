-- Add is_active column to focus_templates table if it doesn't exist
-- This handles the case where the table exists but is missing the is_active column

-- Check if column exists and add it if missing
-- SQLite doesn't support IF NOT EXISTS for column addition, so we'll use a more robust approach

-- First, create a temporary table with the correct schema
CREATE TABLE IF NOT EXISTS focus_templates_temp (
  id TEXT PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','break','meditation','exercise')) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  break_duration_minutes INTEGER DEFAULT 5,
  is_default BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  language TEXT DEFAULT 'en',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Copy existing data to the temp table, setting is_active to 1 for all existing records
INSERT INTO focus_templates_temp (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at)
SELECT
  id,
  template_key,
  name,
  description,
  session_type,
  duration_minutes,
  break_duration_minutes,
  COALESCE(is_default, 0) as is_default,
  1 as is_active,  -- Set all existing templates as active
  COALESCE(language, 'en') as language,
  created_at,
  updated_at
FROM focus_templates;

-- Drop the old table
DROP TABLE focus_templates;

-- Rename the temp table to the original name
ALTER TABLE focus_templates_temp RENAME TO focus_templates;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_focus_templates_key ON focus_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_focus_templates_type ON focus_templates(session_type);
CREATE INDEX IF NOT EXISTS idx_focus_templates_active ON focus_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_focus_templates_default ON focus_templates(is_default);

-- Insert default templates if they don't exist (in case table was empty)
INSERT OR IGNORE INTO focus_templates (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at) VALUES
('template_1', 'pomodoro_25', 'Pomodoro 25min', 'Classic Pomodoro technique with 25-minute focus sessions', 'pomodoro', 25, 5, 1, 1, 'en', 1640995200000, 1640995200000),
('template_2', 'deep_work_90', 'Deep Work 90min', 'Extended deep work session for complex tasks', 'deep_work', 90, 15, 0, 1, 'en', 1640995200000, 1640995200000),
('template_3', 'meditation_10', 'Meditation 10min', 'Short meditation session for mindfulness', 'meditation', 10, 0, 0, 1, 'en', 1640995200000, 1640995200000),
('template_4', 'exercise_30', 'Exercise 30min', 'Physical exercise session', 'exercise', 30, 5, 0, 1, 'en', 1640995200000, 1640995200000);