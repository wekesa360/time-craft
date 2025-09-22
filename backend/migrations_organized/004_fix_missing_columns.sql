-- Fix missing columns that are causing API errors

-- Add badge_points column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN badge_points INTEGER DEFAULT 0;

-- Add mobile settings to users table
ALTER TABLE users ADD COLUMN mobile_settings TEXT DEFAULT '{}';
ALTER TABLE users ADD COLUMN security_settings TEXT DEFAULT '{}';
ALTER TABLE users ADD COLUMN last_offline_sync INTEGER DEFAULT 0;

-- Ensure task_matrix_view exists
CREATE VIEW IF NOT EXISTS task_matrix_view AS
SELECT 
  t.*,
  CASE t.eisenhower_quadrant
    WHEN 'do' THEN 'Q1: Do First (Important & Urgent)'
    WHEN 'decide' THEN 'Q2: Schedule (Important & Not Urgent)'
    WHEN 'delegate' THEN 'Q3: Delegate (Not Important & Urgent)'
    WHEN 'delete' THEN 'Q4: Eliminate (Not Important & Not Urgent)'
  END as quadrant_description,
  CASE t.eisenhower_quadrant
    WHEN 'do' THEN 1
    WHEN 'decide' THEN 2
    WHEN 'delegate' THEN 3
    WHEN 'delete' THEN 4
  END as quadrant_priority
FROM tasks t
WHERE t.status != 'archived';
