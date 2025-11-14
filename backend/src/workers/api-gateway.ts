import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt, verify } from 'hono/jwt';
import { Env } from '@/lib/env';

// middleware
import { authRateLimit, apiRateLimit } from '@/middleware/rateLimit';
import { customCors } from '@/middleware/cors';
import { addRequestId, addSecurityHeaders, validateLanguage } from '@/middleware/validate';
import { collectMetrics } from '@/middleware/metrics';

// sub-routers
import authRoutes from './auth';
import otpAuthRoutes from './otp-auth';
import coreRoutes from './core';
import healthRoutes from './health';
import aiRoutes from './ai';
import adminRoutes from './admin';
import badgeRoutes from './badges';
import paymentRoutes from './payments';
import calendarRoutes from './calendar';
import focusRoutes from './focus';
import voiceRoutes from './voice';
import notificationRoutes from './notifications';
import socialRoutes from './social';
import studentVerificationRoutes from './student-verification';
import localizationRoutes from './localization';
import healthMonitorRoutes from './health-monitor';
import metricsRoutes from './metrics';
import openapiRoutes from './openapi';
import realtimeRoutes from './realtime';
import mobileRoutes from './mobile';
import migrationsRoutes from './migrations';
import securityRoutes from './security';
import initDbRoutes from './init-db';
import fixFocusTableRoutes from './fix-focus-table';
import fixFocusSessionsTableRoutes from './fix-focus-sessions-table';

const app = new Hono<{ Bindings: Env }>();

// Global error handler for validation and other errors
app.onError((err, c) => {
  console.error('API Error:', err);
  console.error('Error name:', err.name);
  console.error('Error status:', (err as any).status);
  console.error('Error message:', err.message);
  
  // Handle validation errors from zValidator
  if (err.name === 'ZodError') {
    return c.json({ 
      error: 'Validation failed', 
      details: err.issues || err.message 
    }, 400);
  }
  
  // Handle HTTPException from Hono (which zValidator uses)
  if (err.name === 'HTTPException') {
    const status = (err as any).status || 500;
    if (status === 400) {
      return c.json({ 
        error: 'Validation failed', 
        details: err.message 
      }, 400);
    }
    return c.json({ 
      error: err.message || 'HTTP Error',
      details: err.message 
    }, status);
  }
  
  // Handle other known errors
  if (err.message?.includes('Unauthorized')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  if (err.message?.includes('Not found')) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  // Default to 500 for unknown errors
  return c.json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
});

// global middleware
app.use('*', logger());
app.use('*', addRequestId());
app.use('*', addSecurityHeaders());
app.use('*', customCors());
app.use('*', validateLanguage());
app.use('*', collectMetrics);

// Rate limiting for auth endpoints
app.use('/auth/*', authRateLimit());

// Rate limiting and JWT for API endpoints
app.use('/api/*', apiRateLimit());

// JWT middleware for most API endpoints, but exclude auth, realtime SSE, and public localization routes
app.use('/api/*', async (c, next) => {
  // Skip JWT middleware for auth routes (they handle their own authentication)
  if (c.req.path.startsWith('/api/auth')) {
    return next();
  }
  
  // Skip JWT middleware for realtime SSE routes (they handle auth differently)
  if (c.req.path.startsWith('/api/realtime/sse')) {
    return next();
  }
  
  // Skip JWT middleware for public localization routes
  if (c.req.path.startsWith('/api/localization/languages')) {
    return next();
  }

  // Skip JWT middleware for public focus templates
  if (c.req.path === '/api/focus/templates') {
    return next();
  }

  // Skip JWT middleware for OTP authentication routes
  if (c.req.path.startsWith('/api/otp/')) {
    return next();
  }

  // Skip JWT middleware for webhook routes (they have their own authentication)
  if (c.req.path.startsWith('/api/payments/webhooks/')) {
    return next();
  }
  
  // Skip JWT middleware for test routes in test environment
  if (process.env.NODE_ENV === 'test' && c.req.header('X-Test-Skip-JWT') === 'true') {
    // Set a mock payload for testing
    c.set('jwtPayload', { userId: 'user_test_regular' });
    return next();
  }
  
  // Custom JWT validation with proper error handling
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    // Store payload in context for route handlers
    c.set('jwtPayload', payload);
    
    return next();
  } catch (error) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

// health check
app.get('/health', async (c) => {
  const checks = await Promise.allSettled([
    c.env.DB.prepare('SELECT 1').run(),
    c.env.CACHE.get('ping')
  ]);
  const ok = checks.every(c => c.status === 'fulfilled');
  return c.json({ status: ok ? 'ok' : 'error', checks }, ok ? 200 : 503);
});

// mount sub-routers - specific routes first, then general
app.route('/init-db', initDbRoutes);
app.route('/fix-focus-table', fixFocusTableRoutes);
app.route('/fix-focus-sessions-table', fixFocusSessionsTableRoutes);
app.route('/auth', authRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/otp', otpAuthRoutes);
app.route('/api', coreRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/badges', badgeRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/calendar', calendarRoutes);
app.route('/api/focus', focusRoutes);
app.route('/api/voice', voiceRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/social', socialRoutes);
app.route('/api/student', studentVerificationRoutes);
app.route('/api/localization', localizationRoutes);
app.route('/api/system/health', healthMonitorRoutes);
app.route('/api/metrics', metricsRoutes);
app.route('/api/openapi', openapiRoutes);
app.route('/api/realtime', realtimeRoutes);
app.route('/api/mobile', mobileRoutes);
app.route('/api/migrations', migrationsRoutes);
app.route('/api/security', securityRoutes);
app.route('/api', coreRoutes); // Core routes last to catch remaining /api/* routes
app.route('/admin', adminRoutes);

export default app;