// Payments and Subscription Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData,
  mockExternalAPIs
} from '../utils/test-helpers';

describe('Payments and Subscription API', () => {
  let env: any;
  let app: any;
  let userToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM subscriptions WHERE user_id = ?', []);
    
    // Mock Stripe API
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanupTestData(env);
    vi.clearAllMocks();
  });

  describe('Subscription Management', () => {
    describe('GET /subscription', () => {
      it('should get user subscription status', async () => {
        const mockSubscription = {
          id: 'sub_123',
          user_id: testUsers.regularUser.id,
          stripe_subscription_id: 'stripe_sub_123',
          status: 'active',
          plan: 'premium',
          current_period_end: Date.now() + 2592000000, // 30 days
          created_at: Date.now() - 86400000
        };

        env.DB._setMockData('SELECT * FROM subscriptions WHERE user_id = ?', [mockSubscription]);

        const response = await makeRequest(app, 'GET', '/api/payments/subscription', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          subscription: {
            id: mockSubscription.id,
            status: mockSubscription.status,
            plan: mockSubscription.plan,
            currentPeriodEnd: expect.any(Number),
            isActive: true
          }
        });
      });

      it('should handle user with no subscription', async () => {
        const response = await makeRequest(app, 'GET', '/api/payments/subscription', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          subscription: null,
          availablePlans: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              price: expect.any(Number),
              features: expect.any(Array)
            })
          ])
        });
      });
    });

    describe('POST /subscription/create', () => {
      it('should create subscription checkout session', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.stripe.checkoutSession
        });

        const planData = {
          planId: 'premium',
          billingCycle: 'monthly'
        };

        const response = await makeRequest(app, 'POST', '/api/payments/subscription/create', {
          token: userToken,
          body: planData
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          sessionId: expect.any(String),
          checkoutUrl: expect.any(String)
        });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('checkout/sessions'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer sk_test_')
            })
          })
        );
      });

      it('should reject invalid plan ID', async () => {
        const response = await makeRequest(app, 'POST', '/api/payments/subscription/create', {
          token: userToken,
          body: { planId: 'invalid_plan' }
        });

        await expectValidationError(response, 'planId');
      });
    });

    describe('POST /subscription/cancel', () => {
      it('should cancel active subscription', async () => {
        const mockSubscription = {
          id: 'sub_123',
          user_id: testUsers.regularUser.id,
          stripe_subscription_id: 'stripe_sub_123',
          status: 'active'
        };

        env.DB._setMockData('SELECT * FROM subscriptions WHERE user_id = ?', [mockSubscription]);
        
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'stripe_sub_123',
            status: 'canceled',
            cancel_at_period_end: true
          })
        });

        const response = await makeRequest(app, 'POST', '/api/payments/subscription/cancel', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('cancelled');
        expect(body.subscription.status).toBe('cancelled');
      });

      it('should reject canceling non-existent subscription', async () => {
        const response = await makeRequest(app, 'POST', '/api/payments/subscription/cancel', {
          token: userToken
        ,
          env: env
        });

        expectErrorResponse(response, 404, 'No active subscription');
      });
    });
  });

  describe('Payment Methods', () => {
    describe('GET /payment-methods', () => {
      it('should get user payment methods', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.stripe.paymentMethods
        });

        const response = await makeRequest(app, 'GET', '/api/payments/payment-methods', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          paymentMethods: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              type: expect.any(String),
              last4: expect.any(String),
              expiryMonth: expect.any(Number),
              expiryYear: expect.any(Number)
            })
          ])
        });
      });
    });

    describe('POST /payment-methods', () => {
      it('should add new payment method', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.stripe.setupIntent
        });

        const response = await makeRequest(app, 'POST', '/api/payments/payment-methods', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          clientSecret: expect.any(String),
          setupIntentId: expect.any(String)
        });
      });
    });

    describe('DELETE /payment-methods/:id', () => {
      it('should remove payment method', async () => {
        const paymentMethodId = 'pm_test_123';
        
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: paymentMethodId, object: 'payment_method' })
        });

        const response = await makeRequest(app, 'DELETE', '/payment-methods/${paymentMethodId}', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        expect(body.message).toContain('removed');
      });
    });
  });

  describe('Billing and Invoices', () => {
    describe('GET /billing/history', () => {
      it('should get billing history', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.stripe.invoices
        });

        const response = await makeRequest(app, 'GET', '/api/payments/billing/history', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          invoices: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              amount: expect.any(Number),
              status: expect.any(String),
              date: expect.any(Number),
              downloadUrl: expect.any(String)
            })
          ]),
          pagination: expect.objectContaining({
            hasMore: expect.any(Boolean)
          })
        });
      });
    });

    describe('GET /billing/upcoming', () => {
      it('should get upcoming invoice preview', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.stripe.upcomingInvoice
        });

        const response = await makeRequest(app, 'GET', '/api/payments/billing/upcoming', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          invoice: {
            amount: expect.any(Number),
            currency: expect.any(String),
            periodStart: expect.any(Number),
            periodEnd: expect.any(Number),
            lineItems: expect.any(Array)
          }
        });
      });
    });
  });

  describe('Webhooks', () => {
    describe('POST /webhooks/stripe', () => {
      it('should handle subscription created webhook', async () => {
        const webhookPayload = {
          id: 'evt_test_webhook',
          object: 'event',
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test_123',
              customer: 'cus_test_123',
              status: 'active',
              current_period_end: Date.now() + 2592000000,
              items: {
                data: [{ price: { id: 'price_premium_monthly' } }]
              }
            }
          }
        };

        env.DB._setMockData('SELECT * FROM users WHERE stripe_customer_id = ?', [testUsers.regularUser]);
        env.DB._setMockData('INSERT INTO subscriptions', [{ id: 'new_sub_id' }]);

        const response = await makeRequest(app, 'POST', '/api/payments/webhooks/stripe', {
          body: webhookPayload,
          headers: {
            'stripe-signature': 'test_signature'
          }
        });

        expectSuccessResponse(response);
      });

      it('should handle subscription cancelled webhook', async () => {
        const webhookPayload = {
          id: 'evt_test_webhook',
          object: 'event',
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_test_123',
              customer: 'cus_test_123',
              status: 'canceled'
            }
          }
        };

        const response = await makeRequest(app, 'POST', '/api/payments/webhooks/stripe', {
          body: webhookPayload,
          headers: {
            'stripe-signature': 'test_signature'
          }
        });

        expectSuccessResponse(response);
      });
    });
  });

  describe('Usage and Limits', () => {
    describe('GET /usage', () => {
      it('should get current usage stats', async () => {
        const mockUsage = {
          plan: 'premium',
          limits: {
            tasks: 1000,
            storage: 5368709120, // 5GB
            ai_requests: 500
          },
          current: {
            tasks: 45,
            storage: 1073741824, // 1GB
            ai_requests: 23
          }
        };

        env.DB._setMockData('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [{ count: mockUsage.current.tasks }]);
        env.DB._setMockData('SELECT SUM(size) as total FROM user_files WHERE user_id = ?', [{ total: mockUsage.current.storage }]);
        
        const response = await makeRequest(app, 'GET', '/api/payments/usage', {
          token: userToken
        ,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          plan: expect.any(String),
          limits: expect.objectContaining({
            tasks: expect.any(Number),
            storage: expect.any(Number)
          }),
          current: expect.objectContaining({
            tasks: expect.any(Number),
            storage: expect.any(Number)
          }),
          percentUsed: expect.objectContaining({
            tasks: expect.any(Number),
            storage: expect.any(Number)
          })
        });
      });
    });
  });

  describe('Security and Validation', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/subscription' },
        { method: 'POST', path: '/subscription/create' },
        { method: 'GET', path: '/payment-methods' },
        { method: 'GET', path: '/billing/history' },
        { method: 'GET', path: '/usage' }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, endpoint.method, endpoint.path);
        expectErrorResponse(response, 401);
      }
    });

    it('should validate Stripe webhook signatures', async () => {
      const response = await makeRequest(app, 'POST', '/api/payments/webhooks/stripe', {
        body: { type: 'test.event' },
        headers: { 'stripe-signature': 'invalid_signature' }
      });

      expectErrorResponse(response, 400, 'Invalid signature');
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API failures gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        json: async () => ({
          error: { message: 'Your card was declined.' }
        })
      });

      const response = await makeRequest(app, 'POST', '/api/payments/subscription/create', {
        token: userToken,
        body: { planId: 'premium' }
      });

      expectErrorResponse(response, 402, 'card was declined');
    });
  });

  describe('Performance', () => {
    it('should respond quickly to subscription status requests', async () => {
      const start = Date.now();
      const response = await makeRequest(app, 'GET', '/api/payments/subscription', {
          token: userToken
      ,
          env: env
        });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(500);
    });
  });
});