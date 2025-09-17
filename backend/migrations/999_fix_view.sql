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