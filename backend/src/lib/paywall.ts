import type { Env } from './env';

export interface Limit {
  free: number;
  premium: number; // -1 = unlimited
}

export async function premiumGate(
  feature: string,
  userId: string,
  env: Env
): Promise<boolean> {
  // 1. Load limits from KV (hot-reloadable)
  const cfg = await env.CACHE.get('paywall:v1', 'json') as { features: Record<string, Limit> };
  if (!cfg?.features[feature]) return true; // default allow if no rule
  const limit = cfg.features[feature];

  // 2. User tier
  const { plan } = await env.DB
    .prepare('SELECT plan FROM users WHERE id = ?')
    .bind(userId)
    .first<{ plan: 'free' | 'premium' }>() ?? { plan: 'free' };

  if (plan === 'premium') return limit.premium === -1;

  // 3. Check usage (free tier only)
  const key = `usage:${feature}:${userId}`;
  const used = Number(await env.CACHE.get(key)) || 0;
  return used < limit.free;
}

export async function incrementUsage(
  feature: string,
  userId: string,
  env: Env
): Promise<void> {
  const key = `usage:${feature}:${userId}`;
  const current = Number(await env.CACHE.get(key)) || 0;
  await env.CACHE.put(key, (current + 1).toString(), { expirationTtl: 86_400 }); // 1 day
}