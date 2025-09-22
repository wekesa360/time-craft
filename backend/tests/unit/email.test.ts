// Email Service Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService, createEmailService } from '../../src/lib/email';
import { createMockEnv } from '../utils/test-helpers';

// Mock fetch globally
global.fetch = vi.fn();

describe('Email Service', () => {
  let emailService: EmailService;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    emailService = createEmailService(mockEnv);
    vi.clearAllMocks();
  });

  describe('EmailService', () => {
    it('should create email service with valid API key', () => {
      expect(emailService).toBeInstanceOf(EmailService);
    });

    it('should throw error when API key is missing', () => {
      const invalidEnv = { ...mockEnv, RESEND_API_KEY: undefined };
      expect(() => createEmailService(invalidEnv)).toThrow('RESEND_API_KEY is required');
    });

    it('should send verification OTP email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'email_123' })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await emailService.sendVerificationOTP('test@example.com', '123456', 'en');

      expect(result.success).toBe(true);
      expect(result.id).toBe('email_123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer re_test_resend_key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('123456')
        })
      );
    });

    it('should send password reset email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'email_456' })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await emailService.sendPasswordReset(
        'test@example.com', 
        'https://timecraft.app/reset?token=abc123', 
        'en'
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe('email_456');
    });

    it('should send welcome email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'email_789' })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await emailService.sendWelcomeEmail('test@example.com', 'John', 'en');

      expect(result.success).toBe(true);
      expect(result.id).toBe('email_789');
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid email address' })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await emailService.sendVerificationOTP('invalid-email', '123456', 'en');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Resend API error');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await emailService.sendVerificationOTP('test@example.com', '123456', 'en');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should use German templates when language is de', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'email_de' })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await emailService.sendVerificationOTP('test@example.com', '123456', 'de');

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.subject).toContain('Bestätigen Sie Ihr TimeCraft-Konto');
      expect(body.html).toContain('Konto bestätigen');
    });

    it('should include proper tags in email requests', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ id: 'email_tagged' })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await emailService.sendVerificationOTP('test@example.com', '123456', 'en');

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.tags).toEqual([
        { name: 'type', value: 'verification_otp' },
        { name: 'language', value: 'en' }
      ]);
    });
  });
});
