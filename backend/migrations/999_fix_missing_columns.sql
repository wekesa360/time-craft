-- Fix missing columns that are causing API errors

-- Add badge_points column to users table if it doesn't exist
-- Note: This column is already added in migration 026_add_badge_columns_to_users.sql
-- ALTER TABLE users ADD COLUMN badge_points INTEGER DEFAULT 0;

-- Create task_matrix_view if it doesn't exist
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