// Authentication routes for Time & Wellness Application
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

import type { Env } from '../lib/env';
import { UserRepository } from '../lib/db';
import type { User, SupportedLanguage } from '../types/database';

const auth = new Hono<{ Bindings: Env }>();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  timezone: z.string().default('UTC'),
  preferredLanguage: z.enum(['en', 'de']).default('en'),
  isStudent: z.boolean().default(false)
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// JWT token generation
const generateTokens = async (user: User, env: Env) => {
  const payload = {
    userId: user.id,
    email: user.email,
    subscriptionType: user.subscription_type,
    isStudent: user.is_student,
    preferredLanguage: user.preferred_language
  };

  const accessToken = await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      type: 'access'
    },
    env.JWT_SECRET
  );

  const refreshToken = await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
      type: 'refresh'
    },
    env.REFRESH_SECRET
  );

  return { accessToken, refreshToken };
};

// User response helper (exclude sensitive data)
const sanitizeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  timezone: user.timezone,
  preferredLanguage: user.preferred_language,
  subscriptionType: user.subscription_type,
  subscriptionExpiresAt: user.subscription_expires_at,
  isStudent: user.is_student,
  studentVerificationStatus: user.student_verification_status,
  createdAt: user.created_at,
  updatedAt: user.updated_at
});

// POST /auth/register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      timezone, 
      preferredLanguage, 
      isStudent 
    } = c.req.valid('json');

    const userRepo = new UserRepository(c.env);

    // Check if user already exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await userRepo.createUser({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      timezone,
      preferred_language: preferredLanguage as SupportedLanguage,
      subscription_type: 'free',
      subscription_expires_at: null,
      stripe_customer_id: null,
      is_student: isStudent,
      student_verification_status: 'none'
    });

    // Generate tokens
    const tokens = await generateTokens(newUser, c.env);

    // Log registration event
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [email, 'registration'],
      doubles: [Date.now()],
      indexes: ['user_events']
    });

    return c.json({
      message: 'Registration successful',
      user: sanitizeUser(newUser),
      tokens
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    const userRepo = new UserRepository(c.env);

    // Find user by email
    const user = await userRepo.findByEmail(email);
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate tokens
    const tokens = await generateTokens(user, c.env);

    // Update last login time
    await userRepo.updateUser(user.id, { updated_at: Date.now() });

    // Log login event
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [email, 'login'],
      doubles: [Date.now()],
      indexes: ['user_events']
    });

    return c.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/refresh
auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json');

    // Verify refresh token
    const payload = await verify(refreshToken, c.env.REFRESH_SECRET);
    
    if (payload.type !== 'refresh') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    const userRepo = new UserRepository(c.env);
    const user = await userRepo.findById(payload.userId as string);

    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Generate new tokens
    const tokens = await generateTokens(user, c.env);

    return c.json({
      message: 'Token refresh successful',
      tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Invalid or expired refresh token' }, 401);
  }
});

// POST /auth/logout
auth.post('/logout', async (c) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing tokens. However, we can log the event for analytics.
  
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verify(token, c.env.JWT_SECRET);
      
      // Log logout event
      c.env.ANALYTICS?.writeDataPoint({
        blobs: [payload.email as string, 'logout'],
        doubles: [Date.now()],
        indexes: ['user_events']
      });
    }
  } catch (error) {
    // Token might be invalid, but that's okay for logout
    console.warn('Logout with invalid token:', error);
  }

  return c.json({ message: 'Logout successful' });
});

// GET /auth/me - Get current user info
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);

    const userRepo = new UserRepository(c.env);
    const user = await userRepo.findById(payload.userId as string);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});

// POST /auth/forgot-password
auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');

    const userRepo = new UserRepository(c.env);
    const user = await userRepo.findByEmail(email);

    if (!user) {
      // Don't reveal whether user exists, but return success anyway
      return c.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate password reset token (valid for 1 hour)
    const resetToken = await sign(
      {
        userId: user.id,
        email: user.email,
        type: 'password_reset',
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      c.env.JWT_SECRET
    );

    // Store token in KV for security (allows invalidation)
    await c.env.CACHE.put(
      `reset_token_${user.id}`,
      resetToken,
      { expirationTtl: 3600 } // 1 hour
    );

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, integrate with Resend)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return c.json({ 
      message: 'If the email exists, a reset link has been sent',
      // Remove this in production:
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /auth/reset-password
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const { token, newPassword } = c.req.valid('json');

    // Verify reset token
    const payload = await verify(token, c.env.JWT_SECRET);
    
    if (payload.type !== 'password_reset') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    const userId = payload.userId as string;

    // Check if token exists in KV (hasn't been invalidated)
    const storedToken = await c.env.CACHE.get(`reset_token_${userId}`);
    if (!storedToken || storedToken !== token) {
      return c.json({ error: 'Invalid or expired reset token' }, 401);
    }

    const userRepo = new UserRepository(c.env);
    const user = await userRepo.findById(userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await userRepo.updateUser(userId, { 
      password_hash: passwordHash,
      updated_at: Date.now()
    });

    // Invalidate reset token
    await c.env.CACHE.delete(`reset_token_${userId}`);

    // Log password reset event
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [user.email, 'password_reset'],
      doubles: [Date.now()],
      indexes: ['user_events']
    });

    return c.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Invalid or expired reset token' }, 401);
  }
});

// GET /auth/validate - Validate current token
auth.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);

    return c.json({ 
      valid: true,
      payload: {
        userId: payload.userId,
        email: payload.email,
        subscriptionType: payload.subscriptionType,
        isStudent: payload.isStudent,
        preferredLanguage: payload.preferredLanguage,
        exp: payload.exp
      }
    });

  } catch (error) {
    return c.json({ 
      valid: false,
      error: 'Invalid or expired token'
    }, 401);
  }
});

export default auth;