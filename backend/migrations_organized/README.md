# Database Migrations - Organized

This directory contains the properly organized database migrations for the Time & Wellness Application. The migrations are numbered in the correct execution order to ensure proper schema evolution.

## Migration Order

### 001_init.sql
- **Purpose**: Creates the core database schema
- **Tables**: users, tasks, calendar_events, health_logs, habits, gratitude_entries, reflection_entries, goals, external_tokens, achievement_definitions, user_achievements, file_assets, focus_sessions, focus_templates, distractions, voice_notes, voice_commands, notifications, notification_preferences, social_connections, challenges, user_challenges, student_verifications, localization_content, admin_users, feature_flags, support_tickets, offline_queue
- **Dependencies**: None (base schema)

### 002_enhanced_schema.sql
- **Purpose**: Adds enhanced features and missing columns
- **Changes**: Adds internationalization, AI features, badges, student pricing, meeting requests, health goals, health insights, and various missing columns
- **Dependencies**: 001_init.sql

### 003_eisenhower_matrix.sql
- **Purpose**: Implements Eisenhower Matrix task prioritization
- **Tables**: matrix_stats, matrix_insights, task_matrix_view
- **Changes**: Adds urgency, importance, eisenhower_quadrant columns to tasks table
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql

### 004_fix_missing_columns.sql
- **Purpose**: Fixes missing columns that cause API errors
- **Changes**: Adds badge_points to users, mobile settings, ensures task_matrix_view exists
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql, 003_eisenhower_matrix.sql

### 005_high_priority_features.sql
- **Purpose**: Adds real-time features, mobile support, and security
- **Tables**: sse_connections, calendar_conflicts, calendar_event_instances, mobile_devices, push_notifications, audit_logs, security_events, compliance_reports, migration_backups
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql

### 006_voice_processing.sql
- **Purpose**: Enhanced voice processing and AI features
- **Tables**: voice_processing_queue, voice_ai_models, voice_command_templates, voice_analytics, voice_feedback
- **Changes**: Adds missing columns to voice_notes and voice_commands tables
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql

### 007_health_insights.sql
- **Purpose**: Comprehensive health tracking with AI insights
- **Tables**: health_data_aggregates, health_recommendations, health_milestones, health_data_quality, health_data_sources
- **Changes**: Adds missing columns to health_goals and health_insights tables
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql

### 008_social_features.sql
- **Purpose**: Community features and social wellness tracking
- **Tables**: social_posts, social_interactions, social_groups, group_memberships, social_wellness_metrics, social_competitions, competition_participants, social_notifications, social_feed_preferences
- **Changes**: Adds missing columns to social_connections, challenges, and user_challenges tables
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql

### 009_localization_admin.sql
- **Purpose**: Advanced localization and admin features
- **Tables**: system_config, admin_activity_logs, system_health_checks, user_activity_analytics, content_moderation, system_maintenance_logs, api_rate_limits, system_alerts
- **Changes**: Adds missing columns to localization_content, admin_users, and feature_flags tables
- **Dependencies**: 001_init.sql, 002_enhanced_schema.sql

### 010_seed_data.sql
- **Purpose**: Inserts initial data and configuration
- **Data**: Localized content (English/German), achievement definitions, focus templates, challenges, system configuration, feature flags
- **Dependencies**: All previous migrations

## How to Run Migrations

### Option 1: Run All Migrations
```bash
# Run all migrations in order
for file in *.sql; do
  echo "Running $file..."
  # Your database execution command here
  # Example: sqlite3 your_database.db < "$file"
done
```

### Option 2: Run Individual Migrations
```bash
# Run specific migration
sqlite3 your_database.db < 001_init.sql
sqlite3 your_database.db < 002_enhanced_schema.sql
# ... continue with other migrations
```

### Option 3: Using Migration System
If you have a migration runner system, you can execute them in the numbered order.

## Important Notes

1. **Order Matters**: Migrations must be run in numerical order (001, 002, 003, etc.)
2. **Dependencies**: Each migration builds upon the previous ones
3. **Rollback**: These migrations don't include rollback scripts - create backups before running
4. **Testing**: Test migrations on a copy of your database first
5. **Backup**: Always backup your database before running migrations

## Migration Status

- ✅ **001_init.sql**: Core schema - Ready to run
- ✅ **002_enhanced_schema.sql**: Enhanced features - Ready to run  
- ✅ **003_eisenhower_matrix.sql**: Task prioritization - Ready to run
- ✅ **004_fix_missing_columns.sql**: API fixes - Ready to run
- ✅ **005_high_priority_features.sql**: Real-time features - Ready to run
- ✅ **006_voice_processing.sql**: Voice features - Ready to run
- ✅ **007_health_insights.sql**: Health tracking - Ready to run
- ✅ **008_social_features.sql**: Social features - Ready to run
- ✅ **009_localization_admin.sql**: Admin features - Ready to run
- ✅ **010_seed_data.sql**: Initial data - Ready to run

## Troubleshooting

If you encounter errors:

1. **Check Dependencies**: Ensure previous migrations have been run
2. **Verify Tables**: Check if required tables exist before running a migration
3. **Check Constraints**: Some migrations add foreign key constraints that require existing data
4. **Review Logs**: Check database logs for specific error messages

## Backup Files

The original migration files with complex implementations are preserved in the `../migrations/` directory with `.bak` and `.bak2` extensions. These can be referenced if you need the more complex features later.
