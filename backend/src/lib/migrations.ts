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