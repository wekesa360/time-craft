// Student Verification Service
// Handles email OTP verification, admin approval, and student pricing

import { D1Database } from '@cloudflare/workers-types';
import { StudentVerification, User, StudentVerificationStatus } from '../types/database';

export interface StudentVerificationService {
  // Email OTP verification
  sendVerificationOTP(userId: string, email: string): Promise<{ otpId: string; expiresAt: number }>;
  verifyOTP(userId: string, otpId: string, otpCode: string): Promise<boolean>;
  
  // Document verification
  submitDocumentVerification(userId: string, documents: any[]): Promise<StudentVerification>;
  
  // Admin approval process
  getPendingVerifications(limit?: number): Promise<StudentVerification[]>;
  approveVerification(verificationId: string, adminNotes?: string): Promise<boolean>;
  rejectVerification(verificationId: string, adminNotes: string): Promise<boolean>;
  
  // Student status management
  getUserVerificationStatus(userId: string): Promise<StudentVerification | null>;
  updateUserStudentStatus(userId: string, isStudent: boolean, status: StudentVerificationStatus): Promise<boolean>;
  
  // Pricing tiers
  getStudentPricing(): Promise<{ standard: number; student: number; discount: number }>;
  validateStudentDiscount(userId: string): Promise<boolean>;
}

interface OTPRecord {
  id: string;
  user_id: string;
  email: string;
  otp_code: string;
  expires_at: number;
  attempts: number;
  verified: boolean;
  created_at: number;
}

export class StudentVerificationServiceImpl implements StudentVerificationService {
  constructor(private db: D1Database) {}

  async sendVerificationOTP(userId: string, email: string): Promise<{ otpId: string; expiresAt: number }> {
    // Check if email is from a valid educational domain
    const educationalDomains = [
      '.edu', '.ac.uk', '.edu.au', '.edu.ca', '.ac.nz', '.edu.sg',
      '.kit.edu', // German universities
      '.unimi.it', '.unibo.it', '.uniroma1.it', // Italian universities
      '.uu.se', '.kth.se', '.chalmers.se', // Swedish universities
      '.se', // Swedish domains (broader match)
    ];

    const educationalPrefixes = [
      'uni-', 'fh-', 'hs-', 'tu-', 'rwth-', // German universities
      'univ-', 'ens-', 'insa-', 'polytechnique.', // French universities
    ];

    const emailLower = email.toLowerCase();
    const domain = emailLower.split('@')[1] || '';
    
    const isEducationalEmail = educationalDomains.some(suffix => domain.endsWith(suffix)) ||
                              educationalPrefixes.some(prefix => domain.includes(prefix));

    if (!isEducationalEmail) {
      throw new Error('Email must be from a recognized educational institution');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + (15 * 60 * 1000); // 15 minutes

    // Store OTP in database (we'll create a temporary table for this)
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        otp_code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified BOOLEAN DEFAULT false,
        created_at INTEGER NOT NULL
      )
    `);

    // Clean up expired OTPs
    await this.db.execute(`
      DELETE FROM email_otps WHERE expires_at < ?
    `, [now]);

    // Insert new OTP
    await this.db.execute(`
      INSERT INTO email_otps (id, user_id, email, otp_code, expires_at, attempts, verified, created_at)
      VALUES (?, ?, ?, ?, ?, 0, false, ?)
    `, [otpId, userId, email, otpCode, expiresAt, now]);

    // Send email with OTP using Resend
    try {
      const { createEmailService } = await import('./email');
      const emailService = createEmailService(this.env);
      
      await emailService.sendVerificationOTP(email, otpCode, 'en');
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail the OTP creation if email fails
    }
    // For now, we'll log it (in production, this would be sent via email)
    console.log(`OTP for ${email}: ${otpCode} (expires at ${new Date(expiresAt)})`);

    return { otpId, expiresAt };
  }

  async verifyOTP(userId: string, otpId: string, otpCode: string): Promise<boolean> {
    const now = Date.now();

    // Get OTP record
    const otpRecord = await this.db.query(`
      SELECT * FROM email_otps 
      WHERE id = ? AND user_id = ? AND expires_at > ? AND verified = false
    `, [otpId, userId, now]) as OTPRecord | null;

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP');
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      throw new Error('Too many failed attempts. Please request a new OTP.');
    }

    // Increment attempts
    await this.db.execute(`
      UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?
    `, [otpId]);

    // Verify OTP code
    if (otpRecord.otp_code !== otpCode) {
      return (false.results || []);
    }

    // Mark as verified
    await this.db.execute(`
      UPDATE email_otps SET verified = true WHERE id = ?
    `, [otpId]);

    // Create student verification record
    const verificationId = crypto.randomUUID();
    await this.db.prepare(`
      INSERT INTO student_verifications (
        id, user_id, verification_type, status, submitted_documents, 
        admin_notes, verified_at, expires_at, created_at
      ) VALUES (?, ?, 'email', 'approved', ?, 'Email verified automatically', ?, ?, ?)
    `).bind(
      verificationId, 
      userId, 
      JSON.stringify([{ type: 'email', email: otpRecord.email, verified_at: now }]),
      now,
      now + (365 * 24 * 60 * 60 * 1000), // 1 year expiry
      now
    ).run();

    // Update user status
    await this.updateUserStudentStatus(userId, true, 'approved');

    return (true.results || []);
  }

  async submitDocumentVerification(userId: string, documents: any[]): Promise<StudentVerification> {
    const id = crypto.randomUUID();
    const now = Date.now();

    const verification: StudentVerification = {
      id,
      user_id: userId,
      verification_type: 'document',
      status: 'pending',
      submitted_documents: documents,
      admin_notes: null,
      verified_at: null,
      expires_at: null,
      created_at: now
    };

    await this.db.prepare(`
      INSERT INTO student_verifications (
        id, user_id, verification_type, status, submitted_documents, 
        admin_notes, verified_at, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, userId, 'document', 'pending', JSON.stringify(documents),
      null, null, null, now
    ).run();

    // Update user status to pending
    await this.updateUserStudentStatus(userId, false, 'pending');

    return (verification.results || []);
  }

