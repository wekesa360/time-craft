-- Eisenhower Matrix Implementation for Task Management
-- Adds urgency and importance fields to enable the 4-quadrant system

-- Add Eisenhower Matrix fields to tasks table
ALTER TABLE tasks ADD COLUMN urgency INTEGER CHECK(urgency BETWEEN 1 AND 4) DEFAULT 2;
ALTER TABLE tasks ADD COLUMN importance INTEGER CHECK(importance BETWEEN 1 AND 4) DEFAULT 2;
ALTER TABLE tasks ADD COLUMN eisenhower_quadrant TEXT CHECK(eisenhower_quadrant IN ('do','decide','delegate','delete')) DEFAULT 'decide';

-- Add matrix-related metadata
ALTER TABLE tasks ADD COLUMN matrix_notes TEXT; -- Notes specific to matrix categorization
ALTER TABLE tasks ADD COLUMN ai_matrix_confidence REAL; -- AI confidence in categorization (0-1)
ALTER TABLE tasks ADD COLUMN matrix_last_reviewed INTEGER; -- When matrix position was last reviewed
ALTER TABLE tasks ADD COLUMN is_delegated BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN delegated_to TEXT; -- Who the task is delegated to
ALTER TABLE tasks ADD COLUMN delegation_notes TEXT;

-- Create Eisenhower Matrix statistics table
CREATE TABLE matrix_stats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  date_recorded INTEGER NOT NULL, -- Daily stats
  quadrant_do_count INTEGER DEFAULT 0,
  quadrant_decide_count INTEGER DEFAULT 0,
  quadrant_delegate_count INTEGER DEFAULT 0,
  quadrant_delete_count INTEGER DEFAULT 0,
  quadrant_do_completed INTEGER DEFAULT 0,
  quadrant_decide_completed INTEGER DEFAULT 0,
  quadrant_delegate_completed INTEGER DEFAULT 0,
  quadrant_delete_completed INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  productivity_score REAL DEFAULT 0, -- Based on Q1 and Q2 completion
  created_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date_recorded)
);

-- Create matrix insights table for AI recommendations
CREATE TABLE matrix_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  insight_type TEXT CHECK(insight_type IN ('overload','balance','focus','delegation')) NOT NULL,
  insight_text_en TEXT NOT NULL,
  insight_text_de TEXT NOT NULL,
  recommendation_en TEXT NOT NULL,
  recommendation_de TEXT NOT NULL,
  confidence_score REAL DEFAULT 0.8,
  is_active BOOLEAN DEFAULT true,
  created_at INTEGER NOT NULL,
  expires_at INTEGER, -- When this insight becomes stale
  UNIQUE(user_id, insight_type, created_at)
);

-- Create indexes for matrix queries
CREATE INDEX idx_tasks_eisenhower_quadrant ON tasks(eisenhower_quadrant);
CREATE INDEX idx_tasks_urgency_importance ON tasks(urgency, importance);
CREATE INDEX idx_tasks_user_quadrant ON tasks(user_id, eisenhower_quadrant);
CREATE INDEX idx_tasks_matrix_reviewed ON tasks(matrix_last_reviewed);
CREATE INDEX idx_tasks_delegated ON tasks(is_delegated, delegated_to);

CREATE INDEX idx_matrix_stats_user_date ON matrix_stats(user_id, date_recorded DESC);
CREATE INDEX idx_matrix_insights_user_active ON matrix_insights(user_id, is_active);
CREATE INDEX idx_matrix_insights_type ON matrix_insights(insight_type);

-- Create trigger to update matrix stats when tasks are completed
CREATE TRIGGER update_matrix_stats_on_completion
AFTER UPDATE OF status ON tasks
WHEN NEW.status = 'done' AND OLD.status != 'done'
BEGIN
  INSERT OR REPLACE INTO matrix_stats (
    id, user_id, date_recorded,
    quadrant_do_count, quadrant_decide_count, quadrant_delegate_count, quadrant_delete_count,
    quadrant_do_completed, quadrant_decide_completed, quadrant_delegate_completed, quadrant_delete_completed,
    total_tasks, productivity_score, created_at
  )
  SELECT 
    'stats_' || NEW.user_id || '_' || date('now'),
    NEW.user_id,
    strftime('%s', date('now')) * 1000,
    COUNT(CASE WHEN eisenhower_quadrant = 'do' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'decide' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'delegate' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'delete' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'do' AND status = 'done' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'decide' AND status = 'done' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'delegate' AND status = 'done' THEN 1 END),
    COUNT(CASE WHEN eisenhower_quadrant = 'delete' AND status = 'done' THEN 1 END),
    COUNT(*),
    -- Productivity score: weighted completion rate favoring Q1 and Q2
    (
      COUNT(CASE WHEN eisenhower_quadrant = 'do' AND status = 'done' THEN 1 END) * 1.0 +
      COUNT(CASE WHEN eisenhower_quadrant = 'decide' AND status = 'done' THEN 1 END) * 0.9 +
      COUNT(CASE WHEN eisenhower_quadrant = 'delegate' AND status = 'done' THEN 1 END) * 0.7 +
      COUNT(CASE WHEN eisenhower_quadrant = 'delete' AND status = 'done' THEN 1 END) * 0.3
    ) / NULLIF(COUNT(*), 0) * 100,
    strftime('%s', 'now') * 1000
  FROM tasks 
  WHERE user_id = NEW.user_id 
    AND date(datetime(created_at/1000, 'unixepoch')) = date('now');
END;

-- Create view for easy matrix querying
CREATE VIEW task_matrix_view AS
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

-- Update existing tasks with default matrix values based on priority
-- Note: Using simplified logic without strftime for compatibility
UPDATE tasks 
SET 
  urgency = CASE 
    WHEN due_date IS NOT NULL AND due_date < 0 THEN 4 -- Overdue = Very Urgent (simplified)
    WHEN due_date IS NOT NULL AND due_date < 86400000 THEN 3 -- Due today = Urgent (simplified)
    WHEN due_date IS NOT NULL AND due_date < 259200000 THEN 2 -- Due soon = Moderate (simplified)
    ELSE 1 -- No due date or far future = Low urgency
  END,
  importance = CASE
    WHEN priority = 4 THEN 4 -- High priority = Very Important
    WHEN priority = 3 THEN 3 -- Medium-high priority = Important
    WHEN priority = 2 THEN 2 -- Medium priority = Moderate importance
    ELSE 1 -- Low priority = Low importance
  END,
  matrix_last_reviewed = 0
WHERE urgency IS NULL OR importance IS NULL;
