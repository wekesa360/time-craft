import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { Env } from '@/lib/env';

// middleware
import { authRateLimit, apiRateLimit } from '@/middleware/rateLimit';
import { customCors } from '@/middleware/cors';
import { addRequestId, addSecurityHeaders, validateLanguage } from '@/middleware/validate';

// sub-routers
import authRoutes from './auth';
import coreRoutes from './core';
import healthRoutes from './health';
import aiRoutes from './ai';
import realtimeRoutes from './realtime';
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

const app = new Hono<{ Bindings: Env }>();

// global middleware
app.use('*', logger());
app.use('*', addRequestId());
app.use('*', addSecurityHeaders());
app.use('*', customCors());
app.use('*', validateLanguage());

// Rate limiting for auth endpoints
app.use('/auth/*', authRateLimit());

// Rate limiting and JWT for API endpoints
app.use('/api/*', apiRateLimit());
app.use('/api/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
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
app.route('/auth', authRoutes);
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
app.route('/api', coreRoutes); // Core routes last to catch remaining /api/* routes
app.route('/realtime', realtimeRoutes);
app.route('/admin', adminRoutes);

export default app;