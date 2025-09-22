// Database migration system for Cloudflare D1
import type { Env } from './env';
import { select, first, insert } from './db';

export interface Migration {
  id: string;
  name: string;
  sql: string;
  applied_at?: number;
}

export class MigrationRunner {
  constructor(private env: Env) {}

  // Initialize the migrations table if it doesn't exist
  async initMigrationsTable(): Promise<void> {
    const createMigrationsTableSql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
    `;
    
    await this.env.DB.prepare(createMigrationsTableSql).run();
  }

  // Get all applied migrations
  async getAppliedMigrations(): Promise<string[]> {
    await this.initMigrationsTable();
    
    const migrations = await select<{ id: string }>(
      this.env,
      'SELECT id FROM migrations ORDER BY applied_at ASC',
      []
    );
    
    return migrations.map(m => m.id);
  }

  // Check if a migration has been applied
  async isMigrationApplied(migrationId: string): Promise<boolean> {
    const applied = await this.getAppliedMigrations();
    return applied.includes(migrationId);
  }

  // Apply a single migration
  async applyMigration(migration: Migration): Promise<void> {
    if (await this.isMigrationApplied(migration.id)) {
      console.log(`Migration ${migration.id} already applied, skipping`);
      return;
    }

    console.log(`Applying migration: ${migration.name}`);

    try {
      // Execute the migration SQL
      // D1 doesn't support multi-statement queries, so we need to split and execute individually
      const statements = this.splitSqlStatements(migration.sql);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.env.DB.prepare(statement).run();
        }
      }

      // Record the migration as applied
      await insert(this.env, 'migrations', {
        id: migration.id,
        name: migration.name,
        applied_at: Date.now()
      });

      console.log(`Migration ${migration.id} applied successfully`);
    } catch (error) {
      console.error(`Failed to apply migration ${migration.id}:`, error);
      throw error;
    }
  }

  // Apply all pending migrations
  async applyMigrations(migrations: Migration[]): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const pending = migrations.filter(m => !applied.includes(m.id));

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Applying ${pending.length} pending migrations`);

    for (const migration of pending) {
      await this.applyMigration(migration);
    }

    console.log('All migrations applied successfully');
  }

  // Split SQL into individual statements (basic implementation)
  private splitSqlStatements(sql: string): string[] {
    // Remove comments and split by semicolons
    const cleanSql = sql
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments

    return cleanSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
  }

  // Rollback last migration (basic implementation)
  async rollbackLastMigration(): Promise<void> {
    const appliedMigrations = await select<Migration>(
      this.env,
      'SELECT * FROM migrations ORDER BY applied_at DESC LIMIT 1',
      []
    );

    if (appliedMigrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = appliedMigrations[0];
    
    // Note: This is a basic implementation. In production, you'd want proper rollback scripts
    console.warn(`WARNING: Rollback not implemented for migration ${lastMigration.id}`);
    console.log('Consider manually reverting the changes or creating a new migration');
  }
}

