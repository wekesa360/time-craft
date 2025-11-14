import { D1Database } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { DB } = env;

    try {
      // Read the SQL migration file
      const migrationSql = `
        ALTER TABLE users ADD COLUMN preferences TEXT DEFAULT '{}';
      `;

      // Execute the migration
      await DB.exec(migrationSql);

      return new Response('Migration 028_add_preferences_column.sql executed successfully!', { status: 200 });
    } catch (error: any) {
      console.error('Error executing migration:', error);
      return new Response(`Error executing migration: ${error.message}`, { status: 500 });
    }
  },
};





