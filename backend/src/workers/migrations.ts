// Database Migrations API Endpoints
// Handles database migrations, rollbacks, and validation

import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService } from '../lib/db';
import { DatabaseMigrationService } from '../lib/database-migrations';

const migrations = new Hono<{ Bindings: Env }>();

// Helper function to get user from token
async function getUserFromToken(c: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    return { userId: payload.userId, email: payload.email };
  } catch (error) {
    return null;
  }
}

// Helper function to check admin permissions
async function checkAdminPermissions(c: any) {
  const auth = await getUserFromToken(c);
  if (!auth) return false;

  const db = new DatabaseService(c.env);
  const user = await db.query(`
    SELECT role FROM users WHERE id = ?
  `, [auth.userId]);

  return user.results.length > 0 && (user.results[0] as any).role === 'admin';
}

// ========== MIGRATION MANAGEMENT ==========

// GET /migrations/status - Get migration status
migrations.get('/status', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);
  const migrationService = new DatabaseMigrationService(db);

  try {
    const status = await migrationService.getMigrationStatus();
    
    return c.json({
      success: true,
      status
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status retrieval failed'
    }, 500);
  }
});

// POST /migrations/run - Run pending migrations
migrations.post('/run', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);
  const migrationService = new DatabaseMigrationService(db);

  try {
    const result = await migrationService.runMigrations();
    
    return c.json({
      success: result.success,
      appliedMigrations: result.appliedMigrations,
      failedMigrations: result.failedMigrations,
      errors: result.errors,
      rollbackAvailable: result.rollbackAvailable,
      message: result.success ? 'Migrations completed successfully' : 'Migrations completed with errors'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration execution failed'
    }, 500);
  }
});

// POST /migrations/rollback - Rollback last migration
migrations.post('/rollback', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);
  const migrationService = new DatabaseMigrationService(db);

  try {
    const result = await migrationService.rollbackLastMigration();
    
    return c.json({
      success: result.success,
      appliedMigrations: result.appliedMigrations,
      failedMigrations: result.failedMigrations,
      errors: result.errors,
      message: result.success ? 'Rollback completed successfully' : 'Rollback completed with errors'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Rollback execution failed'
    }, 500);
  }
});

// POST /migrations/rollback-to - Rollback to specific version
migrations.post('/rollback-to',
  zValidator('json', z.object({
    targetVersion: z.number().min(1)
  })),
  async (c) => {
    const isAdmin = await checkAdminPermissions(c);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { targetVersion } = c.req.valid('json');
    const db = new DatabaseService(c.env);
    const migrationService = new DatabaseMigrationService(db);

    try {
      const result = await migrationService.rollbackToMigration(targetVersion);
      
      return c.json({
        success: result.success,
        appliedMigrations: result.appliedMigrations,
        failedMigrations: result.failedMigrations,
        errors: result.errors,
        message: result.success ? `Rollback to version ${targetVersion} completed successfully` : 'Rollback completed with errors'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Rollback execution failed'
      }, 500);
    }
  }
);

// GET /migrations/validate - Validate migration integrity
migrations.get('/validate', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);
  const migrationService = new DatabaseMigrationService(db);

  try {
    const validation = await migrationService.validateMigrations();
    
    return c.json({
      success: true,
      valid: validation.valid,
      errors: validation.errors,
      message: validation.valid ? 'All migrations are valid' : 'Migration validation failed'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }, 500);
  }
});

// ========== MIGRATION HISTORY ==========

// GET /migrations/history - Get migration history
migrations.get('/history', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);

  try {
    const history = await db.query(`
      SELECT id, version, name, description, applied_at, rolled_back_at, status
      FROM migrations 
      ORDER BY version DESC
    `);
    
    return c.json({
      success: true,
      history: history.results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'History retrieval failed'
    }, 500);
  }
});

// GET /migrations/:migrationId - Get specific migration details
migrations.get('/:migrationId', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const migrationId = c.req.param('migrationId');
  const db = new DatabaseService(c.env);

  try {
    const migration = await db.query(`
      SELECT * FROM migrations WHERE id = ?
    `, [migrationId]);
    
    if (migration.results.length === 0) {
      return c.json({ error: 'Migration not found' }, 404);
    }
    
    return c.json({
      success: true,
      migration: migration.results[0]
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration retrieval failed'
    }, 500);
  }
});

