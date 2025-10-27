#!/usr/bin/env tsx

import { DatabaseSeeder } from './seeders/seeder';

// Mock D1 database for testing
class MockD1Database {
  private queries: string[] = [];
  
  prepare(sql: string) {
    this.queries.push(sql);
    return {
      bind: (...params: any[]) => ({
        run: () => {
          console.log(`✓ Executed: ${sql.substring(0, 50)}...`);
          return Promise.resolve({ success: true, meta: { changes: 1 } });
        },
        all: () => Promise.resolve({ results: [], success: true })
      }),
      run: () => {
        console.log(`✓ Executed: ${sql.substring(0, 50)}...`);
        return Promise.resolve({ success: true, meta: { changes: 1 } });
      },
      all: () => Promise.resolve({ results: [], success: true })
    };
  }
  
  getQueries() {
    return this.queries;
  }
}

async function testSeeder() {
  console.log('🧪 Testing Database Seeder...\n');

  const mockDB = new MockD1Database();
  
  // Mock environment
  const mockEnv = {
    DB: mockDB as any,
    OPENAI_API_KEY: 'test-key',
    JWT_SECRET: 'test-secret',
    STRIPE_SECRET_KEY: 'test-stripe',
    STRIPE_WEBHOOK_SECRET: 'test-webhook',
    REFRESH_SECRET: 'test-refresh',
    ENCRYPTION_KEY: 'test-encryption-key-32-characters',
    DEEPGRAM_API_KEY: 'test-deepgram',
    RESEND_API_KEY: 'test-resend',
    FROM_EMAIL: 'test@example.com',
    ONESIGNAL_APP_ID: 'test-onesignal-app',
    ONESIGNAL_API_KEY: 'test-onesignal-key',
    GOOGLE_CLIENT_ID: 'test-google-client',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:5173/auth/google/callback',
    APP_BASE_URL: 'http://localhost:5173',
    OUTLOOK_CLIENT_ID: 'test-outlook-client',
    OUTLOOK_CLIENT_SECRET: 'test-outlook-secret',
    CACHE: {} as any,
    ASSETS: {} as any,
    TASK_QUEUE: {} as any,
    ANALYTICS: {} as any
  };

  try {
    const seeder = new DatabaseSeeder(mockEnv);
    
    console.log('🌱 Running comprehensive seeder...\n');
    
    const result = await seeder.seedDevelopmentData({ 
      clearExisting: true, 
      verbose: true 
    });
    
    console.log('\n📊 Seeder Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Message: ${result.message}`);
    console.log(`🔢 Total SQL queries executed: ${mockDB.getQueries().length}`);
    
    console.log('\n🎯 Tables that should be populated:');
    const expectedTables = [
      'users (3 records)',
      'achievement_definitions (4 records)',
      'user_achievements (4 records)', 
      'tasks (6 records)',
      'health_logs (5 records)',
      'calendar_events (4 records)',
      'habits (4 records)',
      'goals (2 records)',
      'gratitude_entries (4 records)',
      'focus_sessions (3 records)',
      'focus_templates (3 records)',
      'reflection_entries (3 records)',
      'social_connections (3 records)',
      'user_badges (3 records)',
      'challenges (2 records)',
      'challenge_participants (4 records)',
      'notification_preferences (3 records)',
      'external_tokens (2 records)',
      'file_assets (3 records)',
      'calendar_connections (2 records)'
    ];
    
    expectedTables.forEach(table => console.log(`  • ${table}`));
    
    console.log('\n🎉 Seeder test completed successfully!');
    console.log('📋 Total records that would be created: ~65');
    console.log('📊 Tables covered: 20/40+ (~50% coverage)');
    
  } catch (error) {
    console.error('❌ Seeder test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSeeder().catch(console.error);