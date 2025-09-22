// Database Migration System
// Handles safe database migrations with rollback capabilities

import { logger } from './logger';
import { DatabaseService } from './db';

export interface Migration {
  id: string;
  version: number;
  name: string;
  description: string;
  up: string;
  down: string;
  checksum: string;
  appliedAt?: number;
  rolledBackAt?: number;
  status: 'pending' | 'applied' | 'rolled_back' | 'failed';
}

export interface MigrationResult {
  success: boolean;
  appliedMigrations: string[];
  failedMigrations: string[];
  errors: string[];
  rollbackAvailable: boolean;
}

export class DatabaseMigrationService {
  private db: DatabaseService;
  private migrations: Map<string, Migration> = new Map();

  constructor(db: DatabaseService) {
    this.db = db;
    this.loadMigrations();
  }

  /**
   * Load all available migrations
   */
  private loadMigrations(): void {
    // This would load migrations from files or database
    // For now, we'll define them inline
    const migrationFiles = [
      {
        id: '001_create_migrations_table',
        version: 1,
        name: 'Create Migrations Table',
        description: 'Create the migrations tracking table',
        up: `
          CREATE TABLE IF NOT EXISTS migrations (
            id TEXT PRIMARY KEY,
            version INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            checksum TEXT NOT NULL,
            applied_at INTEGER,
            rolled_back_at INTEGER,
            status TEXT DEFAULT 'pending'
          );
        `,
        down: `
          DROP TABLE IF EXISTS migrations;
        `,
        checksum: 'abc123'
      },
      {
        id: '002_add_realtime_features',
        version: 2,
        name: 'Add Real-time Features',
        description: 'Add tables for real-time calendar sync and SSE connections',
        up: `
          CREATE TABLE IF NOT EXISTS sse_connections (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            last_ping INTEGER NOT NULL,
            subscriptions TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );

          CREATE TABLE IF NOT EXISTS calendar_conflicts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            local_event_id TEXT NOT NULL,
            remote_event_id TEXT NOT NULL,
            conflict_type TEXT NOT NULL,
            resolution TEXT DEFAULT 'pending',
            local_event_data TEXT,
            remote_event_data TEXT,
            created_at INTEGER NOT NULL,
            resolved_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );

          CREATE TABLE IF NOT EXISTS calendar_event_instances (
            id TEXT PRIMARY KEY,
            master_event_id TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (master_event_id) REFERENCES calendar_events(id)
          );
        `,
        down: `
          DROP TABLE IF EXISTS sse_connections;
          DROP TABLE IF EXISTS calendar_conflicts;
          DROP TABLE IF EXISTS calendar_event_instances;
        `,
        checksum: 'def456'
      },
      {
        id: '003_add_mobile_features',
        version: 3,
        name: 'Add Mobile Features',
        description: 'Add tables for mobile devices and push notifications',
        up: `
          CREATE TABLE IF NOT EXISTS mobile_devices (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            device_token TEXT NOT NULL,
            platform TEXT NOT NULL,
            app_version TEXT,
            os_version TEXT,
            last_seen INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT true,
            capabilities TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );

          CREATE TABLE IF NOT EXISTS push_notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            data TEXT,
            type TEXT NOT NULL,
            scheduled_for INTEGER,
            sent_at INTEGER,
            status TEXT DEFAULT 'pending',
            platform TEXT NOT NULL,
            device_token TEXT,
            one_signal_id TEXT,
            error_message TEXT,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
          );

          CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON push_notifications(user_id);
          CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
          CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_id ON mobile_devices(user_id);
        `,
        down: `
          DROP TABLE IF EXISTS push_notifications;
          DROP TABLE IF EXISTS mobile_devices;
        `,
        checksum: 'ghi789'
      }
    ];

    for (const migration of migrationFiles) {
      this.migrations.set(migration.id, migration);
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      appliedMigrations: [],
      failedMigrations: [],
      errors: [],
      rollbackAvailable: false
    };

    try {
      // Ensure migrations table exists
      await this.ensureMigrationsTable();

      // Get current migration status
      const appliedMigrations = await this.getAppliedMigrations();
      const pendingMigrations = this.getPendingMigrations(appliedMigrations);

      logger.info('Starting database migrations', {
        totalMigrations: this.migrations.size,
        appliedMigrations: appliedMigrations.length,
        pendingMigrations: pendingMigrations.length
      });

      // Apply pending migrations in order
      for (const migration of pendingMigrations) {
        try {
          await this.applyMigration(migration);
          result.appliedMigrations.push(migration.id);
          result.rollbackAvailable = true;

          logger.info('Migration applied successfully', {
            migrationId: migration.id,
            version: migration.version
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failedMigrations.push(migration.id);
          result.errors.push(`Migration ${migration.id}: ${errorMessage}`);
          result.success = false;

          logger.error('Migration failed', {
            migrationId: migration.id,
            error: errorMessage
          });

          // Stop on first failure
          break;
        }
      }

      logger.info('Migration process completed', {
        success: result.success,
        appliedCount: result.appliedMigrations.length,
        failedCount: result.failedMigrations.length
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(`Migration process failed: ${errorMessage}`);

      logger.error('Migration process failed', { error: errorMessage });
      return result;
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLastMigration(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      appliedMigrations: [],
      failedMigrations: [],
      errors: [],
      rollbackAvailable: false
    };

    try {
      // Get last applied migration
      const lastMigration = await this.getLastAppliedMigration();
      if (!lastMigration) {
        result.errors.push('No migrations to rollback');
        result.success = false;
        return result;
      }

      // Rollback the migration
      await this.rollbackMigration(lastMigration);
      result.appliedMigrations.push(lastMigration.id);

      logger.info('Migration rolled back successfully', {
        migrationId: lastMigration.id,
        version: lastMigration.version
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(`Rollback failed: ${errorMessage}`);

      logger.error('Migration rollback failed', { error: errorMessage });
      return result;
    }
  }

  /**
   * Rollback to specific migration
   */
  async rollbackToMigration(targetVersion: number): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      appliedMigrations: [],
      failedMigrations: [],
      errors: [],
      rollbackAvailable: false
    };

    try {
      const appliedMigrations = await this.getAppliedMigrations();
      const migrationsToRollback = appliedMigrations
        .filter(m => m.version > targetVersion)
        .sort((a, b) => b.version - a.version); // Rollback in reverse order

      for (const migration of migrationsToRollback) {
        try {
          await this.rollbackMigration(migration);
          result.appliedMigrations.push(migration.id);

          logger.info('Migration rolled back', {
            migrationId: migration.id,
            version: migration.version
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.failedMigrations.push(migration.id);
          result.errors.push(`Rollback ${migration.id}: ${errorMessage}`);
          result.success = false;
        }
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(`Rollback process failed: ${errorMessage}`);

      logger.error('Rollback process failed', { error: errorMessage });
      return result;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: number;
    lastAppliedVersion: number;
    migrations: Migration[];
  }> {
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = this.getPendingMigrations(appliedMigrations);
    const lastAppliedVersion = appliedMigrations.length > 0 
      ? Math.max(...appliedMigrations.map(m => m.version))
      : 0;

    return {
      totalMigrations: this.migrations.size,
      appliedMigrations: appliedMigrations.length,
      pendingMigrations: pendingMigrations.length,
      lastAppliedVersion,
      migrations: Array.from(this.migrations.values())
    };
  }

  /**
   * Validate migration integrity
   */
  async validateMigrations(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if migrations table exists
      const tableExists = await this.db.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='migrations'
      `);

      if (tableExists.results.length === 0) {
        errors.push('Migrations table does not exist');
        return { valid: false, errors };
      }

      // Validate each migration
      for (const [id, migration] of this.migrations) {
        // Check if migration is properly formatted
        if (!migration.up || !migration.down) {
          errors.push(`Migration ${id} is missing up or down SQL`);
        }

        // Check if migration has been applied correctly
        const applied = await this.db.query(`
          SELECT * FROM migrations WHERE id = ?
        `, [id]);

        if (applied.results.length > 0) {
          const appliedMigration = applied.results[0] as any;
          if (appliedMigration.checksum !== migration.checksum) {
            errors.push(`Migration ${id} checksum mismatch`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };

    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors };
    }
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTable(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        checksum TEXT NOT NULL,
        applied_at INTEGER,
        rolled_back_at INTEGER,
        status TEXT DEFAULT 'pending'
      );
    `);
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations(): Promise<Migration[]> {
    const result = await this.db.query(`
      SELECT * FROM migrations 
      WHERE status = 'applied' 
      ORDER BY version ASC
    `);

    return result.results.map((row: any) => ({
      id: row.id,
      version: row.version,
      name: row.name,
      description: row.description,
      up: '',
      down: '',
      checksum: row.checksum,
      appliedAt: row.applied_at,
      status: row.status
    }));
  }

  /**
   * Get pending migrations
   */
  private getPendingMigrations(appliedMigrations: Migration[]): Migration[] {
    const appliedIds = new Set(appliedMigrations.map(m => m.id));
    return Array.from(this.migrations.values())
      .filter(m => !appliedIds.has(m.id))
      .sort((a, b) => a.version - b.version);
  }

  /**
   * Apply a migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    // Start transaction
    await this.db.execute('BEGIN TRANSACTION');

    try {
      // Execute migration SQL
      await this.db.execute(migration.up);

      // Record migration as applied
      await this.db.execute(`
        INSERT INTO migrations (
          id, version, name, description, checksum, applied_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        migration.id,
        migration.version,
        migration.name,
        migration.description,
        migration.checksum,
        Date.now(),
        'applied'
      ]);

      // Commit transaction
      await this.db.execute('COMMIT');

    } catch (error) {
      // Rollback transaction
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  private async rollbackMigration(migration: Migration): Promise<void> {
    // Start transaction
    await this.db.execute('BEGIN TRANSACTION');

    try {
      // Execute rollback SQL
      await this.db.execute(migration.down);

      // Update migration status
      await this.db.execute(`
        UPDATE migrations 
        SET status = 'rolled_back', rolled_back_at = ?
        WHERE id = ?
      `, [Date.now(), migration.id]);

      // Commit transaction
      await this.db.execute('COMMIT');

    } catch (error) {
      // Rollback transaction
      await this.db.execute('ROLLBACK');
      throw error;
    }
  }

  /**
   * Get last applied migration
   */
  private async getLastAppliedMigration(): Promise<Migration | null> {
    const result = await this.db.query(`
      SELECT * FROM migrations 
      WHERE status = 'applied' 
      ORDER BY version DESC 
      LIMIT 1
    `);

    if (result.results.length === 0) {
      return null;
    }

    const row = result.results[0] as any;
    return {
      id: row.id,
      version: row.version,
      name: row.name,
      description: row.description,
      up: '',
      down: '',
      checksum: row.checksum,
      appliedAt: row.applied_at,
      status: row.status
    };
  }
}
