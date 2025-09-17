/**
 * Localization Service Tests
 * Tests German localization, cultural adaptations, and dynamic content
 */

import { describe, it, expect } from 'vitest';
import { LocalizationService } from '../../src/lib/localization';

// Mock database for testing
const createMockDb = () => ({
  prepare: (sql: string) => ({
    bind: (...params: any[]) => ({
      all: () => Promise.resolve([]),
      run: () => Promise.resolve({ success: true }),
      first: () => Promise.resolve(null)
    })
  })
});

describe('LocalizationService', () => {
  describe('formatCurrency', () => {
    it('should format German currency correctly', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.formatCurrency(1234.56, 'DE', 'EUR');

      expect(result).toBe('1.234,56 €');
    });

    it('should format Swiss currency correctly', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.formatCurrency(1234.56, 'CH', 'CHF');

      expect(result).toBe("CHF 1'234.56");
    });

    it('should format US currency correctly', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.formatCurrency(1234.56, 'US', 'USD');

      expect(result).toBe('$1,234.56');
    });
  });

  describe('formatDate', () => {
    it('should format German date correctly', () => {
      const localizationService = new LocalizationService(createMockDb());
      const timestamp = new Date('2025-01-15').getTime();
      const result = localizationService.formatDate(timestamp, 'DE');

      expect(result).toBe('15.01.2025');
    });

    it('should format US date correctly', () => {
      const localizationService = new LocalizationService(createMockDb());
      const timestamp = new Date('2025-01-15').getTime();
      const result = localizationService.formatDate(timestamp, 'US');

      expect(result).toBe('01/15/2025');
    });
  });

  describe('getNotificationTemplates', () => {
    it('should return English notification templates', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getNotificationTemplates('en');

      expect(result.task_reminder.title).toBe('Task Reminder');
      expect(result.task_reminder.body).toContain('{{taskTitle}}');
    });

    it('should return German notification templates', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getNotificationTemplates('de');

      expect(result.task_reminder.title).toBe('Aufgaben-Erinnerung');
      expect(result.task_reminder.body).toContain('{{taskTitle}}');
    });

    it('should fallback to English for unsupported language', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getNotificationTemplates('fr');

      expect(result.task_reminder.title).toBe('Task Reminder');
    });
  });

  describe('detectLanguage', () => {
    it('should prioritize user language preference', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.detectLanguage('de', 'en-US', 'US');

      expect(result).toBe('de');
    });

    it('should use browser language when user preference not available', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.detectLanguage(undefined, 'de-DE,de;q=0.9,en;q=0.8', 'US');

      expect(result).toBe('de');
    });

    it('should use country code for German-speaking countries', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.detectLanguage(undefined, undefined, 'DE');

      expect(result).toBe('de');
    });

    it('should fallback to English as default', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.detectLanguage(undefined, undefined, 'FR');

      expect(result).toBe('en');
    });

    it('should handle complex Accept-Language headers', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.detectLanguage(undefined, 'fr-FR,fr;q=0.9,de;q=0.8,en;q=0.7', 'FR');

      expect(result).toBe('de');
    });
  });

  describe('getCulturalAdaptation', () => {
    it('should return German cultural adaptation', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getCulturalAdaptation('DE');

      expect(result).toEqual({
        country_code: 'DE',
        date_format: 'DD.MM.YYYY',
        time_format: 'HH:mm',
        currency_symbol: '€',
        decimal_separator: ',',
        thousand_separator: '.',
        first_day_of_week: 1,
        business_hours_start: '09:00',
        business_hours_end: '17:00'
      });
    });

    it('should return Austrian cultural adaptation', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getCulturalAdaptation('AT');

      expect(result.country_code).toBe('AT');
      expect(result.currency_symbol).toBe('€');
      expect(result.first_day_of_week).toBe(1);
    });

    it('should return Swiss cultural adaptation', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getCulturalAdaptation('CH');

      expect(result.country_code).toBe('CH');
      expect(result.currency_symbol).toBe('CHF');
      expect(result.thousand_separator).toBe("'");
    });

    it('should return US adaptation as default', () => {
      const localizationService = new LocalizationService(createMockDb());
      const result = localizationService.getCulturalAdaptation('UNKNOWN');

      expect(result.country_code).toBe('US');
      expect(result.currency_symbol).toBe('$');
      expect(result.first_day_of_week).toBe(0);
    });
  });
});