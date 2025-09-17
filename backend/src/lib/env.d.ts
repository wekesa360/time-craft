// src/lib/env.d.ts
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
  ONESIGNAL_APP_ID: string;
  ONESIGNAL_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
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