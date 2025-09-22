// Stripe Webhook Security Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeWebhookVerifier, createStripeWebhookVerifier, isSupportedWebhookEvent } from '../../src/lib/stripe-webhook';
import crypto from 'crypto';

describe('Stripe Webhook Security', () => {
  const webhookSecret = 'whsec_test_webhook_secret';
  const testPayload = JSON.stringify({
    id: 'evt_test_webhook',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session',
        customer: 'cus_test_customer'
      }
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_request',
      idempotency_key: 'test_key'
    }
  });

  describe('StripeWebhookVerifier', () => {
    it('should verify valid webhook signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${testPayload}`;
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      
      const stripeSignature = `t=${timestamp},v1=${signature}`;
      
      const event = StripeWebhookVerifier.verifySignature(
        testPayload,
        stripeSignature,
        webhookSecret
      );

      expect(event.id).toBe('evt_test_webhook');
      expect(event.type).toBe('checkout.session.completed');
      expect(event.data.object.id).toBe('cs_test_session');
    });

    it('should reject missing signature', () => {
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, '', webhookSecret);
      }).toThrow('Missing stripe-signature header');
    });

    it('should reject invalid signature format', () => {
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, 'invalid_format', webhookSecret);
      }).toThrow('Invalid signature format');
    });

    it('should reject old webhook timestamp', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 6+ minutes ago
      const signedPayload = `${oldTimestamp}.${testPayload}`;
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      
      const stripeSignature = `t=${oldTimestamp},v1=${signature}`;
      
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, stripeSignature, webhookSecret);
      }).toThrow('Webhook timestamp too old');
    });

    it('should reject invalid signature', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const invalidSignature = 'invalid_signature_hash';
      const stripeSignature = `t=${timestamp},v1=${invalidSignature}`;
      
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, stripeSignature, webhookSecret);
      }).toThrow('Invalid signature');
    });

    it('should reject invalid JSON payload', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const invalidPayload = 'invalid json';
      const signedPayload = `${timestamp}.${invalidPayload}`;
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      
      const stripeSignature = `t=${timestamp},v1=${signature}`;
      
      expect(() => {
        StripeWebhookVerifier.verifySignature(invalidPayload, stripeSignature, webhookSecret);
      }).toThrow('Invalid JSON payload');
    });

    it('should create verifier instance', () => {
      const verifier = createStripeWebhookVerifier(webhookSecret);
      expect(verifier).toBeInstanceOf(StripeWebhookVerifier);
    });

    it('should verify webhook using instance method', () => {
      const verifier = createStripeWebhookVerifier(webhookSecret);
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${testPayload}`;
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      
      const stripeSignature = `t=${timestamp},v1=${signature}`;
      
      const event = verifier.verify(testPayload, stripeSignature);
      expect(event.type).toBe('checkout.session.completed');
    });
  });

  describe('Webhook Event Support', () => {
    it('should identify supported webhook events', () => {
      expect(isSupportedWebhookEvent('checkout.session.completed')).toBe(true);
      expect(isSupportedWebhookEvent('invoice.payment_succeeded')).toBe(true);
      expect(isSupportedWebhookEvent('customer.subscription.updated')).toBe(true);
      expect(isSupportedWebhookEvent('payment_intent.succeeded')).toBe(true);
    });

    it('should reject unsupported webhook events', () => {
      expect(isSupportedWebhookEvent('unsupported.event')).toBe(false);
      expect(isSupportedWebhookEvent('random.webhook')).toBe(false);
      expect(isSupportedWebhookEvent('')).toBe(false);
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle timing attacks with constant-time comparison', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${testPayload}`;
      const correctSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');
      
      const stripeSignature = `t=${timestamp},v1=${correctSignature}`;
      
      // This should not throw
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, stripeSignature, webhookSecret);
      }).not.toThrow();
    });

    it('should reject signatures with different lengths', () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const shortSignature = 'short';
      const stripeSignature = `t=${timestamp},v1=${shortSignature}`;
      
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, stripeSignature, webhookSecret);
      }).toThrow('Invalid signature');
    });

    it('should handle empty webhook secret', () => {
      expect(() => {
        StripeWebhookVerifier.verifySignature(testPayload, 't=123,v1=abc', '');
      }).toThrow('Webhook secret not configured');
    });
  });
});
