// Student Verification API Worker
// Handles email OTP verification, admin approval, and student pricing

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { StudentVerificationServiceImpl } from '../lib/student-verification';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://timeandwellness.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
}));

// Validation schemas
const sendOTPSchema = z.object({
  email: z.string().email()
});

const verifyOTPSchema = z.object({
  otpId: z.string().uuid(),
  otpCode: z.string().length(6).regex(/^\d{6}$/)
});

const documentVerificationSchema = z.object({
  documents: z.array(z.object({
    type: z.enum(['student_id', 'enrollment_letter', 'transcript', 'other']),
    filename: z.string(),
    url: z.string().url(),
    description: z.string().optional()
  }))
});

const adminActionSchema = z.object({
  adminNotes: z.string().min(1).max(500)
});

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const adminKey = c.req.header('X-Admin-Key');
  const expectedKey = c.env.ADMIN_API_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return c.json({
      success: false,
      error: 'Admin access required'
    }, 403);
  }

  await next();
};

// Public Routes (no auth required)

// Get student pricing information
app.get('/pricing', optionalAuth, async (c) => {
  try {
    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const pricing = await studentService.getStudentPricing();

    return c.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pricing'
    }, 500);
  }
});

// User Routes (auth required)
app.use('/user/*', authenticateUser);

// Send OTP for email verification
app.post('/user/send-otp', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();
    const { email } = sendOTPSchema.parse(body);

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const result = await studentService.sendVerificationOTP(userId, email);

    return c.json({
      success: true,
      data: {
        otpId: result.otpId,
        expiresAt: result.expiresAt,
        message: 'OTP sent to your email address'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP'
    }, 400);
  }
});

// Verify OTP
app.post('/user/verify-otp', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();
    const { otpId, otpCode } = verifyOTPSchema.parse(body);

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const success = await studentService.verifyOTP(userId, otpId, otpCode);

    if (!success) {
      return c.json({
        success: false,
        error: 'Invalid OTP code'
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Email verified successfully! Student status approved.'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP'
    }, 400);
  }
});

// Submit document verification
app.post('/user/submit-documents', async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();
    const { documents } = documentVerificationSchema.parse(body);

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const verification = await studentService.submitDocumentVerification(userId, documents);

    return c.json({
      success: true,
      data: verification,
      message: 'Documents submitted for review. You will be notified once approved.'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit documents'
    }, 400);
  }
});

// Get user verification status
app.get('/user/status', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const verification = await studentService.getUserVerificationStatus(userId);

    return c.json({
      success: true,
      data: verification
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get verification status'
    }, 500);
  }
});

// Validate student discount eligibility
app.get('/user/validate-discount', async (c) => {
  try {
    const userId = c.get('userId') as string;

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const isValid = await studentService.validateStudentDiscount(userId);

    return c.json({
      success: true,
      data: {
        isValid,
        message: isValid ? 'Student discount is valid' : 'Student discount not available'
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate discount'
    }, 500);
  }
});

// Admin Routes (admin key required)
app.use('/admin/*', adminMiddleware);

// Get pending verifications
app.get('/admin/pending', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const verifications = await studentService.getPendingVerifications(limit);

    return c.json({
      success: true,
      data: verifications
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending verifications'
    }, 500);
  }
});

// Approve verification
app.post('/admin/:verificationId/approve', async (c) => {
  try {
    const verificationId = c.req.param('verificationId');
    const body = await c.req.json();
    const { adminNotes } = adminActionSchema.parse(body);

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const success = await studentService.approveVerification(verificationId, adminNotes);

    if (!success) {
      return c.json({
        success: false,
        error: 'Verification not found or already processed'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Verification approved successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve verification'
    }, 400);
  }
});

// Reject verification
app.post('/admin/:verificationId/reject', async (c) => {
  try {
    const verificationId = c.req.param('verificationId');
    const body = await c.req.json();
    const { adminNotes } = adminActionSchema.parse(body);

    const studentService = new StudentVerificationServiceImpl(c.env.DB);
    const success = await studentService.rejectVerification(verificationId, adminNotes);

    if (!success) {
      return c.json({
        success: false,
        error: 'Verification not found or already processed'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Verification rejected'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject verification'
    }, 400);
  }
});

// Get verification statistics
app.get('/admin/stats', async (c) => {
  try {
    const db = c.env.DB;

    // Get verification statistics
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_verifications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN verification_type = 'email' THEN 1 ELSE 0 END) as email_verifications,
        SUM(CASE WHEN verification_type = 'document' THEN 1 ELSE 0 END) as document_verifications
      FROM student_verifications
    `).first();

    // Get student user statistics
    const userStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_student = true THEN 1 ELSE 0 END) as student_users,
        SUM(CASE WHEN subscription_type = 'student' THEN 1 ELSE 0 END) as active_student_subscriptions
      FROM users
    `).first();

    return c.json({
      success: true,
      data: {
        verifications: stats,
        users: userStats
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    }, 500);
  }
});

export default app;