/**
 * Comprehensive Localization Service
 * Handles German localization, cultural adaptations, and dynamic content
 */

import { Database } from './db';

export interface LocalizedContent {
  id: string;
  content_key: string;
  language: string;
  content: string;
  created_at: number;
}

export interface LocalizedPricing {
  id: string;
  subscription_type: string;
  currency: string;
  price_monthly: number;
  price_yearly: number;
  country_code: string;
  tax_rate: number;
  is_active: boolean;
}

export interface ManagedContent {
  id: string;
  content_type: 'announcement' | 'tip' | 'feature_highlight' | 'maintenance';
  title: string;
  content: string;
  target_audience: string[];
  priority: number;
  is_active: boolean;
  start_date?: number;
  end_date?: number;
}

export interface CulturalAdaptation {
  country_code: string;
  date_format: string;
  time_format: string;
  currency_symbol: string;
  decimal_separator: string;
  thousand_separator: string;
  first_day_of_week: number; // 0 = Sunday, 1 = Monday
  business_hours_start: string;
  business_hours_end: string;
}

export class LocalizationService {
  constructor(private db: Database) {}

  /**
   * Get localized content by key and language
   */
  async getLocalizedContent(contentKey: string, language: string = 'en'): Promise<string | null> {
    try {
      const result = await this.db.query(`
        SELECT content FROM localized_content 
        WHERE content_key = ? AND language = ?
      `, [contentKey, language]);

      return result?.content || null;
    } catch (error) {
      console.error('Error getting localized content:', error);
      return (null.results || []);
    }
  }

  /**
   * Get multiple localized contents at once
   */
  async getBulkLocalizedContent(contentKeys: string[], language: string = 'en'): Promise<Record<string, string>> {
    try {
      const placeholders = contentKeys.map(() => '?').join(',');
      const results = await this.db.query(`
        SELECT content_key, content FROM localized_content 
        WHERE content_key IN (${placeholders}) AND language = ?
      `, [...contentKeys, language]);

      const contentMap: Record<string, string> = {};
      results.forEach((row: any) => {
        contentMap[row.content_key] = row.content;
      });

      return (contentMap.results || []);
    } catch (error) {
      console.error('Error getting bulk localized content:', error);
      return {};
    }
  }

  /**
   * Get pricing for a specific country and subscription type
   */
  async getLocalizedPricing(countryCode: string, subscriptionType?: string): Promise<LocalizedPricing[]> {
    try {
      let query = `
        SELECT * FROM localized_pricing 
        WHERE country_code = ? AND is_active = true
      `;
      const params = [countryCode];

      if (subscriptionType) {
        query += ` AND subscription_type = ?`;
        params.push(subscriptionType);
      }

      query += ` ORDER BY subscription_type`;

      const results = await this.db.prepare(query).bind(...params).all();
      return results as LocalizedPricing[];
    } catch (error) {
      console.error('Error getting localized pricing:', error);
      return [];
    }
  }

  /**
   * Get managed content for user's language and subscription
   */
  async getManagedContent(
    language: string = 'en',
    subscriptionType: string = 'free',
    contentType?: string
  ): Promise<ManagedContent[]> {
    try {
      let query = `
        SELECT 
          id,
          content_type,
          CASE WHEN ? = 'de' THEN title_de ELSE title_en END as title,
          CASE WHEN ? = 'de' THEN content_de ELSE content_en END as content,
          target_audience,
          priority,
          is_active,
          start_date,
          end_date
        FROM managed_content 
        WHERE is_active = true
        AND (start_date IS NULL OR start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)
        AND (target_audience LIKE '%"' || ? || '"%' OR target_audience LIKE '%"all"%')
      `;
      
      const params = [language, language, Date.now(), Date.now(), subscriptionType];

      if (contentType) {
        query += ` AND content_type = ?`;
        params.push(contentType);
      }

      query += ` ORDER BY priority DESC, created_at DESC`;

      const results = await this.db.prepare(query).bind(...params).all();
      
      return results.map((row: any) => ({
        ...row,
        target_audience: JSON.parse(row.target_audience)
      })) as ManagedContent[];
    } catch (error) {
      console.error('Error getting managed content:', error);
      return [];
    }
  }

