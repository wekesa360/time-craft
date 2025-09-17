// Validation middleware for Time & Wellness Application
import type { MiddlewareHandler } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

// JWT validation middleware
export const requireAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);

      // Add user info to context
      c.set('userId', payload.userId);
      c.set('userEmail', payload.email);
      c.set('subscriptionType', payload.subscriptionType);
      c.set('isStudent', payload.isStudent);
      c.set('preferredLanguage', payload.preferredLanguage);

      await next();
    } catch (error) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
  };
};

// Subscription tier validation
export const requireSubscription = (requiredTier: 'free' | 'standard' | 'student'): MiddlewareHandler => {
  return async (c, next) => {
    const subscriptionType = c.get('subscriptionType') as string;
    const isStudent = c.get('isStudent') as boolean;

    // Define subscription hierarchy
    const tierHierarchy = {
      'free': 0,
      'student': 1,
      'standard': 2
    };

    const userTier = isStudent ? 'student' : subscriptionType;
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return c.json({ 
        error: 'Subscription upgrade required',
        requiredTier,
        currentTier: userTier
      }, 403);
    }

    await next();
  };
};

// Request size validation
export const limitRequestSize = (maxBytes: number): MiddlewareHandler => {
  return async (c, next) => {
    const contentLength = c.req.header('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxBytes) {
      return c.json({ 
        error: 'Request too large',
        maxSize: maxBytes,
        receivedSize: parseInt(contentLength)
      }, 413);
    }

    await next();
  };
};

// Language validation
export const validateLanguage = (): MiddlewareHandler => {
  return async (c, next) => {
    const language = c.req.header('Accept-Language') || 
                    c.req.query('lang') || 
                    c.get('preferredLanguage') || 
                    'en';

    // Normalize and validate language
    const supportedLanguages = ['en', 'de'];
    const normalizedLang = language.substring(0, 2).toLowerCase();
    
    if (!supportedLanguages.includes(normalizedLang)) {
      c.set('language', 'en'); // Default to English
    } else {
      c.set('language', normalizedLang);
    }

    await next();
  };
};

// Request ID generation middleware
export const addRequestId = (): MiddlewareHandler => {
  return async (c, next) => {
    const requestId = crypto.randomUUID();
    
    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);
    
    await next();
  };
};

// Security headers middleware
export const addSecurityHeaders = (): MiddlewareHandler => {
  return async (c, next) => {
    // Add security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Content-Security-Policy', "default-src 'self'");
    
    await next();
  };
};

// Request validation middleware (wrapper around zValidator)
export function validateRequest(config: {
  json?: ZodSchema;
  query?: ZodSchema;
  param?: ZodSchema;
  form?: ZodSchema;
  cookie?: ZodSchema;
  header?: ZodSchema;
}): MiddlewareHandler {
  const validators: MiddlewareHandler[] = [];
  
  if (config.json) validators.push(zValidator('json', config.json));
  if (config.query) validators.push(zValidator('query', config.query));
  if (config.param) validators.push(zValidator('param', config.param));
  if (config.form) validators.push(zValidator('form', config.form));
  if (config.cookie) validators.push(zValidator('cookie', config.cookie));
  if (config.header) validators.push(zValidator('header', config.header));
  
  return async (c, next) => {
    for (const validator of validators) {
      await validator(c, async () => {});
    }
    await next();
  };
}