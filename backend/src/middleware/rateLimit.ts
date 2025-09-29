import type { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';

export interface RateLimitOptions {
  max: number;
  windowMs: number;
  keyGenerator?: (c: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const {
    max,
    windowMs,
    keyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests'
  } = opts;

  return async (c, next) => {
    // Generate rate limit key (IP + user if authenticated)
    let key: string;
    if (keyGenerator) {
      key = keyGenerator(c);
    } else {
      const ip = c.req.header('CF-Connecting-IP') || 
                 c.req.header('X-Forwarded-For') || 
                 'unknown';
      
      // Try to get user ID from JWT for authenticated requests
      let userId = 'anonymous';
      try {
        const authHeader = c.req.header('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const payload = await verify(token, c.env.JWT_SECRET);
          userId = payload.userId as string || 'anonymous';
        }
      } catch {
        // Token invalid or missing, use anonymous
      }
      
      key = `rl:${ip}:${userId}`;
    }

    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / windowMs)}`;

    // Get current count for this window
    const current = c.env?.CACHE ? await c.env.CACHE.get(windowKey) : null;
    const count = current ? parseInt(current) : 0;

    // Check if limit exceeded
    if (count >= max) {
      const resetTime = Math.ceil((Math.floor(now / windowMs) + 1) * windowMs / 1000);
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', resetTime.toString());
      c.header('Retry-After', Math.ceil(windowMs / 1000).toString());

      return c.json({ 
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        resetTime
      }, 429);
    }

    // For now, always count requests
    // In production, you could implement status-based counting
    const shouldCount = true;

    await next();

    // Increment counter only if we should count this request
    if (shouldCount && c.env?.CACHE) {
      await c.env.CACHE.put(
        windowKey, 
        (count + 1).toString(), 
        { expirationTtl: Math.ceil(windowMs / 1000) }
      );
    }

    // Add rate limit headers to successful responses
    const remaining = Math.max(0, max - count - (shouldCount ? 1 : 0));
    const resetTime = Math.ceil((Math.floor(now / windowMs) + 1) * windowMs / 1000);
    
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetTime.toString());
  };
}

// Preset rate limiters for different endpoints
export const authRateLimit = () => rateLimit({
  max: 20, // 20 attempts per 5 minutes
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
  message: 'Too many authentication attempts. Please try again in 5 minutes.',
  skipSuccessfulRequests: true
});

export const apiRateLimit = () => rateLimit({
  max: 1000, // 1000 requests per hour for authenticated users
  windowMs: 60 * 60 * 1000,
  message: 'API rate limit exceeded. Please slow down.'
});

export const publicRateLimit = () => rateLimit({
  max: 100, // 100 requests per hour for public endpoints
  windowMs: 60 * 60 * 1000,
  message: 'Rate limit exceeded. Please try again later.'
});