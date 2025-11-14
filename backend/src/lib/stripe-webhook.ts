// Stripe Webhook Security
// Handles secure webhook signature verification

// Using Cloudflare's Web Crypto API instead of Node.js crypto

export interface StripeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
}

export class StripeWebhookVerifier {
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  /**
   * Create HMAC-SHA256 signature using Web Crypto API
   */
  private static async createHmacSha256(secret: string, data: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify Stripe webhook signature
   * @param payload Raw request body
   * @param signature Stripe signature header
   * @param webhookSecret Webhook endpoint secret
   * @returns Parsed and verified webhook event
   */
  static async verifySignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<StripeWebhookEvent> {
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // Parse signature header
    const elements = signature.split(',');
    const signatureElements: Record<string, string> = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      signatureElements[key] = value;
    }

    const timestamp = signatureElements.t;
    const v1 = signatureElements.v1;

    if (!timestamp || !v1) {
      throw new Error('Invalid signature format');
    }

    // Check timestamp (reject if older than 5 minutes)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const webhookTimestamp = parseInt(timestamp, 10);
    
    if (currentTimestamp - webhookTimestamp > 300) {
      throw new Error('Webhook timestamp too old');
    }

    // Construct expected signature using Web Crypto API
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await StripeWebhookVerifier.createHmacSha256(webhookSecret, signedPayload);

    // Compare signatures using constant-time comparison
    if (!this.constantTimeCompare(v1, expectedSignature)) {
      throw new Error('Invalid signature');
    }

    // Parse and return the event
    try {
      return JSON.parse(payload) as StripeWebhookEvent;
    } catch (error) {
      throw new Error('Invalid JSON payload');
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Verify webhook and return parsed event
   */
  async verify(payload: string, signature: string): Promise<StripeWebhookEvent> {
    return StripeWebhookVerifier.verifySignature(payload, signature, this.webhookSecret);
  }
}

/**
 * Create webhook verifier instance
 */
export function createStripeWebhookVerifier(webhookSecret: string): StripeWebhookVerifier {
  return new StripeWebhookVerifier(webhookSecret);
}

/**
 * Webhook event types we handle
 */
export const SUPPORTED_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.created',
  'customer.updated',
  'customer.deleted'
] as const;

export type SupportedWebhookEvent = typeof SUPPORTED_WEBHOOK_EVENTS[number];

/**
 * Check if webhook event type is supported
 */
export function isSupportedWebhookEvent(eventType: string): eventType is SupportedWebhookEvent {
  return SUPPORTED_WEBHOOK_EVENTS.includes(eventType as SupportedWebhookEvent);
}
