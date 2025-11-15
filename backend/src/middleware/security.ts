import { Context, Next } from 'hono';
import { logger } from '../lib/logger';

export const securityHeaders = async (c: Context, next: Next) => {
  // Add security headers
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'"
  ].join('; ');
  
  c.header('Content-Security-Policy', csp);
  
  await next();
};

// CSRF Protection Middleware
export const csrfProtection = async (c: Context, next: Next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  // Skip CSRF check for safe methods
  if (safeMethods.includes(c.req.method)) {
    return next();
  }
  
  // Get CSRF token from header
  const csrfToken = c.req.header('X-CSRF-Token');
  
  // Verify CSRF token
  if (!csrfToken || !verifyCsrfToken(csrfToken, c)) {
    logger.warn('CSRF token validation failed', {
      path: c.req.path,
      method: c.req.method,
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')
    });
    
    return c.json(
      {
        success: false,
        error: 'Invalid or missing CSRF token',
        code: 'invalid_csrf_token'
      },
      403
    );
  }
  
  await next();
};

// Helper function to verify CSRF token
function verifyCsrfToken(token: string, c: Context): boolean {
  try {
    // In a real implementation, you would verify the token against the user's session
    // This is a simplified example
    const sessionToken = c.req.cookie('session_token');
    // Add your actual CSRF token verification logic here
    return !!token && token === sessionToken;
  } catch (error) {
    logger.error('CSRF token verification error', { error });
    return false;
  }
}

// Rate limiting middleware
export const rateLimit = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
}) => {
  const { windowMs, max, keyGenerator = (c) => c.req.header('cf-connecting-ip') || 'global' } = options;
  const hits = new Map<string, { count: number; resetTime: number }>();
  
  setInterval(() => {
    const now = Date.now();
    for (const [key, hit] of hits.entries()) {
      if (hit.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, windowMs);
  
  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    
    if (!hits.has(key)) {
      hits.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      const hit = hits.get(key)!;
      
      if (hit.resetTime <= now) {
        hit.count = 1;
        hit.resetTime = now + windowMs;
      } else {
        hit.count++;
        
        if (hit.count > max) {
          const retryAfter = Math.ceil((hit.resetTime - now) / 1000);
          c.header('Retry-After', retryAfter.toString());
          
          return c.json(
            {
              success: false,
              error: 'Too many requests, please try again later',
              retryAfter,
              code: 'rate_limit_exceeded'
            },
            429
          );
        }
      }
    }
    
    const hit = hits.get(key)!;
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', (max - hit.count).toString());
    c.header('X-RateLimit-Reset', hit.resetTime.toString());
    
    await next();
  };
};
