import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { cors } from 'hono/cors';
import { generateId } from '../utils/id';
import { createEmailService } from '../lib/email';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Validation schemas
const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address')
});

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address'),
  otpCode: z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits')
});

// Send OTP for login
app.post('/send-otp', zValidator('json', sendOTPSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');
    
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = generateId('otp');
    const now = Date.now();
    const expiresAt = now + (10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await c.env.DB.prepare(`
      INSERT INTO email_otps (id, user_id, email, otp_code, expires_at, attempts, verified, created_at, type)
      VALUES (?, ?, ?, ?, ?, 0, false, ?, 'login')
    `).bind(otpId, null, email, otpCode, expiresAt, now).run();

    // Send email with OTP
    try {
      const emailService = createEmailService(c.env);
      await emailService.sendLoginOTP(email, otpCode, 'en');
    } catch (error) {
      console.error('Failed to send login OTP email:', error);
      // Don't fail the OTP creation if email fails
    }

    // Log OTP for development
    console.log(`Login OTP for ${email}: ${otpCode} (expires at ${new Date(expiresAt)})`);

    return c.json({
      success: true,
      message: 'OTP sent to your email address',
      data: {
        otpId,
        expiresAt,
        email
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return c.json({
      success: false,
      error: `Failed to send OTP. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Verify OTP and login
app.post('/verify-otp', zValidator('json', verifyOTPSchema), async (c) => {
  try {
    const { email, otpCode } = c.req.valid('json');
    const now = Date.now();

    // Find valid OTP
    const otpResult = await c.env.DB.prepare(`
      SELECT id, otp_code, expires_at, attempts, verified
      FROM email_otps 
      WHERE email = ? AND type = 'login' AND verified = false AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(email, now).first();

    if (!otpResult) {
      return c.json({
        success: false,
        error: 'Invalid or expired OTP. Please request a new one.'
      }, 400);
    }

    // Check attempts
    if (otpResult.attempts >= 3) {
      return c.json({
        success: false,
        error: 'Too many failed attempts. Please request a new OTP.'
      }, 400);
    }

    // Verify OTP code
    if (otpResult.otp_code !== otpCode) {
      // Increment attempts
      await c.env.DB.prepare(`
        UPDATE email_otps 
        SET attempts = attempts + 1 
        WHERE id = ?
      `).bind(otpResult.id).run();

      return c.json({
        success: false,
        error: 'Invalid OTP code. Please try again.'
      }, 400);
    }

    // Mark OTP as verified
    await c.env.DB.prepare(`
      UPDATE email_otps 
      SET verified = true 
      WHERE id = ?
    `).bind(otpResult.id).run();

    // Check if user exists, if not create one
    let user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first();

    if (!user) {
      // Create new user
      const userId = generateId('user');
      const now = Date.now();
      
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, name, email_verified, created_at, updated_at, subscription_type, preferred_language)
        VALUES (?, ?, ?, true, ?, ?, 'free', 'en')
      `).bind(userId, email, email.split('@')[0], now, now).run();

      user = await c.env.DB.prepare(`
        SELECT * FROM users WHERE id = ?
      `).bind(userId).first();
    }

    // Generate JWT tokens
    const { sign } = await import('hono/jwt');
    
    const accessToken = await sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionType: user.subscription_type || 'free',
        isStudent: user.is_student || false,
        preferredLanguage: user.preferred_language || 'en',
        type: 'access'
      },
      c.env.JWT_SECRET,
      'HS256'
    );

    const refreshToken = await sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionType: user.subscription_type || 'free',
        isStudent: user.is_student || false,
        preferredLanguage: user.preferred_language || 'en',
        type: 'refresh'
      },
      c.env.REFRESH_SECRET,
      'HS256'
    );

    // Store refresh token
    await c.env.CACHE.put(
      `refresh_token_${user.id}`,
      refreshToken,
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // Clean up old OTPs
    await c.env.DB.prepare(`
      DELETE FROM email_otps 
      WHERE email = ? AND type = 'login' AND expires_at < ?
    `).bind(email, now).run();

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          email_verified: user.email_verified,
          subscription_type: user.subscription_type,
          preferred_language: user.preferred_language
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return c.json({
      success: false,
      error: 'Failed to verify OTP. Please try again.'
    }, 500);
  }
});

export default app;
