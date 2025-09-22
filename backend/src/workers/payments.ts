// Payment Processing Worker with Stripe Integration for Time & Wellness Application
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService, UserRepository } from '../lib/db';
import type { SupportedLanguage } from '../types/database';

const payments = new Hono<{ Bindings: Env }>();

// Stripe SDK would normally be imported, but we'll use fetch for Cloudflare Workers compatibility
// import Stripe from 'stripe';

// Payment and Subscription Types
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  currency: 'USD' | 'EUR' | 'GBP';
  interval: 'month' | 'year';
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

// Subscription plans definition
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: 'Basic Monthly',
    description: 'Essential features for personal productivity',
    price: 999, // $9.99
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited tasks',
      'Basic health tracking',
      'Priority support',
      'Export data'
    ],
    stripePriceId: 'price_basic_monthly', // Would be actual Stripe price ID
    isActive: true
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    description: 'Advanced features for power users',
    price: 1999, // $19.99
    currency: 'USD',
    interval: 'month',
    features: [
      'All Basic features',
      'AI-powered insights',
      'Advanced analytics',
      'Calendar integrations',
      'Voice transcription',
      'Custom badges',
      'Priority AI processing'
    ],
    stripePriceId: 'price_pro_monthly',
    isActive: true
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    description: 'Pro features with 2 months free',
    price: 19990, // $199.90 (10 months price)
    currency: 'USD',
    interval: 'year',
    features: [
      'All Pro features',
      '2 months free',
      'Annual planning sessions',
      'Premium support'
    ],
    stripePriceId: 'price_pro_yearly',
    isActive: true
  }
];

// Authentication middleware
const getUserFromToken = async (c: any): Promise<{ userId: string; language?: SupportedLanguage } | null> => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET);
    
    return { 
      userId: payload.userId as string,
      language: (payload.preferredLanguage as SupportedLanguage) || 'en'
    };
  } catch {
    return null;
  }
};

// Stripe API helper class
class StripeAPI {
  private apiKey: string;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<any> {
    const params = new URLSearchParams();
    params.append('email', email);
    if (name) params.append('name', name);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value);
      });
    }

    return this.request('/customers', {
      method: 'POST',
      body: params
    });
  }

  async createSubscription(customerId: string, priceId: string, metadata?: Record<string, string>): Promise<any> {
    const params = new URLSearchParams();
    params.append('customer', customerId);
    params.append('items[0][price]', priceId);
    params.append('payment_behavior', 'default_incomplete');
    params.append('payment_settings[save_default_payment_method]', 'on_subscription');
    params.append('expand[]', 'latest_invoice.payment_intent');
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value);
      });
    }

    return this.request('/subscriptions', {
      method: 'POST',
      body: params
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });
  }

  async retrieveSubscription(subscriptionId: string): Promise<any> {
    return this.request(`/subscriptions/${subscriptionId}`);
  }

  async createCheckoutSession(options: {
    priceId: string;
    customerId?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', options.priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', options.successUrl);
    params.append('cancel_url', options.cancelUrl);
    
    if (options.customerId) {
      params.append('customer', options.customerId);
    }
    
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value);
      });
    }

    return this.request('/checkout/sessions', {
      method: 'POST',
      body: params
    });
  }
}

// ========== SUBSCRIPTION PLANS ==========

// GET /payments/plans - Get available subscription plans
payments.get('/plans', async (c) => {
  return c.json({
    plans: SUBSCRIPTION_PLANS.filter(plan => plan.isActive).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features,
      pricePerMonth: plan.interval === 'year' ? Math.round(plan.price / 12) : plan.price
    }))
  });
});

// ========== SUBSCRIPTION MANAGEMENT ==========