// Predefined migrations
export const MIGRATIONS: Migration[] = [
  {
    id: '001_init',
    name: 'Initial schema setup',
    sql: `
      -- Users
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        tz TEXT DEFAULT 'UTC',
        plan TEXT CHECK(plan IN ('free','premium')) DEFAULT 'free',
        stripe_customer_id TEXT,
        subscription_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Tasks
      CREATE TABLE tasks (
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
      );

      -- Calendar events
      CREATE TABLE calendar_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        start INTEGER NOT NULL,
        "end" INTEGER NOT NULL,
        source TEXT CHECK(source IN ('manual','auto','google','outlook','icloud')) DEFAULT 'manual',
        ai_generated BOOLEAN DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      -- Health logs
      CREATE TABLE health_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT CHECK(type IN ('exercise','nutrition','mood','hydration')) NOT NULL,
        payload JSON NOT NULL,
        recorded_at INTEGER NOT NULL
      );

      -- Habits
      CREATE TABLE habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        frequency TEXT NOT NULL,
        target_duration INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL
      );

      -- Gratitude entries
      CREATE TABLE gratitude_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        entry_text TEXT NOT NULL,
        category TEXT,
        logged_at INTEGER NOT NULL
      );

      -- Reflection entries
      CREATE TABLE reflection_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        voice_file_key TEXT,
        transcription TEXT,
        ai_analysis JSON,
        logged_at INTEGER NOT NULL
      );

      -- Goals
      CREATE TABLE goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        target_date INTEGER,
        milestones JSON,
        progress_percent REAL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      -- External OAuth tokens
      CREATE TABLE external_tokens (
        user_id TEXT NOT NULL REFERENCES users(id),
        provider TEXT CHECK(provider IN ('google','outlook','apple','fitbit')) NOT NULL,
        access_token_enc TEXT NOT NULL,
        refresh_token_enc TEXT,
        expires_at INTEGER,
        PRIMARY KEY (user_id, provider)
      );

      -- Achievement definitions
      CREATE TABLE achievement_definitions (
        achievement_key TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title_en TEXT NOT NULL,
        title_de TEXT NOT NULL,
        description_en TEXT,
        description_de TEXT,
        criteria JSON NOT NULL,
        points_awarded INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1
      );

      -- User achievements
      CREATE TABLE user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        achievement_key TEXT NOT NULL,
        unlocked_at INTEGER,
        created_at INTEGER NOT NULL
      );

      -- File assets
      CREATE TABLE file_assets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        file_type TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        r2_url TEXT,
        related_entity_id TEXT,
        created_at INTEGER NOT NULL
      );
    `
  },
  {
    id: '002_metrics_tables',
    name: 'Add metrics and performance tracking tables',
    sql: `
      -- API usage statistics
      CREATE TABLE IF NOT EXISTS api_usage_stats (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        user_id TEXT,
        response_time INTEGER,
        status_code INTEGER,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- Performance metrics
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metric_type TEXT CHECK(metric_type IN ('counter','gauge','histogram','summary')) NOT NULL,
        labels TEXT, -- JSON stored as TEXT
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- System metrics
      CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        unit TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- Audit logs
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT,
        details TEXT, -- JSON stored as TEXT
        ip_address TEXT,
        user_agent TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- Security incidents
      CREATE TABLE IF NOT EXISTS security_incidents (
        id TEXT PRIMARY KEY,
        incident_type TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('low','medium','high','critical')) NOT NULL,
        description TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        details TEXT, -- JSON stored as TEXT
        resolved BOOLEAN DEFAULT 0,
        resolved_at INTEGER,
        created_at INTEGER NOT NULL
      );

      -- Focus sessions
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        duration INTEGER NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT CHECK(status IN ('active','completed','cancelled')) DEFAULT 'active',
        template_id TEXT,
        environment TEXT, -- JSON stored as TEXT
        distractions TEXT, -- JSON stored as TEXT
        created_at INTEGER NOT NULL
      );

      -- Focus session templates
      CREATE TABLE IF NOT EXISTS focus_templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        environment TEXT, -- JSON stored as TEXT
        is_public BOOLEAN DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      -- Distractions
      CREATE TABLE IF NOT EXISTS distractions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        session_id TEXT REFERENCES focus_sessions(id),
        type TEXT NOT NULL,
        description TEXT,
        timestamp INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      -- Voice notes
      CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT,
        transcription TEXT,
        audio_file_key TEXT,
        duration INTEGER,
        language TEXT DEFAULT 'en',
        ai_analysis TEXT, -- JSON stored as TEXT
        created_at INTEGER NOT NULL
      );

      -- Voice commands
      CREATE TABLE IF NOT EXISTS voice_commands (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        command TEXT NOT NULL,
        action TEXT NOT NULL,
        parameters TEXT, -- JSON stored as TEXT
        success BOOLEAN NOT NULL,
        response TEXT,
        created_at INTEGER NOT NULL
      );

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT, -- JSON stored as TEXT
        read BOOLEAN DEFAULT 0,
        sent_at INTEGER,
        created_at INTEGER NOT NULL
      );

      -- Notification preferences
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        channels TEXT, -- JSON stored as TEXT
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Social connections
      CREATE TABLE IF NOT EXISTS social_connections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        connected_user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT CHECK(status IN ('pending','accepted','blocked')) DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Challenges
      CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        criteria TEXT NOT NULL, -- JSON stored as TEXT
        reward_points INTEGER DEFAULT 0,
        start_date INTEGER,
        end_date INTEGER,
        is_active BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL
      );

      -- User challenge participation
      CREATE TABLE IF NOT EXISTS user_challenges (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        challenge_id TEXT NOT NULL REFERENCES challenges(id),
        status TEXT CHECK(status IN ('active','completed','dropped')) DEFAULT 'active',
        progress REAL DEFAULT 0,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        created_at INTEGER NOT NULL
      );

      -- Student verification
      CREATE TABLE IF NOT EXISTS student_verifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        email TEXT NOT NULL,
        institution TEXT NOT NULL,
        document_url TEXT,
        status TEXT CHECK(status IN ('pending','verified','rejected')) DEFAULT 'pending',
        verification_code TEXT,
        verified_at INTEGER,
        created_at INTEGER NOT NULL
      );

      -- Localization content
      CREATE TABLE IF NOT EXISTS localization_content (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        context TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Admin users
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        role TEXT CHECK(role IN ('super_admin','admin','moderator')) NOT NULL,
        permissions TEXT, -- JSON stored as TEXT
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Feature flags
      CREATE TABLE IF NOT EXISTS feature_flags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        enabled BOOLEAN DEFAULT 0,
        rollout_percentage INTEGER DEFAULT 0,
        target_users TEXT, -- JSON stored as TEXT
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Support tickets
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT CHECK(status IN ('open','in_progress','resolved','closed')) DEFAULT 'open',
        priority TEXT CHECK(priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
        assigned_to TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Offline queue
      CREATE TABLE IF NOT EXISTS offline_queue (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        data TEXT NOT NULL, -- JSON stored as TEXT
        status TEXT CHECK(status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        processed_at INTEGER
      );
    `
  }
];

// Migration utility functions
export async function runMigrations(env: Env): Promise<void> {
  const runner = new MigrationRunner(env);
  await runner.applyMigrations(MIGRATIONS);
}

export async function getMigrationStatus(env: Env): Promise<{
  applied: string[];
  pending: string[];
}> {
  const runner = new MigrationRunner(env);
  const applied = await runner.getAppliedMigrations();
  const pending = MIGRATIONS
    .filter(m => !applied.includes(m.id))
    .map(m => m.id);
  
  return { applied, pending };
}