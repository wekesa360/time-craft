// Fix for focus_sessions table schema
import { Hono } from 'hono';
import type { Env } from '../lib/env';

const fixFocusSessionsTable = new Hono<{ Bindings: Env }>();

// POST /fix-focus-sessions-table - Fix the focus_sessions table schema
fixFocusSessionsTable.post('/', async (c) => {
  try {
    console.log('Starting focus_sessions table fix...');

    // Step 1: Check if table exists and what columns it has
    const tableInfo = await c.env.DB.prepare(`
      PRAGMA table_info(focus_sessions)
    `).all();

    console.log('Current focus_sessions table structure:', tableInfo.results);

    // Step 2: Drop the existing table if it exists
    await c.env.DB.prepare(`DROP TABLE IF EXISTS focus_sessions`).run();
    console.log('Dropped existing focus_sessions table');

    // Step 3: Create new table with correct schema
    await c.env.DB.prepare(`
      CREATE TABLE focus_sessions (
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
      )
    `).run();
    console.log('Created new focus_sessions table with correct schema');

    // Step 4: Create indexes for performance
    await c.env.DB.prepare(`CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id)`).run();
    await c.env.DB.prepare(`CREATE INDEX idx_focus_sessions_type ON focus_sessions(session_type)`).run();
    await c.env.DB.prepare(`CREATE INDEX idx_focus_sessions_started ON focus_sessions(started_at)`).run();
    await c.env.DB.prepare(`CREATE INDEX idx_focus_sessions_task ON focus_sessions(task_id)`).run();

    console.log('Created indexes for focus_sessions table');

    // Verify the fix by checking table schema
    const verifyInfo = await c.env.DB.prepare(`
      PRAGMA table_info(focus_sessions)
    `).all();

    console.log('Verification: New table structure has', verifyInfo.results?.length, 'columns');

    return c.json({
      success: true,
      message: 'focus_sessions table fixed successfully',
      columns_created: verifyInfo.results?.length || 0
    });

  } catch (error) {
    console.error('Focus sessions table fix error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default fixFocusSessionsTable;