// GET /payments/subscription - Get user's current subscription
payments.get('/subscription', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const subscription = await db.query(`
      SELECT * FROM user_subscriptions 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [auth.userId]);

    if (!subscription.results?.length) {
      return c.json({
        subscription: null,
        plan: null,
        status: 'free'
      });
    }

    const sub = subscription.results[0];
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.plan_id);

    return c.json({
      subscription: {
        id: sub.id,
        planId: sub.plan_id,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end
      },
      plan: plan ? {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: plan.features
      } : null,
      status: 'subscribed'
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// POST /payments/checkout - Create Stripe checkout session
const checkoutSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  successUrl: z.string().url('Valid success URL is required'),
  cancelUrl: z.string().url('Valid cancel URL is required')
});

payments.post('/checkout', zValidator('json', checkoutSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { planId, successUrl, cancelUrl } = c.req.valid('json');
    
    // Find the requested plan
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId && p.isActive);
    if (!plan || !plan.stripePriceId) {
      return c.json({ error: 'Invalid plan selected' }, 400);
    }

    // Check if user already has an active subscription
    const db = new DatabaseService(c.env);
    const existingSub = await db.query(`
      SELECT * FROM user_subscriptions 
      WHERE user_id = ? AND status = 'active'
    `, [auth.userId]);

    if (existingSub.results?.length) {
      return c.json({ error: 'User already has an active subscription' }, 400);
    }

    // Get or create Stripe customer
    const userRepo = new UserRepository(c.env);
    const user = await userRepo.findById(auth.userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const stripe = new StripeAPI(c.env.STRIPE_SECRET_KEY);
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.createCustomer(
        user.email,
        user.display_name,
        { userId: auth.userId }
      );
      customerId = customer.id;

      // Update user with customer ID
      await userRepo.updateUser(auth.userId, {
        stripe_customer_id: customerId
      });
    }

    // Create checkout session
    const session = await stripe.createCheckoutSession({
      priceId: plan.stripePriceId,
      customerId,
      successUrl,
      cancelUrl,
      metadata: {
        userId: auth.userId,
        planId: plan.id
      }
    });

    return c.json({
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

// POST /payments/cancel - Cancel user's subscription
payments.post('/cancel', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const subscription = await db.query(`
      SELECT * FROM user_subscriptions 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [auth.userId]);

    if (!subscription.results?.length) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    const sub = subscription.results[0];
    const stripe = new StripeAPI(c.env.STRIPE_SECRET_KEY);

    // Cancel the Stripe subscription
    await stripe.cancelSubscription(sub.stripe_subscription_id);

    // Update local subscription record
    await db.query(`
      UPDATE user_subscriptions 
      SET status = 'canceled', cancel_at_period_end = true, updated_at = ?
      WHERE id = ?
    `, [Date.now(), sub.id]);

    return c.json({
      message: 'Subscription canceled successfully',
      canceledAt: Date.now(),
      activeUntil: sub.current_period_end
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

// ========== WEBHOOKS ==========

// POST /payments/webhook - Stripe webhook handler
payments.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json({ error: 'Missing signature' }, 400);
    }

    const body = await c.req.text();
    const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return c.json({ error: 'Webhook secret not configured' }, 500);
    }

    // Verify webhook signature for security
    const { createStripeWebhookVerifier, isSupportedWebhookEvent } = await import('../lib/stripe-webhook');
    const verifier = createStripeWebhookVerifier(webhookSecret);
    
    let event;
    try {
      event = verifier.verify(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return c.json({ error: 'Invalid signature' }, 400);
    }

    // Check if we support this event type
    if (!isSupportedWebhookEvent(event.type)) {
      console.log(`Unsupported webhook event type: ${event.type}`);
      return c.json({ received: true });
    }

    console.log('Received verified Stripe webhook:', event.type);

    const db = new DatabaseService(c.env);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(db, event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(db, event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(db, event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(db, event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(db, event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// Webhook event handlers
async function handleCheckoutCompleted(db: DatabaseService, session: any): Promise<void> {
  const { customer, subscription: stripeSubscriptionId, metadata } = session;
  const { userId, planId } = metadata || {};

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Create subscription record
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.query(`
    INSERT INTO user_subscriptions (
      id, user_id, plan_id, stripe_subscription_id, stripe_customer_id,
      status, current_period_start, current_period_end, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    subscriptionId,
    userId,
    planId,
    stripeSubscriptionId,
    customer,
    'active',
    Date.now(),
    Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now (approximate)
    Date.now(),
    Date.now()
  ]);

  // Update user subscription status
  await db.query(`
    UPDATE users 
    SET subscription_status = 'active', updated_at = ?
    WHERE id = ?
  `, [Date.now(), userId]);
}

async function handlePaymentSucceeded(db: DatabaseService, invoice: any): Promise<void> {
  const { customer, subscription: stripeSubscriptionId } = invoice;

  // Update subscription status
  await db.query(`
    UPDATE user_subscriptions 
    SET status = 'active', updated_at = ?
    WHERE stripe_subscription_id = ?
  `, [Date.now(), stripeSubscriptionId]);
}

async function handlePaymentFailed(db: DatabaseService, invoice: any): Promise<void> {
  const { customer, subscription: stripeSubscriptionId } = invoice;

  // Update subscription status
  await db.query(`
    UPDATE user_subscriptions 
    SET status = 'past_due', updated_at = ?
    WHERE stripe_subscription_id = ?
  `, [Date.now(), stripeSubscriptionId]);
}

async function handleSubscriptionUpdated(db: DatabaseService, subscription: any): Promise<void> {
  const { id: stripeSubscriptionId, status, current_period_start, current_period_end } = subscription;

  await db.query(`
    UPDATE user_subscriptions 
    SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = ?
    WHERE stripe_subscription_id = ?
  `, [
    status,
    current_period_start * 1000, // Convert to milliseconds
    current_period_end * 1000,
    Date.now(),
    stripeSubscriptionId
  ]);
}

async function handleSubscriptionDeleted(db: DatabaseService, subscription: any): Promise<void> {
  const { id: stripeSubscriptionId } = subscription;

  await db.query(`
    UPDATE user_subscriptions 
    SET status = 'canceled', updated_at = ?
    WHERE stripe_subscription_id = ?
  `, [Date.now(), stripeSubscriptionId]);

  // Update user subscription status
  await db.query(`
    UPDATE users 
    SET subscription_status = 'inactive', updated_at = ?
    WHERE stripe_customer_id IN (
      SELECT stripe_customer_id FROM user_subscriptions 
      WHERE stripe_subscription_id = ?
    )
  `, [Date.now(), stripeSubscriptionId]);
}

// ========== BILLING HISTORY ==========

// GET /payments/history - Get user's billing history
payments.get('/history', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const history = await db.query(`
      SELECT 
        us.*,
        p.amount,
        p.currency,
        p.status as payment_status,
        p.created_at as payment_date
      FROM user_subscriptions us
      LEFT JOIN payments p ON us.stripe_subscription_id = p.stripe_subscription_id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
    `, [auth.userId]);

    const billingHistory = (history.results || []).map((record: any) => ({
      subscriptionId: record.id,
      planId: record.plan_id,
      amount: record.amount,
      currency: record.currency,
      status: record.payment_status || record.status,
      paymentDate: record.payment_date || record.created_at,
      periodStart: record.current_period_start,
      periodEnd: record.current_period_end
    }));

    return c.json({
      history: billingHistory,
      totalRecords: billingHistory.length
    });
  } catch (error) {
    console.error('Billing history error:', error);
    return c.json({ error: 'Failed to fetch billing history' }, 500);
  }
});

// ========== USAGE ANALYTICS ==========

// GET /payments/usage - Get subscription usage analytics
payments.get('/usage', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    
    // Get current subscription
    const subscription = await db.query(`
      SELECT * FROM user_subscriptions 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `, [auth.userId]);

    if (!subscription.results?.length) {
      return c.json({
        hasSubscription: false,
        usage: {}
      });
    }

    const sub = subscription.results[0];
    const periodStart = sub.current_period_start;

    // Get usage statistics for current billing period
    const [taskStats, healthStats, aiStats] = await Promise.all([
      db.query(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE user_id = ? AND created_at >= ?
      `, [auth.userId, periodStart]),
      
      db.query(`
        SELECT COUNT(*) as count FROM health_logs 
        WHERE user_id = ? AND created_at >= ?
      `, [auth.userId, periodStart]),
      
      // AI usage would be tracked separately
      Promise.resolve({ results: [{ count: 0 }] })
    ]);

    return c.json({
      hasSubscription: true,
      subscription: {
        planId: sub.plan_id,
        periodStart: sub.current_period_start,
        periodEnd: sub.current_period_end
      },
      usage: {
        tasks: taskStats.results?.[0]?.count || 0,
        healthLogs: healthStats.results?.[0]?.count || 0,
        aiRequests: aiStats.results?.[0]?.count || 0,
        // Add other usage metrics as needed
      },
      limits: {
        // Define limits based on plan
        tasks: sub.plan_id.includes('pro') ? -1 : 100, // -1 for unlimited
        healthLogs: -1,
        aiRequests: sub.plan_id.includes('pro') ? 1000 : 50
      }
    });
  } catch (error) {
    console.error('Usage analytics error:', error);
    return c.json({ error: 'Failed to fetch usage data' }, 500);
  }
});

export default payments;