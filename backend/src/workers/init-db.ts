// Database initialization endpoint
import { Hono } from 'hono';
import type { Env } from '../lib/env';

const initDb = new Hono<{ Bindings: Env }>();

// POST /init-db - Initialize database schema
initDb.post('/', async (c) => {
  try {
    // Define the SQL statements inline
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        timezone TEXT DEFAULT 'UTC',
        preferred_language TEXT DEFAULT 'en',
        subscription_type TEXT CHECK(subscription_type IN ('free','premium')) DEFAULT 'free',
        subscription_expires_at INTEGER,
        stripe_customer_id TEXT,
        is_student BOOLEAN DEFAULT 0,
        student_verification_status TEXT CHECK(student_verification_status IN ('none','pending','verified','rejected')) DEFAULT 'none',
        preferences TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        priority INTEGER CHECK(priority BETWEEN 1 AND 4) DEFAULT 1,
        status TEXT CHECK(status IN ('pending','done','archived')) DEFAULT 'pending',
        due_date INTEGER,
        estimated_duration INTEGER,
        ai_priority_score REAL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS health_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT CHECK(type IN ('exercise','nutrition','mood','hydration')) NOT NULL,
        payload TEXT NOT NULL,
        recorded_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        start INTEGER NOT NULL,
        "end" INTEGER NOT NULL,
        source TEXT CHECK(source IN ('manual','auto','google','outlook','icloud')) DEFAULT 'manual',
        ai_generated BOOLEAN DEFAULT 0,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        frequency TEXT NOT NULL,
        target_duration INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS gratitude_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        entry_text TEXT NOT NULL,
        category TEXT,
        logged_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS reflection_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        voice_file_key TEXT,
        transcription TEXT,
        ai_analysis TEXT,
        logged_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        target_date INTEGER,
        milestones TEXT,
        progress_percent REAL DEFAULT 0,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS external_tokens (
        user_id TEXT NOT NULL REFERENCES users(id),
        provider TEXT CHECK(provider IN ('google','outlook','apple','fitbit')) NOT NULL,
        access_token_enc TEXT NOT NULL,
        refresh_token_enc TEXT,
        expires_at INTEGER,
        PRIMARY KEY (user_id, provider)
      )`,
      `CREATE TABLE IF NOT EXISTS achievement_definitions (
        achievement_key TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_de TEXT NOT NULL,
        description_en TEXT,
        description_de TEXT,
        criteria TEXT NOT NULL,
        points_awarded INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        achievement_key TEXT NOT NULL,
        unlocked_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS file_assets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        file_type TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        r2_url TEXT,
        related_entity_id TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS api_usage_stats (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        user_id TEXT,
        response_time INTEGER,
        status_code INTEGER,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metric_type TEXT CHECK(metric_type IN ('counter','gauge','histogram','summary')) NOT NULL,
        labels TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        unit TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS security_incidents (
        id TEXT PRIMARY KEY,
        incident_type TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('low','medium','high','critical')) NOT NULL,
        description TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        details TEXT,
        resolved BOOLEAN DEFAULT 0,
        resolved_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        session_type TEXT CHECK(session_type IN ('pomodoro','deep_work','custom','sprint','flow','meditation','exercise','break')) NOT NULL,
        session_name TEXT,
        planned_duration INTEGER NOT NULL,
        actual_duration INTEGER,
        task_id TEXT,
        planned_task_count INTEGER DEFAULT 1,
        completed_task_count INTEGER DEFAULT 0,
        break_duration INTEGER DEFAULT 0,
        interruptions INTEGER DEFAULT 0,
        distraction_count INTEGER DEFAULT 0,
        environment_data TEXT,
        mood_before INTEGER,
        energy_before INTEGER,
        mood_after INTEGER,
        energy_after INTEGER,
        focus_quality INTEGER,
        session_tags TEXT,
        is_successful BOOLEAN DEFAULT 1,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS focus_templates (
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
      )`,
      `CREATE TABLE IF NOT EXISTS distractions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        session_id TEXT REFERENCES focus_sessions(id),
        type TEXT NOT NULL,
        description TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT,
        transcription TEXT,
        audio_file_key TEXT,
        duration INTEGER,
        language TEXT DEFAULT 'en',
        ai_analysis TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS voice_commands (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        command TEXT NOT NULL,
        action TEXT NOT NULL,
        parameters TEXT,
        success BOOLEAN NOT NULL,
        response TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        read BOOLEAN DEFAULT 0,
        sent_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        channels TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS social_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        connected_user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT CHECK(status IN ('pending','accepted','blocked')) DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        criteria TEXT NOT NULL,
        reward_points INTEGER DEFAULT 0,
        start_date INTEGER,
        end_date INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS user_challenges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        challenge_id TEXT NOT NULL REFERENCES challenges(id),
        status TEXT CHECK(status IN ('active','completed','dropped')) DEFAULT 'active',
        progress REAL DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS student_verifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        email TEXT NOT NULL,
        institution TEXT NOT NULL,
        document_url TEXT,
        status TEXT CHECK(status IN ('pending','verified','rejected')) DEFAULT 'pending',
        verification_code TEXT,
        verified_at INTEGER,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS localization_content (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        context TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT CHECK(role IN ('super_admin','admin','moderator')) NOT NULL,
        permissions TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS feature_flags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT 0,
        rollout_percentage INTEGER DEFAULT 0,
        target_users TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT CHECK(status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
        priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
        assigned_to TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        processed_at INTEGER
      )`
    ];
    
    // Execute each statement
    for (const statement of statements) {
      await c.env.DB.prepare(statement).run();
    }

    // Insert default focus templates
    const defaultTemplates = [
      `INSERT OR IGNORE INTO focus_templates (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at) VALUES ('template_1', 'pomodoro_25', 'Pomodoro 25min', 'Classic Pomodoro technique with 25-minute focus sessions', 'pomodoro', 25, 5, 1, 1, 'en', 1640995200000, 1640995200000)`,
      `INSERT OR IGNORE INTO focus_templates (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at) VALUES ('template_2', 'deep_work_90', 'Deep Work 90min', 'Extended deep work session for complex tasks', 'deep_work', 90, 15, 0, 1, 'en', 1640995200000, 1640995200000)`,
      `INSERT OR IGNORE INTO focus_templates (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at) VALUES ('template_3', 'meditation_10', 'Meditation 10min', 'Short meditation session for mindfulness', 'meditation', 10, 0, 0, 1, 'en', 1640995200000, 1640995200000)`,
      `INSERT OR IGNORE INTO focus_templates (id, template_key, name, description, session_type, duration_minutes, break_duration_minutes, is_default, is_active, language, created_at, updated_at) VALUES ('template_4', 'exercise_30', 'Exercise 30min', 'Physical exercise session', 'exercise', 30, 5, 0, 1, 'en', 1640995200000, 1640995200000)`
    ];

    for (const template of defaultTemplates) {
      await c.env.DB.prepare(template).run();
    }
    
    return c.json({ 
      success: true, 
      message: 'Database initialized successfully',
      tables_created: statements.length
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// GET /init-db/status - Check database status
initDb.get('/status', async (c) => {
  try {
    // Check if users table exists and has the right structure
    const result = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).first();
    
    if (!result) {
      return c.json({ 
        initialized: false, 
        message: 'Database not initialized' 
      });
    }
    
    // Check table structure
    const columns = await c.env.DB.prepare(`
      PRAGMA table_info(users)
    `).all();
    
    return c.json({ 
      initialized: true, 
      message: 'Database is initialized',
      tables: ['users', 'tasks', 'health_logs', 'calendar_events', 'habits', 'gratitude_entries', 'reflection_entries', 'goals', 'external_tokens', 'achievement_definitions', 'user_achievements', 'file_assets'],
      users_table_columns: columns.results?.map((col: any) => col.name) || []
    });
  } catch (error) {
    console.error('Database status check error:', error);
    return c.json({ 
      initialized: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export default initDb;
