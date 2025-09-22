-- Migration 016: Performance Metrics Table
-- Adds the missing performance_metrics table for system monitoring

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT,
    created_at INTEGER NOT NULL DEFAULT 0
);

-- Index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(category);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);