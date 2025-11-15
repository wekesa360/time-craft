-- Migration 029: API Usage Statistics Table
-- Adds the api_usage_stats table for tracking API endpoint usage and performance

-- API usage statistics table
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER, -- in milliseconds
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_endpoint ON api_usage_stats(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_method ON api_usage_stats(method);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_user_id ON api_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_created_at ON api_usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_status_code ON api_usage_stats(status_code);

