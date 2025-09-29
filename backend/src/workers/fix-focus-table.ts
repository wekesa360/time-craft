// Temporary fix for focus_templates table schema
import { Hono } from 'hono';
import type { Env } from '../lib/env';

const fixFocusTable = new Hono<{ Bindings: Env }>();

// POST /fix-focus-table - Fix the focus_templates table schema
fixFocusTable.post('/', async (c) => {
  try {
    console.log('Starting focus_templates table fix...');

    // Step 1: Check if table exists and what columns it has
    const tableInfo = await c.env.DB.prepare(`
      PRAGMA table_info(focus_templates)
    `).all();

    console.log('Current table structure:', tableInfo.results);

    // Step 2: Drop the existing table if it exists
    await c.env.DB.prepare(`DROP TABLE IF EXISTS focus_templates`).run();
    console.log('Dropped existing focus_templates table');

    // Step 3: Create new table with correct schema
    await c.env.DB.prepare(`
      CREATE TABLE focus_templates (
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
      )
    `).run();
    console.log('Created new focus_templates table with correct schema');

    // Step 4: Insert default templates
    const defaultTemplates = [
      {
        id: 'template_1',
        template_key: 'pomodoro_25',
        name: 'Pomodoro 25min',
        description: 'Classic Pomodoro technique with 25-minute focus sessions',
        session_type: 'pomodoro',
        duration_minutes: 25,
        break_duration_minutes: 5,
        is_default: 1,
        is_active: 1,
        language: 'en',
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'template_2',
        template_key: 'deep_work_90',
        name: 'Deep Work 90min',
        description: 'Extended deep work session for complex tasks',
        session_type: 'deep_work',
        duration_minutes: 90,
        break_duration_minutes: 15,
        is_default: 0,
        is_active: 1,
        language: 'en',
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'template_3',
        template_key: 'meditation_10',
        name: 'Meditation 10min',
        description: 'Short meditation session for mindfulness',
        session_type: 'meditation',
        duration_minutes: 10,
        break_duration_minutes: 0,
        is_default: 0,
        is_active: 1,
        language: 'en',
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'template_4',
        template_key: 'exercise_30',
        name: 'Exercise 30min',
        description: 'Physical exercise session',
        session_type: 'exercise',
        duration_minutes: 30,
        break_duration_minutes: 5,
        is_default: 0,
        is_active: 1,
        language: 'en',
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    for (const template of defaultTemplates) {
      await c.env.DB.prepare(`
        INSERT INTO focus_templates (
          id, template_key, name, description, session_type,
          duration_minutes, break_duration_minutes, is_default,
          is_active, language, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        template.id,
        template.template_key,
        template.name,
        template.description,
        template.session_type,
        template.duration_minutes,
        template.break_duration_minutes,
        template.is_default,
        template.is_active,
        template.language,
        template.created_at,
        template.updated_at
      ).run();
    }

    console.log('Inserted default focus templates');

    // Step 5: Create indexes
    await c.env.DB.prepare(`CREATE INDEX idx_focus_templates_key ON focus_templates(template_key)`).run();
    await c.env.DB.prepare(`CREATE INDEX idx_focus_templates_type ON focus_templates(session_type)`).run();
    await c.env.DB.prepare(`CREATE INDEX idx_focus_templates_active ON focus_templates(is_active)`).run();

    console.log('Created indexes for focus_templates table');

    // Verify the fix by querying the table
    const verifyResult = await c.env.DB.prepare(`
      SELECT * FROM focus_templates WHERE is_active = 1
    `).all();

    console.log('Verification query successful, found templates:', verifyResult.results?.length);

    return c.json({
      success: true,
      message: 'focus_templates table fixed successfully',
      templates_created: defaultTemplates.length,
      templates_found: verifyResult.results?.length || 0
    });

  } catch (error) {
    console.error('Focus table fix error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default fixFocusTable;