  /**
   * Get cultural adaptations for a country
   */
  getCulturalAdaptation(countryCode: string): CulturalAdaptation {
    const adaptations: Record<string, CulturalAdaptation> = {
      'DE': {
        country_code: 'DE',
        date_format: 'DD.MM.YYYY',
        time_format: 'HH:mm',
        currency_symbol: '€',
        decimal_separator: ',',
        thousand_separator: '.',
        first_day_of_week: 1, // Monday
        business_hours_start: '09:00',
        business_hours_end: '17:00'
      },
      'AT': {
        country_code: 'AT',
        date_format: 'DD.MM.YYYY',
        time_format: 'HH:mm',
        currency_symbol: '€',
        decimal_separator: ',',
        thousand_separator: '.',
        first_day_of_week: 1, // Monday
        business_hours_start: '08:30',
        business_hours_end: '17:30'
      },
      'CH': {
        country_code: 'CH',
        date_format: 'DD.MM.YYYY',
        time_format: 'HH:mm',
        currency_symbol: 'CHF',
        decimal_separator: '.',
        thousand_separator: "'",
        first_day_of_week: 1, // Monday
        business_hours_start: '08:00',
        business_hours_end: '17:00'
      },
      'US': {
        country_code: 'US',
        date_format: 'MM/DD/YYYY',
        time_format: 'h:mm A',
        currency_symbol: '$',
        decimal_separator: '.',
        thousand_separator: ',',
        first_day_of_week: 0, // Sunday
        business_hours_start: '09:00',
        business_hours_end: '17:00'
      }
    };

    return adaptations[countryCode] || adaptations['US'];
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(amount: number, countryCode: string, currency: string): string {
    const adaptation = this.getCulturalAdaptation(countryCode);
    
    // Format number with proper separators
    const parts = amount.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, adaptation.thousand_separator);
    const decimalPart = parts[1];
    
    const formattedAmount = `${integerPart}${adaptation.decimal_separator}${decimalPart}`;
    
    // Add currency symbol based on country
    if (countryCode === 'DE' || countryCode === 'AT') {
      return `${formattedAmount} ${adaptation.currency_symbol}`;
    } else if (countryCode === 'CH') {
      return `${adaptation.currency_symbol} ${formattedAmount}`;
    } else {
      return `${adaptation.currency_symbol}${formattedAmount}`;
    }
  }

  /**
   * Format date according to locale
   */
  formatDate(timestamp: number, countryCode: string): string {
    const date = new Date(timestamp);
    const adaptation = this.getCulturalAdaptation(countryCode);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    switch (adaptation.date_format) {
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return `${day}.${month}.${year}`;
    }
  }

  /**
   * Format time according to locale
   */
  formatTime(timestamp: number, countryCode: string): string {
    const date = new Date(timestamp);
    const adaptation = this.getCulturalAdaptation(countryCode);
    
    if (adaptation.time_format === 'HH:mm') {
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  }

  /**
   * Get localized notification templates
   */
  getNotificationTemplates(language: string = 'en'): Record<string, { title: string; body: string }> {
    const templates = {
      en: {
        task_reminder: {
          title: 'Task Reminder',
          body: 'You have a task due soon: {{taskTitle}}'
        },
        habit_reminder: {
          title: 'Habit Reminder',
          body: 'Time for your {{habitName}} habit!'
        },
        focus_session_complete: {
          title: 'Focus Session Complete',
          body: 'Great job! You completed a {{duration}} minute focus session.'
        },
        achievement_unlocked: {
          title: 'Achievement Unlocked!',
          body: 'Congratulations! You earned the "{{achievementName}}" badge.'
        },
        weekly_summary: {
          title: 'Weekly Summary',
          body: 'Your productivity summary is ready. You completed {{taskCount}} tasks this week!'
        }
      },
      de: {
        task_reminder: {
          title: 'Aufgaben-Erinnerung',
          body: 'Sie haben bald eine fällige Aufgabe: {{taskTitle}}'
        },
        habit_reminder: {
          title: 'Gewohnheits-Erinnerung',
          body: 'Zeit für Ihre {{habitName}} Gewohnheit!'
        },
        focus_session_complete: {
          title: 'Fokus-Sitzung abgeschlossen',
          body: 'Großartig! Sie haben eine {{duration}}-minütige Fokus-Sitzung abgeschlossen.'
        },
        achievement_unlocked: {
          title: 'Erfolg freigeschaltet!',
          body: 'Herzlichen Glückwunsch! Sie haben das "{{achievementName}}" Abzeichen erhalten.'
        },
        weekly_summary: {
          title: 'Wochenzusammenfassung',
          body: 'Ihre Produktivitätszusammenfassung ist bereit. Sie haben diese Woche {{taskCount}} Aufgaben erledigt!'
        }
      }
    };

    return templates[language as keyof typeof templates] || templates.en;
  }

  /**
   * Add or update localized content
   */
  async setLocalizedContent(contentKey: string, language: string, content: string): Promise<boolean> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO localized_content (id, content_key, language, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        `loc_${contentKey}_${language}_${Date.now()}`,
        contentKey,
        language,
        content,
        Date.now()
      ).run();

      return (true.results || []);
    } catch (error) {
      console.error('Error setting localized content:', error);
      return (false.results || []);
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    // Return hardcoded supported languages for now
    return ['en', 'de'];
  }

  /**
   * Detect user's preferred language from various sources
   */
  detectLanguage(
    userLanguage?: string,
    acceptLanguage?: string,
    countryCode?: string
  ): string {
    // Priority: user preference > browser language > country code > default
    if (userLanguage && ['en', 'de'].includes(userLanguage)) {
      return userLanguage;
    }

    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
      for (const lang of languages) {
        if (lang.startsWith('de')) return 'de';
        if (lang.startsWith('en')) return 'en';
      }
    }

    if (countryCode && ['DE', 'AT', 'CH'].includes(countryCode)) {
      return 'de';
    }

    return 'en';
  }
}