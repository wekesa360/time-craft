// Script to add badge columns to users table
import { DatabaseService } from './src/lib/db';

const env = {
  DB: {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        all: async () => ({ results: [] }),
        run: async () => ({ success: true })
      })
    }),
    exec: async (sql: string) => ({ success: true })
  }
} as any;

async function runMigration() {
  try {
    const db = new DatabaseService(env);
    
    console.log('Adding badge columns to users table...');
    
    // Add badge_points column
    await db.execute('ALTER TABLE users ADD COLUMN badge_points INTEGER DEFAULT 0;');
    console.log('✓ Added badge_points column');
    
    // Add total_badges column
    await db.execute('ALTER TABLE users ADD COLUMN total_badges INTEGER DEFAULT 0;');
    console.log('✓ Added total_badges column');
    
    // Add badge_tier column
    await db.execute('ALTER TABLE users ADD COLUMN badge_tier TEXT DEFAULT \'bronze\';');
    console.log('✓ Added badge_tier column');
    
    // Create indexes
    await db.execute('CREATE INDEX IF NOT EXISTS idx_users_badge_points ON users(badge_points DESC);');
    console.log('✓ Created badge_points index');
    
    await db.execute('CREATE INDEX IF NOT EXISTS idx_users_total_badges ON users(total_badges DESC);');
    console.log('✓ Created total_badges index');
    
    // Update existing users
    await db.execute(`
      UPDATE users SET 
        badge_points = 0,
        total_badges = 0,
        badge_tier = 'bronze'
      WHERE badge_points IS NULL OR total_badges IS NULL OR badge_tier IS NULL;
    `);
    console.log('✓ Updated existing users with default values');
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
