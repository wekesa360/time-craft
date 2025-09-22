// src/lib/env.d.ts
import type { D1Database, D1Result, KVNamespace, R2Bucket, Queue, AnalyticsEngineDataset } from '@cloudflare/workers-types';

export interface Env {
  // ========== Secrets (wrangler secret put) ==========
  JWT_SECRET: string;
  REFRESH_SECRET: string;
  ENCRYPTION_KEY: string;
  OPENAI_API_KEY: string;
  DEEPGRAM_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  APP_BASE_URL: string;
  OUTLOOK_CLIENT_ID: string;
  OUTLOOK_CLIENT_SECRET: string;

  // ========== Cloudflare Bindings ==========
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
  TASK_QUEUE: Queue;
  ANALYTICS: AnalyticsEngineDataset;
}

declare global {
  interface Crypto {
    randomUUID(): string;
  }
}