-- System Metrics and Health Monitoring Tables
-- Migration: 014_system_metrics.sql
-- Description: Add system metrics collection and health monitoring tables

-- System metrics table for collecting application metrics
CREATE TABLE IF NOT EXISTS system_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    value REAL NOT NULL,
    tags TEXT, -- JSON string of tags
    timestamp INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for efficient metric queries
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_timestamp ON system_metrics(name, timestamp);

-- Health check logs table
CREATE TABLE IF NOT EXISTS health_check_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time INTEGER, -- in milliseconds
    error_message TEXT,
    metadata TEXT, -- JSON string of additional data
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for health check queries
CREATE INDEX IF NOT EXISTS idx_health_check_logs_service ON health_check_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_health_check_logs_status ON health_check_logs(status);
CREATE INDEX IF NOT EXISTS idx_health_check_logs_created_at ON health_check_logs(created_at);

-- API usage statistics table
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER NOT NULL, -- in milliseconds
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for API usage analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_stats(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_method ON api_usage_stats(method);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON api_usage_stats(status_code);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage_stats(user_id);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'ms', 'bytes', 'count'
    category TEXT NOT NULL, -- e.g., 'database', 'api', 'memory', 'cpu'
    tags TEXT, -- JSON string of additional tags
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(category);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);

-- Error logs table for tracking application errors
CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    user_id TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    request_id TEXT,
    metadata TEXT, -- JSON string of additional context
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for error logs
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON error_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- System alerts table for monitoring alerts
CREATE TABLE IF NOT EXISTS system_alerts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    metadata TEXT, -- JSON string of alert data
    resolved_at INTEGER,
    resolved_by TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for system alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);

-- Insert some initial system metrics
INSERT INTO system_metrics (name, value, tags, timestamp) VALUES
('app_startup_time', 150.5, '{"environment": "production"}', strftime('%s', 'now') * 1000),
('database_connection_pool_size', 10, '{"service": "database"}', strftime('%s', 'now') * 1000),
('memory_usage_mb', 128.5, '{"service": "runtime"}', strftime('%s', 'now') * 1000),
('api_request_count', 0, '{"endpoint": "all"}', strftime('%s', 'now') * 1000);

-- Insert initial health check
INSERT INTO health_check_logs (service_name, status, response_time, created_at) VALUES
('database', 'healthy', 5, strftime('%s', 'now') * 1000),
('api_gateway', 'healthy', 12, strftime('%s', 'now') * 1000),
('external_apis', 'healthy', 45, strftime('%s', 'now') * 1000);
