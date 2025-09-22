// AI Enhancements Unit Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIEnhancementService, createAIEnhancementService } from '../../src/lib/ai-enhancements';
import { createMockEnv } from '../utils/test-helpers';

// Mock fetch globally
global.fetch = vi.fn();

describe('AI Enhancements', () => {
  let aiService: AIEnhancementService;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = createMockEnv();
    aiService = createAIEnhancementService(mockEnv);
    vi.clearAllMocks();
  });

  describe('AIEnhancementService', () => {
    it('should create service with valid API key', () => {
      expect(aiService).toBeInstanceOf(AIEnhancementService);
    });

    it('should throw error when API key is missing', () => {
      const invalidEnv = { ...mockEnv, OPENAI_API_KEY: undefined };
      expect(() => createAIEnhancementService(invalidEnv)).toThrow('OPENAI_API_KEY is required');
    });

    it('should perform cross-metric analysis', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                insights: {
                  productivity: {
                    score: 85,
                    factors: ['High task completion', 'Good focus sessions'],
                    recommendations: ['Take more breaks', 'Optimize schedule']
                  },
                  wellness: {
                    score: 78,
                    factors: ['Good sleep', 'Regular exercise'],
                    recommendations: ['Reduce stress', 'Improve nutrition']
                  },
                  correlation: {
                    strength: 0.7,
                    description: 'Strong positive correlation between productivity and wellness',
                    actionableInsights: ['Better sleep leads to better focus']
                  }
                },
                trends: {
                  period: 'week',
                  direction: 'improving',
                  confidence: 0.8
                },
                predictions: {
                  nextWeek: {
                    productivity: 88,
                    wellness: 82,
                    riskFactors: ['Upcoming deadline stress']
                  }
                }
              })
            }
          }]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const productivityData = {
        tasksCompleted: 12,
        focusSessions: 8,
        pomodoroSessions: 16,
        timeSpent: 480,
        distractions: 3
      };

      const wellnessData = {
        sleepDuration: 7.5,
        sleepQuality: 'good',
        stressLevel: 6,
        energyLevel: 7,
        steps: 8500,
        workouts: 4
      };

      const analysis = await aiService.performCrossMetricAnalysis(
        'user123',
        productivityData,
        wellnessData,
        '2025-01-20'
      );

      expect(analysis.userId).toBe('user123');
      expect(analysis.date).toBe('2025-01-20');
      expect(analysis.insights.productivity.score).toBe(85);
      expect(analysis.insights.wellness.score).toBe(78);
      expect(analysis.trends.direction).toBe('improving');
      expect(analysis.predictions.nextWeek.productivity).toBe(88);
    });

    it('should generate German language support', async () => {
      const support = await aiService.generateGermanSupport();

      expect(support.language).toBe('de');
      expect(support.translations['task_completed']).toBe('Aufgabe abgeschlossen');
      expect(support.translations['wellness_score']).toBe('Wellness-Wert');
      expect(support.translations['ai_insights']).toBe('KI-Einblicke');
      expect(support.culturalAdaptations.dateFormat).toBe('DD.MM.YYYY');
      expect(support.culturalAdaptations.timeFormat).toBe('HH:mm');
      expect(support.culturalAdaptations.numberFormat).toBe('de-DE');
    });

    it('should generate personalized coaching recommendations', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                recommendations: [
                  {
                    category: 'productivity',
                    priority: 'high',
                    title: 'Optimize Morning Routine',
                    description: 'Start with your most important task',
                    actionSteps: ['Wake up 30 minutes earlier', 'Plan your day the night before'],
                    expectedImpact: 'Increase daily productivity by 20%'
                  }
                ],
                motivationalMessage: 'You\'re making great progress! Keep up the excellent work.'
              })
            }
          }]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const userData = {
        age: 28,
        goals: ['Increase productivity', 'Improve work-life balance'],
        habits: ['Morning exercise', 'Evening journaling'],
        challenges: ['Time management', 'Distractions'],
        preferences: ['Short sessions', 'Visual feedback']
      };

      const coaching = await aiService.generatePersonalizedCoaching('user123', userData, 'en');

      expect(coaching.recommendations).toHaveLength(1);
      expect(coaching.recommendations[0].category).toBe('productivity');
      expect(coaching.recommendations[0].priority).toBe('high');
      expect(coaching.recommendations[0].title).toBe('Optimize Morning Routine');
      expect(coaching.motivationalMessage).toContain('great progress');
    });

    it('should generate German coaching recommendations', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                recommendations: [
                  {
                    category: 'wellness',
                    priority: 'medium',
                    title: 'Verbesserung der Schlafqualität',
                    description: 'Etablieren Sie eine konsistente Schlafroutine',
                    actionSteps: ['Gehen Sie jeden Tag zur gleichen Zeit ins Bett', 'Vermeiden Sie Bildschirme vor dem Schlaf'],
                    expectedImpact: 'Erhöhung der Schlafqualität um 25%'
                  }
                ],
                motivationalMessage: 'Sie machen großartige Fortschritte! Weiter so!'
              })
            }
          }]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const userData = {
        age: 32,
        goals: ['Bessere Schlafqualität', 'Stressreduktion'],
        habits: ['Abendliche Meditation', 'Regelmäßige Bewegung'],
        challenges: ['Einschlafschwierigkeiten', 'Unregelmäßige Schlafzeiten'],
        preferences: ['Natürliche Methoden', 'Schritt-für-Schritt-Anleitungen']
      };

      const coaching = await aiService.generatePersonalizedCoaching('user123', userData, 'de');

      expect(coaching.recommendations[0].title).toBe('Verbesserung der Schlafqualität');
      expect(coaching.recommendations[0].description).toContain('Schlafroutine');
      expect(coaching.motivationalMessage).toContain('großartige Fortschritte');
    });

    it('should analyze voice commands', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                intent: 'create_task',
                confidence: 0.95,
                entities: {
                  task_name: 'Review quarterly reports',
                  duration: '2 hours',
                  priority: 'high'
                },
                response: 'I\'ll create a high-priority task "Review quarterly reports" for 2 hours.',
                actionRequired: true
              })
            }
          }]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const analysis = await aiService.analyzeVoiceCommand(
        'Create a high priority task to review quarterly reports for 2 hours',
        'en'
      );

      expect(analysis.intent).toBe('create_task');
      expect(analysis.confidence).toBe(0.95);
      expect(analysis.entities.task_name).toBe('Review quarterly reports');
      expect(analysis.entities.duration).toBe('2 hours');
      expect(analysis.entities.priority).toBe('high');
      expect(analysis.actionRequired).toBe(true);
    });

    it('should analyze German voice commands', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                intent: 'start_focus',
                confidence: 0.88,
                entities: {
                  duration: '25 Minuten',
                  task_type: 'Schreiben'
                },
                response: 'Ich starte eine 25-minütige Fokussitzung für das Schreiben.',
                actionRequired: true
              })
            }
          }]
        })
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const analysis = await aiService.analyzeVoiceCommand(
        'Starte eine Fokussitzung für 25 Minuten zum Schreiben',
        'de'
      );

      expect(analysis.intent).toBe('start_focus');
      expect(analysis.confidence).toBe(0.88);
      expect(analysis.entities.duration).toBe('25 Minuten');
      expect(analysis.entities.task_type).toBe('Schreiben');
      expect(analysis.response).toContain('Fokussitzung');
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(aiService.performCrossMetricAnalysis('user123', {}, {}, '2025-01-20'))
        .rejects.toThrow('OpenAI API error: 429 - Too Many Requests');
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(aiService.generatePersonalizedCoaching('user123', {}, 'en'))
        .rejects.toThrow('Network error');
    });
  });
});
