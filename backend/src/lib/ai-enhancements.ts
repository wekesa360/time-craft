// AI Features Enhancement
// Cross-metric analysis and advanced AI capabilities

import { logger } from './logger';

export interface CrossMetricAnalysis {
  userId: string;
  date: string;
  insights: {
    productivity: {
      score: number;
      factors: string[];
      recommendations: string[];
    };
    wellness: {
      score: number;
      factors: string[];
      recommendations: string[];
    };
    correlation: {
      strength: number;
      description: string;
      actionableInsights: string[];
    };
  };
  trends: {
    period: 'week' | 'month' | 'quarter';
    direction: 'improving' | 'declining' | 'stable';
    confidence: number;
  };
  predictions: {
    nextWeek: {
      productivity: number;
      wellness: number;
      riskFactors: string[];
    };
  };
}

export interface GermanLanguageSupport {
  language: 'de';
  translations: {
    [key: string]: string;
  };
  culturalAdaptations: {
    dateFormat: string;
    timeFormat: string;
    numberFormat: string;
  };
}

export class AIEnhancementService {
  private openaiApiKey: string;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Perform cross-metric analysis combining productivity and wellness data
   */
  async performCrossMetricAnalysis(
    userId: string,
    productivityData: any,
    wellnessData: any,
    date: string
  ): Promise<CrossMetricAnalysis> {
    try {
      const prompt = this.buildCrossMetricPrompt(productivityData, wellnessData, date);
      const response = await this.callOpenAI(prompt, 'gpt-4o-mini');

      const analysis = JSON.parse(response);
      
      logger.info('Cross-metric analysis completed', {
        userId,
        date,
        productivityScore: analysis.insights.productivity.score,
        wellnessScore: analysis.insights.wellness.score
      });

      return {
        userId,
        date,
        insights: analysis.insights,
        trends: analysis.trends,
        predictions: analysis.predictions
      };
    } catch (error) {
      logger.error('Cross-metric analysis failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate German language support
   */
  async generateGermanSupport(): Promise<GermanLanguageSupport> {
    const translations = {
      // Productivity
      'task_completed': 'Aufgabe abgeschlossen',
      'focus_session': 'Fokussitzung',
      'pomodoro_timer': 'Pomodoro-Timer',
      'productivity_score': 'Produktivitätswert',
      'time_management': 'Zeitmanagement',
      
      // Wellness
      'wellness_score': 'Wellness-Wert',
      'sleep_quality': 'Schlafqualität',
      'stress_level': 'Stresslevel',
      'energy_level': 'Energielevel',
      'mood_tracking': 'Stimmungsverfolgung',
      
      // Health
      'steps_today': 'Schritte heute',
      'calories_burned': 'Verbrannte Kalorien',
      'heart_rate': 'Herzfrequenz',
      'workout_completed': 'Training abgeschlossen',
      'meditation_session': 'Meditationssitzung',
      
      // AI Insights
      'ai_insights': 'KI-Einblicke',
      'recommendations': 'Empfehlungen',
      'trend_analysis': 'Trendanalyse',
      'predictive_insights': 'Vorhersage-Einblicke',
      'personalized_coaching': 'Personalisierte Beratung',
      
      // Common
      'today': 'Heute',
      'this_week': 'Diese Woche',
      'this_month': 'Diesen Monat',
      'excellent': 'Ausgezeichnet',
      'good': 'Gut',
      'fair': 'Mittelmäßig',
      'poor': 'Schlecht',
      'improving': 'Verbessernd',
      'declining': 'Verschlechternd',
      'stable': 'Stabil'
    };

    return {
      language: 'de',
      translations,
      culturalAdaptations: {
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        numberFormat: 'de-DE'
      }
    };
  }

  /**
   * Generate personalized coaching recommendations
   */
  async generatePersonalizedCoaching(
    userId: string,
    userData: any,
    language: string = 'en'
  ): Promise<{
    recommendations: Array<{
      category: string;
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      actionSteps: string[];
      expectedImpact: string;
    }>;
    motivationalMessage: string;
  }> {
    try {
      const prompt = this.buildCoachingPrompt(userData, language);
      const response = await this.callOpenAI(prompt, 'gpt-4o-mini');

      const coaching = JSON.parse(response);
      
      logger.info('Personalized coaching generated', {
        userId,
        language,
        recommendationCount: coaching.recommendations.length
      });

      return coaching;
    } catch (error) {
      logger.error('Personalized coaching generation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Analyze voice commands with German support
   */
  async analyzeVoiceCommand(
    transcript: string,
    language: string = 'en'
  ): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    response: string;
    actionRequired: boolean;
  }> {
    try {
      const prompt = this.buildVoiceAnalysisPrompt(transcript, language);
      const response = await this.callOpenAI(prompt, 'gpt-4o-mini');

      const analysis = JSON.parse(response);
      
      logger.info('Voice command analyzed', {
        language,
        intent: analysis.intent,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Voice command analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Build cross-metric analysis prompt
   */
  private buildCrossMetricPrompt(productivityData: any, wellnessData: any, date: string): string {
    return `
Analyze the following productivity and wellness data to provide cross-metric insights:

Productivity Data:
- Tasks completed: ${productivityData.tasksCompleted || 0}
- Focus sessions: ${productivityData.focusSessions || 0}
- Pomodoro sessions: ${productivityData.pomodoroSessions || 0}
- Time spent on tasks: ${productivityData.timeSpent || 0} minutes
- Distractions: ${productivityData.distractions || 0}

Wellness Data:
- Sleep duration: ${wellnessData.sleepDuration || 0} hours
- Sleep quality: ${wellnessData.sleepQuality || 'unknown'}
- Stress level: ${wellnessData.stressLevel || 0}/10
- Energy level: ${wellnessData.energyLevel || 0}/10
- Steps: ${wellnessData.steps || 0}
- Workouts: ${wellnessData.workouts || 0}

Provide analysis in this JSON format:
{
  "insights": {
    "productivity": {
      "score": 0-100,
      "factors": ["factor1", "factor2"],
      "recommendations": ["rec1", "rec2"]
    },
    "wellness": {
      "score": 0-100,
      "factors": ["factor1", "factor2"],
      "recommendations": ["rec1", "rec2"]
    },
    "correlation": {
      "strength": 0-1,
      "description": "description",
      "actionableInsights": ["insight1", "insight2"]
    }
  },
  "trends": {
    "period": "week",
    "direction": "improving|declining|stable",
    "confidence": 0-1
  },
  "predictions": {
    "nextWeek": {
      "productivity": 0-100,
      "wellness": 0-100,
      "riskFactors": ["risk1", "risk2"]
    }
  }
}
    `.trim();
  }

  /**
   * Build coaching prompt
   */
  private buildCoachingPrompt(userData: any, language: string): string {
    const isGerman = language === 'de';
    
    return `
Generate personalized coaching recommendations based on user data:

User Data:
- Age: ${userData.age || 'unknown'}
- Goals: ${userData.goals || 'unknown'}
- Current habits: ${userData.habits || 'unknown'}
- Challenges: ${userData.challenges || 'unknown'}
- Preferences: ${userData.preferences || 'unknown'}

Language: ${language}

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "category": "productivity|wellness|health|mindfulness",
      "priority": "high|medium|low",
      "title": "${isGerman ? 'Titel' : 'Title'}",
      "description": "${isGerman ? 'Beschreibung' : 'Description'}",
      "actionSteps": ["${isGerman ? 'Schritt 1' : 'Step 1'}", "${isGerman ? 'Schritt 2' : 'Step 2'}"],
      "expectedImpact": "${isGerman ? 'Erwartete Auswirkung' : 'Expected Impact'}"
    }
  ],
  "motivationalMessage": "${isGerman ? 'Motivierende Nachricht' : 'Motivational message'}"
}
    `.trim();
  }

  /**
   * Build voice analysis prompt
   */
  private buildVoiceAnalysisPrompt(transcript: string, language: string): string {
    const isGerman = language === 'de';
    
    return `
Analyze this voice command transcript and determine intent:

Transcript: "${transcript}"
Language: ${language}

Common intents:
- create_task: ${isGerman ? 'Aufgabe erstellen' : 'Create a task'}
- start_focus: ${isGerman ? 'Fokus starten' : 'Start focus session'}
- log_mood: ${isGerman ? 'Stimmung protokollieren' : 'Log mood'}
- schedule_meeting: ${isGerman ? 'Meeting planen' : 'Schedule meeting'}
- get_insights: ${isGerman ? 'Einblicke abrufen' : 'Get insights'}
- set_reminder: ${isGerman ? 'Erinnerung setzen' : 'Set reminder'}

Provide analysis in this JSON format:
{
  "intent": "intent_name",
  "confidence": 0-1,
  "entities": {
    "task_name": "extracted task name",
    "duration": "extracted duration",
    "priority": "extracted priority"
  },
  "response": "${isGerman ? 'Antwort auf Deutsch' : 'Response in English'}",
  "actionRequired": true/false
}
    `.trim();
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in productivity and wellness analysis. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

/**
 * Create AI enhancement service instance
 */
export function createAIEnhancementService(env: any): AIEnhancementService {
  const openaiApiKey = env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for AI enhancement service');
  }
  
  return new AIEnhancementService(openaiApiKey);
}