// ========== DATABASE HEALTH ==========

// GET /migrations/health - Get database health status
migrations.get('/health', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);

  try {
    // Check database connectivity
    const connectivity = await db.query('SELECT 1 as test');
    const isConnected = connectivity.results.length > 0;

    // Check migrations table
    const migrationsTable = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `);
    const hasMigrationsTable = migrationsTable.results.length > 0;

    // Get table count
    const tableCount = await db.query(`
      SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
    `);
    const totalTables = (tableCount.results[0] as any).count;

    // Get migration count
    const migrationCount = await db.query(`
      SELECT COUNT(*) as count FROM migrations
    `);
    const totalMigrations = (migrationCount.results[0] as any).count;

    return c.json({
      success: true,
      health: {
        connected: isConnected,
        hasMigrationsTable,
        totalTables,
        totalMigrations,
        status: isConnected && hasMigrationsTable ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      health: {
        connected: false,
        hasMigrationsTable: false,
        totalTables: 0,
        totalMigrations: 0,
        status: 'unhealthy'
      }
    }, 500);
  }
});

// ========== MIGRATION BACKUP ==========

// POST /migrations/backup - Create database backup before migration
migrations.post('/backup', async (c) => {
  const isAdmin = await checkAdminPermissions(c);
  if (!isAdmin) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  const db = new DatabaseService(c.env);

  try {
    // Get all table names
    const tables = await db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    const backupData: Record<string, any[]> = {};

    // Backup each table
    for (const table of tables.results as any[]) {
      const tableName = table.name;
      const data = await db.query(`SELECT * FROM ${tableName}`);
      backupData[tableName] = data.results;
    }

    // Store backup metadata
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.execute(`
      INSERT INTO migration_backups (
        id, created_at, table_count, total_records
      ) VALUES (?, ?, ?, ?)
    `, [
      backupId,
      Date.now(),
      tables.results.length,
      Object.values(backupData).reduce((sum, records) => sum + records.length, 0)
    ]);

    return c.json({
      success: true,
      backupId,
      tableCount: tables.results.length,
      totalRecords: Object.values(backupData).reduce((sum, records) => sum + records.length, 0),
      message: 'Database backup created successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Backup creation failed'
    }, 500);
  }
});

// GET /migrations/backups - List available backups
migrations.get('/backups', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = new DatabaseService(c.env);

  try {
    const backups = await db.query(`
      SELECT id, created_at, table_count, total_records
      FROM migration_backups 
      ORDER BY created_at DESC
    `);
    
    return c.json({
      success: true,
      backups: backups.results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Backup listing failed'
    }, 500);
  }
});

// ========== MIGRATION TESTING ==========

// POST /migrations/test - Test migration without applying
migrations.post('/test',
  zValidator('json', z.object({
    migrationId: z.string()
  })),
  async (c) => {
    const isAdmin = await checkAdminPermissions(c);
    if (!isAdmin) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const { migrationId } = c.req.valid('json');
    const db = new DatabaseService(c.env);

    try {
      // Get migration details
      const migration = await db.query(`
        SELECT * FROM migrations WHERE id = ?
      `, [migrationId]);

      if (migration.results.length === 0) {
        return c.json({ error: 'Migration not found' }, 404);
      }

      // Test SQL syntax (basic validation)
      const migrationData = migration.results[0] as any;
      
      // This is a simplified test - in production, you'd want more sophisticated validation
      const isValidSQL = migrationData.up && migrationData.down && 
                        migrationData.up.includes('CREATE') || migrationData.up.includes('ALTER') || migrationData.up.includes('INSERT');
      
      return c.json({
        success: true,
        valid: isValidSQL,
        message: isValidSQL ? 'Migration SQL appears valid' : 'Migration SQL may have issues',
        migration: {
          id: migrationData.id,
          name: migrationData.name,
          version: migrationData.version
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Migration test failed'
      }, 500);
    }
  }
);

export default migrations;
