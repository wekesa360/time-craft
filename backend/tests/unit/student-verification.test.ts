// Student Verification Tests
// Comprehensive test suite for email OTP verification, admin approval, and student pricing

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudentVerificationServiceImpl } from '../../src/lib/student-verification';

// Mock D1Database
const mockDb = {
  prepare: vi.fn(),
  exec: vi.fn(),
  batch: vi.fn(),
  dump: vi.fn()
};

const mockStatement = {
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn(),
  raw: vi.fn()
};

describe('StudentVerificationService', () => {
  let studentService: StudentVerificationServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue(mockStatement);
    studentService = new StudentVerificationServiceImpl(mockDb as any);
  });

  describe('Email OTP Verification', () => {
    it('should send OTP for valid educational email', async () => {
      const userId = 'user1';
      const email = 'student@university.edu';

      mockStatement.run.mockResolvedValue({ changes: 1 });

      const result = await studentService.sendVerificationOTP(userId, email);

      expect(result).toHaveProperty('otpId');
      expect(result).toHaveProperty('expiresAt');
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(mockDb.prepare).toHaveBeenCalledTimes(3); // CREATE TABLE, DELETE expired, INSERT new
    });

    it('should reject non-educational email domains', async () => {
      const userId = 'user1';
      const email = 'student@gmail.com';

      await expect(
        studentService.sendVerificationOTP(userId, email)
      ).rejects.toThrow('Email must be from a recognized educational institution');
    });

    it('should accept various educational domains', async () => {
      const userId = 'user1';
      const educationalEmails = [
        'student@harvard.edu',
        'student@oxford.ac.uk',
        'student@sydney.edu.au',
        'student@kth.se'
      ];

      mockStatement.run.mockResolvedValue({ changes: 1 });

      for (const email of educationalEmails) {
        const result = await studentService.sendVerificationOTP(userId, email);
        expect(result).toHaveProperty('otpId');
      }
    });

    it('should verify OTP successfully', async () => {
      const userId = 'user1';
      const otpId = 'otp1';
      const otpCode = '123456';

      // Mock valid OTP record
      mockStatement.first.mockResolvedValueOnce({
        id: otpId,
        user_id: userId,
        email: 'student@university.edu',
        otp_code: otpCode,
        expires_at: Date.now() + 900000,
        attempts: 0,
        verified: false
      });

      mockStatement.run.mockResolvedValue({ changes: 1 });

      const result = await studentService.verifyOTP(userId, otpId, otpCode);

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledTimes(5); // SELECT, UPDATE attempts, UPDATE verified, INSERT verification, UPDATE user
    });

    it('should reject invalid OTP code', async () => {
      const userId = 'user1';
      const otpId = 'otp1';
      const wrongCode = '654321';

      // Mock valid OTP record with different code
      mockStatement.first.mockResolvedValueOnce({
        id: otpId,
        user_id: userId,
        email: 'student@university.edu',
        otp_code: '123456',
        expires_at: Date.now() + 900000,
        attempts: 0,
        verified: false
      });

      mockStatement.run.mockResolvedValue({ changes: 1 });

      const result = await studentService.verifyOTP(userId, otpId, wrongCode);

      expect(result).toBe(false);
    });

    it('should reject expired OTP', async () => {
      const userId = 'user1';
      const otpId = 'otp1';
      const otpCode = '123456';

      // Mock no OTP found (expired)
      mockStatement.first.mockResolvedValueOnce(null);

      await expect(
        studentService.verifyOTP(userId, otpId, otpCode)
      ).rejects.toThrow('Invalid or expired OTP');
    });

    it('should reject OTP after too many attempts', async () => {
      const userId = 'user1';
      const otpId = 'otp1';
      const otpCode = '123456';

      // Mock OTP with too many attempts
      mockStatement.first.mockResolvedValueOnce({
        id: otpId,
        user_id: userId,
        email: 'student@university.edu',
        otp_code: otpCode,
        expires_at: Date.now() + 900000,
        attempts: 3,
        verified: false
      });

      await expect(
        studentService.verifyOTP(userId, otpId, otpCode)
      ).rejects.toThrow('Too many failed attempts. Please request a new OTP.');
    });
  });

  describe('Document Verification', () => {
    it('should submit document verification successfully', async () => {
      const userId = 'user1';
      const documents = [
        {
          type: 'student_id',
          filename: 'student_id.jpg',
          url: 'https://example.com/student_id.jpg',
          description: 'Student ID card'
        }
      ];

      mockStatement.run.mockResolvedValue({ changes: 1 });

      const result = await studentService.submitDocumentVerification(userId, documents);

      expect(result).toMatchObject({
        user_id: userId,
        verification_type: 'document',
        status: 'pending',
        submitted_documents: documents
      });
    });
  });

  describe('Admin Approval Process', () => {
    it('should get pending verifications', async () => {
      const mockVerifications = [
        {
          id: 'v1',
          user_id: 'user1',
          status: 'pending',
          email: 'student1@university.edu'
        },
        {
          id: 'v2',
          user_id: 'user2',
          status: 'pending',
          email: 'student2@college.edu'
        }
      ];

      mockStatement.all.mockResolvedValueOnce({ results: mockVerifications });

      const result = await studentService.getPendingVerifications(50);

      expect(result).toEqual(mockVerifications);
      expect(mockStatement.bind).toHaveBeenCalledWith(50);
    });

    it('should approve verification successfully', async () => {
      const verificationId = 'v1';
      const adminNotes = 'Approved after document review';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });
      mockStatement.first.mockResolvedValueOnce({ user_id: 'user1' });
      mockStatement.run.mockResolvedValueOnce({ changes: 1 }); // Update user status

      const result = await studentService.approveVerification(verificationId, adminNotes);

      expect(result).toBe(true);
    });

    it('should reject verification successfully', async () => {
      const verificationId = 'v1';
      const adminNotes = 'Documents are not clear enough';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });
      mockStatement.first.mockResolvedValueOnce({ user_id: 'user1' });
      mockStatement.run.mockResolvedValueOnce({ changes: 1 }); // Update user status

      const result = await studentService.rejectVerification(verificationId, adminNotes);

      expect(result).toBe(true);
    });

    it('should return false if verification not found', async () => {
      const verificationId = 'nonexistent';
      const adminNotes = 'Test notes';

      mockStatement.run.mockResolvedValueOnce({ changes: 0 });

      const result = await studentService.approveVerification(verificationId, adminNotes);

      expect(result).toBe(false);
    });
  });

  describe('Student Status Management', () => {
    it('should get user verification status', async () => {
      const userId = 'user1';
      const mockVerification = {
        id: 'v1',
        user_id: userId,
        status: 'approved',
        verification_type: 'email'
      };

      mockStatement.first.mockResolvedValueOnce(mockVerification);

      const result = await studentService.getUserVerificationStatus(userId);

      expect(result).toEqual(mockVerification);
    });

    it('should return null if no verification found', async () => {
      const userId = 'user1';

      mockStatement.first.mockResolvedValueOnce(null);

      const result = await studentService.getUserVerificationStatus(userId);

      expect(result).toBeNull();
    });

    it('should update user student status', async () => {
      const userId = 'user1';
      const isStudent = true;
      const status = 'approved';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      const result = await studentService.updateUserStudentStatus(userId, isStudent, status);

      expect(result).toBe(true);
      expect(mockStatement.bind).toHaveBeenCalledWith(isStudent, status, 'student', userId);
    });

    it('should set subscription to free for non-approved students', async () => {
      const userId = 'user1';
      const isStudent = false;
      const status = 'rejected';

      mockStatement.run.mockResolvedValueOnce({ changes: 1 });

      await studentService.updateUserStudentStatus(userId, isStudent, status);

      expect(mockStatement.bind).toHaveBeenCalledWith(isStudent, status, 'free', userId);
    });
  });

  describe('Pricing Tiers', () => {
    it('should return correct student pricing', async () => {
      const result = await studentService.getStudentPricing();

      expect(result).toEqual({
        standard: 9.99,
        student: 4.99,
        discount: 50
      });
    });

    it('should validate student discount for approved student', async () => {
      const userId = 'user1';

      // Mock approved student user
      mockStatement.first.mockResolvedValueOnce({
        is_student: true,
        student_verification_status: 'approved'
      });

      // Mock valid verification
      mockStatement.first.mockResolvedValueOnce({
        expires_at: Date.now() + 86400000 // 1 day from now
      });

      const result = await studentService.validateStudentDiscount(userId);

      expect(result).toBe(true);
    });

    it('should reject student discount for non-student', async () => {
      const userId = 'user1';

      // Mock non-student user
      mockStatement.first.mockResolvedValueOnce({
        is_student: false,
        student_verification_status: 'none'
      });

      const result = await studentService.validateStudentDiscount(userId);

      expect(result).toBe(false);
    });

    it('should reject student discount for expired verification', async () => {
      const userId = 'user1';

      // Mock approved student user
      mockStatement.first.mockResolvedValueOnce({
        is_student: true,
        student_verification_status: 'approved'
      });

      // Mock expired verification
      mockStatement.first.mockResolvedValueOnce({
        expires_at: Date.now() - 86400000 // 1 day ago
      });

      const result = await studentService.validateStudentDiscount(userId);

      expect(result).toBe(false);
    });

    it('should reject student discount for pending verification', async () => {
      const userId = 'user1';

      // Mock pending student user
      mockStatement.first.mockResolvedValueOnce({
        is_student: false,
        student_verification_status: 'pending'
      });

      const result = await studentService.validateStudentDiscount(userId);

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockStatement.run.mockRejectedValueOnce(error);

      await expect(
        studentService.sendVerificationOTP('user1', 'student@university.edu')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle missing user gracefully', async () => {
      const userId = 'nonexistent';

      mockStatement.first.mockResolvedValueOnce(null);

      const result = await studentService.validateStudentDiscount(userId);

      expect(result).toBe(false);
    });
  });
});