  async getPendingVerifications(limit: number = 50): Promise<StudentVerification[]> {
    const result = await this.db.query(`
      SELECT sv.*, u.email, u.first_name, u.last_name
      FROM student_verifications sv
      JOIN users u ON sv.user_id = u.id
      WHERE sv.status = 'pending'
      ORDER BY sv.created_at ASC
      LIMIT ?
    `, [limit]);

    return result.results as StudentVerification[];
  }

  async approveVerification(verificationId: string, adminNotes?: string): Promise<boolean> {
    const now = Date.now();
    const expiresAt = now + (365 * 24 * 60 * 60 * 1000); // 1 year

    const result = await this.db.execute(`
      UPDATE student_verifications 
      SET status = 'approved', admin_notes = ?, verified_at = ?, expires_at = ?
      WHERE id = ? AND status = 'pending'
    `, [adminNotes || 'Approved by admin', now, expiresAt, verificationId]);

    if (result.changes > 0) {
      // Get user ID and update their status
      const verification = await this.db.query(`
        SELECT user_id FROM student_verifications WHERE id = ?
      `, [verificationId]) as { user_id: string } | null;

      if (verification) {
        await this.updateUserStudentStatus(verification.user_id, true, 'approved');
      }
    }

    return result.changes > 0;
  }

  async rejectVerification(verificationId: string, adminNotes: string): Promise<boolean> {
    const result = await this.db.execute(`
      UPDATE student_verifications 
      SET status = 'rejected', admin_notes = ?
      WHERE id = ? AND status = 'pending'
    `, [adminNotes, verificationId]);

    if (result.changes > 0) {
      // Get user ID and update their status
      const verification = await this.db.query(`
        SELECT user_id FROM student_verifications WHERE id = ?
      `, [verificationId]) as { user_id: string } | null;

      if (verification) {
        await this.updateUserStudentStatus(verification.user_id, false, 'rejected');
      }
    }

    return result.changes > 0;
  }

  async getUserVerificationStatus(userId: string): Promise<StudentVerification | null> {
    const result = await this.db.query(`
      SELECT * FROM student_verifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    return result as StudentVerification | null;
  }

  async updateUserStudentStatus(userId: string, isStudent: boolean, status: StudentVerificationStatus): Promise<boolean> {
    const subscriptionType = isStudent && status === 'approved' ? 'student' : 'free';
    
    const result = await this.db.execute(`
      UPDATE users 
      SET is_student = ?, student_verification_status = ?, subscription_type = ?
      WHERE id = ?
    `, [isStudent, status, subscriptionType, userId]);

    return result.changes > 0;
  }

  async getStudentPricing(): Promise<{ standard: number; student: number; discount: number }> {
    // Standard pricing in USD per month
    const standardPrice = 9.99;
    const studentPrice = 4.99;
    const discount = Math.round(((standardPrice - studentPrice) / standardPrice) * 100);

    return {
      standard: standardPrice,
      student: studentPrice,
      discount
    };
  }

  async validateStudentDiscount(userId: string): Promise<boolean> {
    const user = await this.db.query(`
      SELECT is_student, student_verification_status FROM users WHERE id = ?
    `, [userId]) as { is_student: boolean; student_verification_status: StudentVerificationStatus } | null;

    if (!user) {
      return (false.results || []);
    }

    // Check if student status is approved and not expired
    if (user.is_student && user.student_verification_status === 'approved') {
      const verification = await this.getUserVerificationStatus(userId);
      if (verification && verification.expires_at && verification.expires_at > Date.now()) {
        return (true.results || []);
      }
    }

    return (false.results || []);
  }
}