# Time & Wellness Backend Runbooks

**Last Updated:** January 15, 2025  
**Version:** 2.0

## Overview

This document contains operational runbooks for the Time & Wellness backend system. These procedures help with deployment, monitoring, troubleshooting, and maintenance tasks.

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Monitoring & Health Checks](#monitoring--health-checks)
3. [Database Operations](#database-operations)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Backup & Recovery](#backup--recovery)
6. [Performance Optimization](#performance-optimization)
7. [Security Procedures](#security-procedures)
8. [Emergency Response](#emergency-response)
9. [Feature Management](#feature-management)
10. [External Service Management](#external-service-management)

## Deployment Procedures

### Production Deployment

1. **Pre-deployment Checklist**
   - [ ] All tests passing (`npm test`)
   - [ ] Code reviewed and approved
   - [ ] Database migrations tested
   - [ ] Environment variables updated
   - [ ] Feature flags configured

2. **Deployment Steps**
   ```bash
   # 1. Build the application
   npm run build
   
   # 2. Run database migrations
   npm run migrate:prod
   
   # 3. Deploy to Cloudflare Workers
   npm run deploy:prod
   
   # 4. Verify deployment
   curl https://api.timeandwellness.com/health
   ```

3. **Post-deployment Verification**
   - [ ] Health check endpoint responding
   - [ ] Database connectivity confirmed
   - [ ] Key API endpoints functional
   - [ ] Monitoring alerts configured

### Staging Deployment

```bash
# Deploy to staging environment
npm run deploy:staging

# Run integration tests
npm run test:integration

# Verify staging environment
curl https://staging-api.timeandwellness.com/health
```

### Rollback Procedure

```bash
# 1. Identify previous working version
wrangler deployments list

# 2. Rollback to previous version
wrangler rollback [deployment-id]

# 3. Verify rollback
curl https://api.timeandwellness.com/health

# 4. Notify team of rollback
```

## Monitoring & Health Checks

### Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/health` | Basic health check | `{"status": "healthy"}` |
| `/health/db` | Database connectivity | `{"database": "connected"}` |
| `/health/detailed` | Comprehensive health | Full system status |

### Key Metrics to Monitor

1. **Response Times**
   - API endpoint latency (< 200ms target)
   - Database query times (< 50ms target)
   - Voice processing times (< 5s target)
   - AI response times (< 3s target)

2. **Error Rates**
   - 4xx errors (< 1% target)
   - 5xx errors (< 0.1% target)
   - Voice transcription failures (< 5% target)
   - AI service failures (< 2% target)

3. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Database connections
   - R2 storage usage
   - External API quotas

4. **Business Metrics**
   - User registrations
   - Task completions
   - Health log entries
   - Focus session completions
   - Voice note uploads
   - Badge unlocks
   - Social interactions
   - Student verifications

### Monitoring Tools

- **Cloudflare Analytics** - Request metrics and performance
- **Sentry** - Error tracking and performance monitoring
- **Custom Metrics** - Business and application metrics

### Alert Thresholds

```yaml
Critical Alerts:
  - API error rate > 5%
  - Response time > 1000ms
  - Database connection failures

Warning Alerts:
  - API error rate > 1%
  - Response time > 500ms
  - Memory usage > 80%
```

## Database Operations

### Database Migrations

```bash
# Create new migration
npm run migrate:create migration_name

# Run migrations (development)
npm run migrate:dev

# Run migrations (production)
npm run migrate:prod

# Rollback last migration
npm run migrate:rollback
```

### Database Backup

```bash
# Create database backup
wrangler d1 export time-wellness-db --output backup-$(date +%Y%m%d).sql

# Verify backup integrity
sqlite3 backup-$(date +%Y%m%d).sql ".schema"
```

### Common Database Queries

```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- Check recent registrations
SELECT COUNT(*) FROM users 
WHERE created_at > datetime('now', '-24 hours');

-- Check task completion rate
SELECT 
  COUNT(CASE WHEN status = 'done' THEN 1 END) * 100.0 / COUNT(*) as completion_rate
FROM tasks 
WHERE created_at > datetime('now', '-7 days');

-- Check health log activity
SELECT type, COUNT(*) 
FROM health_logs 
WHERE recorded_at > datetime('now', '-24 hours')
GROUP BY type;
```

### Database Maintenance

```sql
-- Analyze database statistics
ANALYZE;

-- Vacuum database (reclaim space)
VACUUM;

-- Check database integrity
PRAGMA integrity_check;
```

## Troubleshooting Guide

### Common Issues

#### 1. High API Latency

**Symptoms:** Response times > 500ms

**Investigation Steps:**
1. Check Cloudflare Analytics for request patterns
2. Review database query performance
3. Check for resource constraints
4. Analyze error logs

**Resolution:**
```bash
# Check slow queries
wrangler d1 execute time-wellness-db --command "EXPLAIN QUERY PLAN SELECT ..."

# Optimize database indexes
wrangler d1 execute time-wellness-db --file optimize-indexes.sql
```

#### 2. Database Connection Errors

**Symptoms:** "Database connection failed" errors

**Investigation Steps:**
1. Check D1 database status
2. Verify connection limits
3. Review connection pool settings

**Resolution:**
```bash
# Check database status
wrangler d1 info time-wellness-db

# Test database connectivity
wrangler d1 execute time-wellness-db --command "SELECT 1"
```

#### 3. Authentication Failures

**Symptoms:** 401 Unauthorized errors

**Investigation Steps:**
1. Verify JWT secret configuration
2. Check token expiration settings
3. Review authentication middleware logs

**Resolution:**
```bash
# Verify environment variables
wrangler secret list

# Update JWT secret if needed
wrangler secret put JWT_SECRET
```

#### 4. Rate Limiting Issues

**Symptoms:** 429 Too Many Requests errors

**Investigation Steps:**
1. Check rate limit configuration
2. Analyze request patterns
3. Review IP-based limits

**Resolution:**
```javascript
// Adjust rate limits in middleware
const rateLimits = {
  auth: { requests: 10, window: 900000 }, // Increase from 5 to 10
  api: { requests: 2000, window: 3600000 } // Increase from 1000 to 2000
};
```

#### 5. Voice Processing Failures

**Symptoms:** Voice upload or transcription errors

**Investigation Steps:**
1. Check R2 storage connectivity
2. Verify Deepgram API status
3. Review audio file format and size

**Resolution:**
```bash
# Check R2 bucket status
wrangler r2 bucket info time-wellness-voice

# Test Deepgram API
curl -X GET "https://api.deepgram.com/v1/projects/YOUR_PROJECT_ID" \
  -H "Authorization: Token YOUR_API_KEY"

# Check audio file constraints
# Max size: 25MB, Supported formats: mp3, wav, m4a, webm
```

#### 6. AI Service Timeouts

**Symptoms:** OpenAI API timeout errors

**Investigation Steps:**
1. Check OpenAI API status
2. Review request complexity and token usage
3. Verify API key and quotas

**Resolution:**
```bash
# Check API status
curl -X GET "https://status.openai.com/api/v2/status.json"

# Reduce request complexity
# Use gpt-3.5-turbo for simple tasks
# Implement request queuing for high load
```

#### 7. Badge System Issues

**Symptoms:** Badges not unlocking or incorrect progress

**Investigation Steps:**
1. Check badge definitions and criteria
2. Verify trigger logic execution
3. Review user activity data

**Resolution:**
```sql
-- Manually trigger badge check
SELECT check_user_badges('user_123');

-- Reset badge progress
DELETE FROM badge_progress WHERE user_id = 'user_123';

-- Verify badge definitions
SELECT * FROM achievement_definitions WHERE is_active = 1;
```

#### 8. Push Notification Failures

**Symptoms:** Notifications not delivered

**Investigation Steps:**
1. Check OneSignal service status
2. Verify device registration
3. Review notification preferences

**Resolution:**
```bash
# Check device registration
wrangler d1 execute time-wellness-db --command "
  SELECT * FROM notification_devices WHERE user_id = 'user_123'
"

# Test notification delivery
curl -X POST "https://onesignal.com/api/v1/notifications" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -d '{"app_id": "YOUR_APP_ID", "include_external_user_ids": ["user_123"]}'
```

### Error Code Reference

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `AUTH_001` | Invalid JWT token | Check token format and expiration |
| `DB_001` | Database connection failed | Verify D1 database status |
| `RATE_001` | Rate limit exceeded | Check rate limit configuration |
| `VAL_001` | Validation error | Review request payload format |

## Backup & Recovery

### Automated Backups

```bash
# Daily backup script (run via cron)
#!/bin/bash
DATE=$(date +%Y%m%d)
wrangler d1 export time-wellness-db --output "backups/backup-$DATE.sql"

# Compress backup
gzip "backups/backup-$DATE.sql"

# Upload to cloud storage
aws s3 cp "backups/backup-$DATE.sql.gz" s3://tw-backups/
```

### Recovery Procedures

```bash
# 1. Download backup
aws s3 cp s3://tw-backups/backup-20250115.sql.gz ./

# 2. Decompress
gunzip backup-20250115.sql.gz

# 3. Create new database instance
wrangler d1 create time-wellness-db-recovery

# 4. Import backup
wrangler d1 execute time-wellness-db-recovery --file backup-20250115.sql

# 5. Update environment to use recovery database
wrangler secret put DATABASE_ID
```

### Data Recovery Scenarios

1. **Accidental Data Deletion**
   - Restore from latest backup
   - Apply incremental changes if available

2. **Database Corruption**
   - Create new database instance
   - Restore from backup
   - Verify data integrity

3. **Complete System Failure**
   - Deploy to new Cloudflare account
   - Restore database from backup
   - Update DNS records

## Performance Optimization

### Database Optimization

```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_health_logs_user_type ON health_logs(user_id, type);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions(user_id, start_time);

-- Optimize queries
-- Use LIMIT for pagination
SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT 50;

-- Use proper WHERE clauses
SELECT * FROM health_logs 
WHERE user_id = ? AND recorded_at > datetime('now', '-30 days');
```

### API Optimization

```javascript
// Enable response caching
app.get('/api/localization/:language', cache('1h'), async (c) => {
  // Cached response
});

// Use connection pooling
const db = new DatabaseService(env.DB, {
  maxConnections: 10,
  connectionTimeout: 5000
});

// Implement request batching
app.post('/api/health/batch', async (c) => {
  const logs = await c.req.json();
  await db.batchInsert('health_logs', logs);
});
```

### Monitoring Performance

```bash
# Check response times
curl -w "@curl-format.txt" -s -o /dev/null https://api.timeandwellness.com/api/tasks

# Monitor database performance
wrangler d1 execute time-wellness-db --command "PRAGMA compile_options;"
```

## Security Procedures

### Security Checklist

- [ ] JWT secrets rotated regularly (monthly)
- [ ] API rate limits configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection headers
- [ ] HTTPS enforced
- [ ] Sensitive data encrypted

### Security Incident Response

1. **Identify the Incident**
   - Monitor security alerts
   - Review access logs
   - Check for unusual patterns

2. **Contain the Incident**
   ```bash
   # Rotate JWT secret immediately
   wrangler secret put JWT_SECRET
   
   # Block suspicious IPs
   # (Configure in Cloudflare dashboard)
   
   # Disable compromised user accounts
   wrangler d1 execute time-wellness-db --command "UPDATE users SET is_active = false WHERE id = ?"
   ```

3. **Investigate and Recover**
   - Analyze logs for breach scope
   - Restore from clean backup if needed
   - Patch security vulnerabilities

4. **Post-Incident Actions**
   - Update security procedures
   - Notify affected users
   - Document lessons learned

### Regular Security Tasks

```bash
# Weekly security scan
npm audit

# Update dependencies
npm update

# Review access logs
wrangler tail --format pretty

# Check for exposed secrets
git secrets --scan
```

## Emergency Response

### Incident Severity Levels

**Critical (P0)**
- Complete service outage
- Data breach or security incident
- Data loss or corruption

**High (P1)**
- Partial service outage
- Performance degradation > 50%
- Authentication failures

**Medium (P2)**
- Minor feature issues
- Performance degradation < 50%
- Non-critical bugs

**Low (P3)**
- Cosmetic issues
- Documentation updates
- Enhancement requests

### Emergency Contacts

```yaml
On-Call Engineer: [phone/email]
DevOps Lead: [phone/email]
Security Team: [phone/email]
Product Manager: [phone/email]
```

### Emergency Procedures

1. **Immediate Response (0-15 minutes)**
   - Assess incident severity
   - Notify on-call engineer
   - Begin initial investigation

2. **Short-term Response (15-60 minutes)**
   - Implement temporary fixes
   - Communicate with stakeholders
   - Document incident timeline

3. **Long-term Response (1+ hours)**
   - Implement permanent fix
   - Conduct post-mortem
   - Update procedures

### Communication Templates

**Incident Notification:**
```
INCIDENT: [Title]
Severity: [P0/P1/P2/P3]
Status: [Investigating/Identified/Monitoring/Resolved]
Impact: [Description]
ETA: [Estimated resolution time]
Updates: [Communication channel]
```

**Resolution Notification:**
```
RESOLVED: [Title]
Duration: [Total incident time]
Root Cause: [Brief description]
Resolution: [What was done]
Prevention: [Steps to prevent recurrence]
```

## Maintenance Windows

### Scheduled Maintenance

- **Weekly:** Database optimization (Sundays 2-4 AM UTC)
- **Monthly:** Security updates (First Sunday 1-3 AM UTC)
- **Quarterly:** Major version updates (Planned 2 weeks in advance)

### Maintenance Procedures

```bash
# 1. Notify users of maintenance window
# 2. Enable maintenance mode
wrangler secret put MAINTENANCE_MODE true

# 3. Perform maintenance tasks
npm run migrate:prod
npm run optimize:db

# 4. Disable maintenance mode
wrangler secret put MAINTENANCE_MODE false

# 5. Verify system functionality
npm run test:smoke
```

## Feature Management

### Feature Flags

The system uses feature flags for gradual rollouts and A/B testing:

```bash
# List all feature flags
wrangler d1 execute time-wellness-db --command "SELECT * FROM feature_flags WHERE is_active = 1"

# Enable feature for specific users
wrangler d1 execute time-wellness-db --command "
  INSERT INTO feature_flag_users (flag_key, user_id, enabled) 
  VALUES ('voice_commands', 'user_123', 1)
"

# Enable feature globally
wrangler d1 execute time-wellness-db --command "
  UPDATE feature_flags 
  SET is_enabled = 1, rollout_percentage = 100 
  WHERE flag_key = 'voice_commands'
"
```

### Badge System Management

```bash
# Check badge unlock rates
wrangler d1 execute time-wellness-db --command "
  SELECT badge_key, COUNT(*) as unlocks 
  FROM user_badges 
  WHERE unlocked_at > datetime('now', '-7 days')
  GROUP BY badge_key
  ORDER BY unlocks DESC
"

# Reset user badges (for testing)
wrangler d1 execute time-wellness-db --command "
  DELETE FROM user_badges WHERE user_id = 'user_123'
"

# Add new badge definition
wrangler d1 execute time-wellness-db --command "
  INSERT INTO achievement_definitions (
    badge_key, name, description, category, target_value, is_active
  ) VALUES (
    'new_badge', 'New Achievement', 'Description here', 'productivity', 10, 1
  )
"
```

### Focus Session Analytics

```bash
# Check focus session completion rates
wrangler d1 execute time-wellness-db --command "
  SELECT 
    template_key,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    AVG(actual_duration) as avg_duration
  FROM focus_sessions 
  WHERE start_time > datetime('now', '-30 days')
  GROUP BY template_key
"

# Monitor distraction patterns
wrangler d1 execute time-wellness-db --command "
  SELECT distraction_type, COUNT(*) as count
  FROM focus_session_distractions 
  WHERE created_at > datetime('now', '-7 days')
  GROUP BY distraction_type
  ORDER BY count DESC
"
```

## External Service Management

### OneSignal (Push Notifications)

```bash
# Check notification delivery rates
curl -X GET "https://onesignal.com/api/v1/notifications" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -H "Content-Type: application/json"

# Send test notification
curl -X POST "https://onesignal.com/api/v1/notifications" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "YOUR_APP_ID",
    "include_external_user_ids": ["user_123"],
    "contents": {"en": "Test notification"}
  }'
```

### OpenAI API Management

```bash
# Check API usage
curl -X GET "https://api.openai.com/v1/usage" \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test AI endpoints
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test message"}],
    "max_tokens": 50
  }'
```

### Deepgram (Voice Transcription)

```bash
# Check transcription accuracy
curl -X GET "https://api.deepgram.com/v1/projects/YOUR_PROJECT_ID/usage" \
  -H "Authorization: Token YOUR_API_KEY"

# Test transcription
curl -X POST "https://api.deepgram.com/v1/listen" \
  -H "Authorization: Token YOUR_API_KEY" \
  -H "Content-Type: audio/wav" \
  --data-binary @test-audio.wav
```

### R2 Storage Management

```bash
# Check storage usage
wrangler r2 object list time-wellness-voice --limit 10

# Clean up old voice files (older than 90 days)
wrangler r2 object list time-wellness-voice | \
  grep "$(date -d '90 days ago' '+%Y-%m-%d')" | \
  xargs -I {} wrangler r2 object delete time-wellness-voice {}

# Monitor storage costs
wrangler r2 bucket info time-wellness-voice
```

### Database Maintenance for New Features

```sql
-- Clean up old focus sessions (older than 1 year)
DELETE FROM focus_sessions 
WHERE start_time < datetime('now', '-1 year');

-- Clean up old voice notes (older than 6 months)
DELETE FROM voice_notes 
WHERE created_at < datetime('now', '-6 months');

-- Optimize badge checking performance
ANALYZE user_badges;
ANALYZE achievement_definitions;

-- Check social feature usage
SELECT 
  'connections' as feature, COUNT(*) as count 
FROM user_connections 
WHERE status = 'accepted'
UNION ALL
SELECT 
  'challenges' as feature, COUNT(*) as count 
FROM social_challenges 
WHERE is_active = 1;
```

### Localization Management

```bash
# Update German translations
wrangler d1 execute time-wellness-db --command "
  UPDATE localization_content 
  SET content = 'Neue deutsche Übersetzung'
  WHERE language = 'de' AND content_key = 'app.welcome'
"

# Check localization coverage
wrangler d1 execute time-wellness-db --command "
  SELECT 
    language,
    COUNT(*) as translated_keys,
    (SELECT COUNT(*) FROM localization_content WHERE language = 'en') as total_keys
  FROM localization_content 
  GROUP BY language
"
```

### Student Verification Management

```bash
# Check verification rates
wrangler d1 execute time-wellness-db --command "
  SELECT 
    verification_status,
    COUNT(*) as count
  FROM student_verifications 
  WHERE created_at > datetime('now', '-30 days')
  GROUP BY verification_status
"

# Approve pending verifications
wrangler d1 execute time-wellness-db --command "
  UPDATE student_verifications 
  SET verification_status = 'approved', approved_at = datetime('now')
  WHERE id = 'verification_id'
"
```

---

**Note:** This runbook should be reviewed and updated regularly. All team members should be familiar with these procedures.