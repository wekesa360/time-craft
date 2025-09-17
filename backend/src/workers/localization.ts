/**
 * Localization API Endpoints
 * Handles German localization, cultural adaptations, and dynamic content
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Database } from '../lib/db';
import { LocalizationService } from '../lib/localization';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { Env } from '../lib/env';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Initialize services
let localizationService: LocalizationService;

app.use('*', async (c, next) => {
  const db = new Database(c.env.DB);
  localizationService = new LocalizationService(db);
  await next();
});

/**
 * GET /api/localization/content
 * Get localized content by keys
 */
app.get('/content', optionalAuth, async (c) => {
  try {
    const { keys, language = 'en' } = c.req.query();
    
    if (!keys) {
      return c.json({ error: 'Content keys are required' }, 400);
    }

    const contentKeys = keys.split(',');
    const content = await localizationService.getBulkLocalizedContent(contentKeys, language);

    return c.json({
      success: true,
      data: {
        content,
        language,
        keys_requested: contentKeys.length,
        keys_found: Object.keys(content).length
      }
    });
  } catch (error) {
    console.error('Error getting localized content:', error);
    return c.json({ error: 'Failed to get localized content' }, 500);
  }
});

/**
 * GET /api/localization/content/:key
 * Get single localized content by key
 */
app.get('/content/:key', optionalAuth, async (c) => {
  try {
    const key = c.req.param('key');
    const { language = 'en' } = c.req.query();
    
    const content = await localizationService.getLocalizedContent(key, language);
    
    if (!content) {
      return c.json({ error: 'Content not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        key,
        content,
        language
      }
    });
  } catch (error) {
    console.error('Error getting localized content:', error);
    return c.json({ error: 'Failed to get localized content' }, 500);
  }
});

/**
 * GET /api/localization/pricing
 * Get localized pricing for country
 */
app.get('/pricing', optionalAuth, async (c) => {
  try {
    const { country_code = 'US', subscription_type } = c.req.query();
    
    const pricing = await localizationService.getLocalizedPricing(country_code, subscription_type);
    const cultural = localizationService.getCulturalAdaptation(country_code);

    return c.json({
      success: true,
      data: {
        pricing,
        cultural_adaptation: cultural,
        country_code
      }
    });
  } catch (error) {
    console.error('Error getting localized pricing:', error);
    return c.json({ error: 'Failed to get localized pricing' }, 500);
  }
});

/**
 * GET /api/localization/managed-content
 * Get managed content for user
 */
app.get('/managed-content', optionalAuth, async (c) => {
  try {
    const user = c.get('user');
    const { language = 'en', content_type } = c.req.query();
    
    const subscriptionType = user?.subscription_type || 'free';
    const content = await localizationService.getManagedContent(language, subscriptionType, content_type);

    return c.json({
      success: true,
      data: {
        content,
        language,
        subscription_type: subscriptionType,
        content_type: content_type || 'all'
      }
    });
  } catch (error) {
    console.error('Error getting managed content:', error);
    return c.json({ error: 'Failed to get managed content' }, 500);
  }
});

/**
 * GET /api/localization/cultural/:country
 * Get cultural adaptations for country
 */
app.get('/cultural/:country', optionalAuth, async (c) => {
  try {
    const countryCode = c.req.param('country').toUpperCase();
    const cultural = localizationService.getCulturalAdaptation(countryCode);

    return c.json({
      success: true,
      data: cultural
    });
  } catch (error) {
    console.error('Error getting cultural adaptation:', error);
    return c.json({ error: 'Failed to get cultural adaptation' }, 500);
  }
});

/**
 * GET /api/localization/notifications
 * Get localized notification templates
 */
app.get('/notifications', optionalAuth, async (c) => {
  try {
    const { language = 'en' } = c.req.query();
    const templates = localizationService.getNotificationTemplates(language);

    return c.json({
      success: true,
      data: {
        templates,
        language
      }
    });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    return c.json({ error: 'Failed to get notification templates' }, 500);
  }
});

/**
 * GET /api/localization/languages
 * Get supported languages
 */
app.get('/languages', optionalAuth, async (c) => {
  try {
    const languages = await localizationService.getSupportedLanguages();

    return c.json({
      success: true,
      data: {
        languages,
        default: 'en'
      }
    });
  } catch (error) {
    console.error('Error getting supported languages:', error);
    return c.json({ error: 'Failed to get supported languages' }, 500);
  }
});

/**
 * POST /api/localization/detect-language
 * Detect user's preferred language
 */
app.post('/detect-language', optionalAuth, async (c) => {
  try {
    const { user_language, accept_language, country_code } = await c.req.json();
    
    const detectedLanguage = localizationService.detectLanguage(
      user_language,
      accept_language,
      country_code
    );

    return c.json({
      success: true,
      data: {
        detected_language: detectedLanguage,
        sources: {
          user_preference: user_language,
          browser_language: accept_language,
          country_code: country_code
        }
      }
    });
  } catch (error) {
    console.error('Error detecting language:', error);
    return c.json({ error: 'Failed to detect language' }, 500);
  }
});

/**
 * POST /api/localization/format
 * Format values according to locale
 */
app.post('/format', optionalAuth, async (c) => {
  try {
    const { type, value, country_code = 'US', currency = 'USD' } = await c.req.json();
    
    let formatted: string;
    
    switch (type) {
      case 'currency':
        formatted = localizationService.formatCurrency(value, country_code, currency);
        break;
      case 'date':
        formatted = localizationService.formatDate(value, country_code);
        break;
      case 'time':
        formatted = localizationService.formatTime(value, country_code);
        break;
      default:
        return c.json({ error: 'Invalid format type' }, 400);
    }

    return c.json({
      success: true,
      data: {
        original_value: value,
        formatted_value: formatted,
        type,
        country_code
      }
    });
  } catch (error) {
    console.error('Error formatting value:', error);
    return c.json({ error: 'Failed to format value' }, 500);
  }
});

/**
 * PUT /api/localization/content/:key
 * Update localized content (admin only)
 */
app.put('/content/:key', authenticateUser, async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.subscription_type !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const key = c.req.param('key');
    const { language, content } = await c.req.json();
    
    if (!language || !content) {
      return c.json({ error: 'Language and content are required' }, 400);
    }

    const success = await localizationService.setLocalizedContent(key, language, content);
    
    if (!success) {
      return c.json({ error: 'Failed to update content' }, 500);
    }

    return c.json({
      success: true,
      data: {
        key,
        language,
        content,
        updated_at: Date.now()
      }
    });
  } catch (error) {
    console.error('Error updating localized content:', error);
    return c.json({ error: 'Failed to update localized content' }, 500);
  }
});

export default app;