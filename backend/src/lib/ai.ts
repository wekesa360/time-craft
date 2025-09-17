// AI Integration Library for Time & Wellness Application
import type { Env } from './env';
import type { Task, HealthLog, SupportedLanguage } from '../types/database';

export interface AITaskPriority {
  taskId: string;
  priority: number; // 0-100
  reasoning: string;
  confidenceScore: number; // 0-1
  suggestedTimeSlot?: {
    start: number;
    end: number;
    reason: string;
  };
}

export interface AIHealthInsight {
  userId: string;
  insight: string;
  category: 'exercise' | 'mood' | 'nutrition' | 'sleep' | 'overall';
  confidence: number;
  recommendations: string[];
  dataPoints: number;
  language: SupportedLanguage;
}

export interface AIMeetingSchedule {
  title: string;
  participants: string[];
  suggestedSlots: Array<{
    start: number;
    end: number;
    confidence: number;
    reasoning: string;
  }>;
  conflictAnalysis: {
    hasConflicts: boolean;
    conflictCount: number;
    alternatives: number;
  };
}

export interface AISmartPlan {
  planId: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: number;
    estimatedDuration: number;
    suggestedTime: number;
    energyLevel: number;
    context: string;
  }>;
  totalEstimatedTime: number;
  confidenceScore: number;
  reasoning: string;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(private env: Env) {
    this.apiKey = env.OPENAI_API_KEY;
  }

  // Task Priority Analysis
  async analyzeTaskPriority(
    tasks: Task[], 
    userContext: { timezone: string; workingHours?: string; preferences?: any },
    language: SupportedLanguage = 'en'
  ): Promise<AITaskPriority[]> {
    const systemPrompt = this.getSystemPrompt('task_priority', language);
    const currentTime = new Date();
    const contextInfo = this.buildTaskContext(tasks);

    const prompt = `
      ${systemPrompt}
      
      Current time: ${currentTime.toISOString()}
      User timezone: ${userContext.timezone}
      Working hours: ${userContext.workingHours || '9:00-17:00'}
      
      Tasks to analyze:
      ${contextInfo}
      
      Analyze each task and provide priority scores (0-100) with reasoning. Consider:
      - Due dates and urgency
      - Estimated duration and complexity  
      - Energy levels required
      - Context switching costs
      - User's working hours and timezone
      
      Respond in JSON format with an array of task analyses.
    `;

    try {
      const response = await this.callOpenAI(prompt, {
        model: 'gpt-4',
        temperature: 0.3,
        max_tokens: 2000
      });

      return this.parseTaskPriorityResponse(response, tasks);
    } catch (error) {
      console.error('AI task priority analysis failed:', error);
      return this.getFallbackPriorities(tasks);
    }
  }

  // Health Insights Generation
  async generateHealthInsights(
    userId: string,
    healthLogs: HealthLog[],
    timeframe: number = 30, // days
    language: SupportedLanguage = 'en'
  ): Promise<AIHealthInsight[]> {
    if (healthLogs.length < 5) {
      return []; // Need minimum data for insights
    }

    const systemPrompt = this.getSystemPrompt('health_insights', language);
    const healthSummary = this.buildHealthSummary(healthLogs);

    const prompt = `
      ${systemPrompt}
      
      Health data summary for the last ${timeframe} days:
      ${healthSummary}
      
      Generate 2-4 actionable insights based on the data patterns. Consider:
      - Exercise frequency and intensity trends
      - Mood patterns and correlations with activities
      - Nutrition consistency and balance
      - Sleep quality impacts
      - Hydration levels
      
      Provide practical, personalized recommendations. Respond in JSON format.
    `;

    try {
      const response = await this.callOpenAI(prompt, {
        model: 'gpt-4',
        temperature: 0.4,
        max_tokens: 1500
      });

      return this.parseHealthInsights(response, userId, language);
    } catch (error) {
      console.error('AI health insights generation failed:', error);
      return [];
    }
  }

  // AI Meeting Scheduling
  async scheduleAIMeeting(
    request: {
      title: string;
      participants: string[];
      duration: number; // minutes
      preferences?: {
        timeOfDay?: 'morning' | 'afternoon' | 'evening';
        daysOfWeek?: number[]; // 0-6
        urgency?: 'low' | 'medium' | 'high';
      };
    },
    userCalendar: any[], // existing events
    participantAvailability: any[],
    language: SupportedLanguage = 'en'
  ): Promise<AIMeetingSchedule> {
    const systemPrompt = this.getSystemPrompt('meeting_scheduling', language);
    
    const prompt = `
      ${systemPrompt}
      
      Meeting details:
      - Title: ${request.title}
      - Duration: ${request.duration} minutes
      - Participants: ${request.participants.length}
      - Preferences: ${JSON.stringify(request.preferences)}
      
      Calendar constraints:
      ${JSON.stringify(userCalendar)}
      
      Participant availability:
      ${JSON.stringify(participantAvailability)}
      
      Find optimal meeting slots considering:
      - All participants' availability
      - Time zone differences
      - Meeting preferences
      - Work-life balance
      - Buffer time between meetings
      
      Provide 3-5 ranked options with reasoning. Respond in JSON format.
    `;

    try {
      const response = await this.callOpenAI(prompt, {
        model: 'gpt-4',
        temperature: 0.2,
        max_tokens: 1500
      });

      return this.parseMeetingSchedule(response, request);
    } catch (error) {
      console.error('AI meeting scheduling failed:', error);
      return this.getFallbackMeetingOptions(request);
    }
  }

  // Smart Planning from Natural Language
  async createSmartPlan(
    naturalInput: string,
    userContext: {
      timezone: string;
      workingHours: string;
      preferences: any;
      existingTasks: Task[];
    },
    language: SupportedLanguage = 'en'
  ): Promise<AISmartPlan> {
    const systemPrompt = this.getSystemPrompt('smart_planning', language);
    
    const prompt = `
      ${systemPrompt}
      
      User input: "${naturalInput}"
      
      User context:
      - Timezone: ${userContext.timezone}
      - Working hours: ${userContext.workingHours}
      - Existing tasks: ${userContext.existingTasks.length}
      
      Create a detailed plan breaking down the request into specific, actionable tasks. Consider:
      - Task dependencies and logical order
      - Realistic time estimates
      - Energy level requirements
      - Context switching
      - Work-life balance
      
      Respond with a structured plan in JSON format.
    `;

    try {
      const response = await this.callOpenAI(prompt, {
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 2000
      });

      return this.parseSmartPlan(response, naturalInput);
    } catch (error) {
      console.error('AI smart planning failed:', error);
      return this.getFallbackPlan(naturalInput);
    }
  }

  // Voice Transcription and Analysis
  async transcribeAndAnalyze(
    audioUrl: string,
    context: 'reflection' | 'voice_note' | 'task_creation',
    language: SupportedLanguage = 'en'
  ): Promise<{
    transcription: string;
    analysis?: {
      mood?: string;
      insights?: string[];
      actionItems?: string[];
    };
  }> {
    try {
      // First, transcribe using Deepgram (faster and better for real-time)
      const transcription = await this.transcribeAudio(audioUrl, language);

      if (!transcription) {
        throw new Error('Transcription failed');
      }

      // Then analyze the content with OpenAI if it's a reflection
      if (context === 'reflection') {
        const analysis = await this.analyzeReflection(transcription, language);
        return { transcription, analysis };
      }

      return { transcription };
    } catch (error) {
      console.error('Voice transcription/analysis failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async callOpenAI(prompt: string, options: any): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }

  private async transcribeAudio(audioUrl: string, language: SupportedLanguage): Promise<string> {
    // Use Deepgram for audio transcription
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: audioUrl,
        model: language === 'de' ? 'nova-2-german' : 'nova-2-general',
        language: language === 'de' ? 'de' : 'en',
        punctuate: true,
        diarize: false
      })
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  }

  private getSystemPrompt(type: string, language: SupportedLanguage): string {
    const prompts = {
      en: {
        task_priority: 'You are an AI productivity assistant. Analyze tasks and provide priority scores with clear reasoning.',
        health_insights: 'You are an AI wellness coach. Generate actionable health insights based on user data.',
        meeting_scheduling: 'You are an AI scheduling assistant. Find optimal meeting times considering all constraints.',
        smart_planning: 'You are an AI planning assistant. Break down goals into actionable, time-bound tasks.'
      },
      de: {
        task_priority: 'Du bist ein KI-Produktivit�tsassistent. Analysiere Aufgaben und gib Priorit�tsbewertungen mit klarer Begr�ndung.',
        health_insights: 'Du bist ein KI-Wellness-Coach. Generiere umsetzbare Gesundheitseinsichten basierend auf Nutzerdaten.',
        meeting_scheduling: 'Du bist ein KI-Terminplanungsassistent. Finde optimale Besprechungszeiten unter Ber�cksichtigung aller Einschr�nkungen.',
        smart_planning: 'Du bist ein KI-Planungsassistent. Zerlege Ziele in umsetzbare, zeitgebundene Aufgaben.'
      }
    };

    return prompts[language]?.[type as keyof typeof prompts.en] || prompts.en[type as keyof typeof prompts.en];
  }

  private buildTaskContext(tasks: Task[]): string {
    return tasks.map(task => `
      ID: ${task.id}
      Title: ${task.title}
      Description: ${task.description || 'No description'}
      Priority: ${task.priority}
      Status: ${task.status}
      Due: ${task.due_date ? new Date(task.due_date).toISOString() : 'No due date'}
      Duration: ${task.estimated_duration || 'Not estimated'} minutes
      Context: ${task.context_type || 'General'}
    `).join('\n---\n');
  }

  private buildHealthSummary(logs: HealthLog[]): string {
    const summary = {
      exercise: logs.filter(l => l.type === 'exercise'),
      mood: logs.filter(l => l.type === 'mood'),
      nutrition: logs.filter(l => l.type === 'nutrition'),
      hydration: logs.filter(l => l.type === 'hydration')
    };

    return `
      Exercise logs: ${summary.exercise.length} entries
      Mood logs: ${summary.mood.length} entries  
      Nutrition logs: ${summary.nutrition.length} entries
      Hydration logs: ${summary.hydration.length} entries
      
      Recent patterns:
      ${JSON.stringify(summary, null, 2)}
    `;
  }

  private parseTaskPriorityResponse(response: string, tasks: Task[]): AITaskPriority[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((item: any, index: number) => ({
        taskId: tasks[index]?.id || `task_${index}`,
        priority: Math.min(100, Math.max(0, item.priority || 50)),
        reasoning: item.reasoning || 'AI analysis completed',
        confidenceScore: Math.min(1, Math.max(0, item.confidence || 0.5)),
        suggestedTimeSlot: item.suggestedTimeSlot
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackPriorities(tasks);
    }
  }

  private parseHealthInsights(response: string, userId: string, language: SupportedLanguage): AIHealthInsight[] {
    try {
      const parsed = JSON.parse(response);
      return (parsed.insights || []).map((insight: any) => ({
        userId,
        insight: insight.insight || 'General health insight',
        category: insight.category || 'overall',
        confidence: insight.confidence || 0.7,
        recommendations: insight.recommendations || [],
        dataPoints: insight.dataPoints || 0,
        language
      }));
    } catch (error) {
      console.error('Failed to parse health insights:', error);
      return [];
    }
  }

  private parseMeetingSchedule(response: string, request: any): AIMeetingSchedule {
    try {
      const parsed = JSON.parse(response);
      return {
        title: request.title,
        participants: request.participants,
        suggestedSlots: parsed.slots || [],
        conflictAnalysis: parsed.conflicts || {
          hasConflicts: false,
          conflictCount: 0,
          alternatives: 0
        }
      };
    } catch (error) {
      console.error('Failed to parse meeting schedule:', error);
      return this.getFallbackMeetingOptions(request);
    }
  }

  private parseSmartPlan(response: string, input: string): AISmartPlan {
    try {
      const parsed = JSON.parse(response);
      return {
        planId: `plan_${Date.now()}`,
        tasks: parsed.tasks || [],
        totalEstimatedTime: parsed.totalTime || 0,
        confidenceScore: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Plan generated from user input'
      };
    } catch (error) {
      console.error('Failed to parse smart plan:', error);
      return this.getFallbackPlan(input);
    }
  }

  private async analyzeReflection(transcription: string, language: SupportedLanguage): Promise<any> {
    const systemPrompt = language === 'de' 
      ? 'Analysiere diese Reflexion und extrahiere Stimmung, Einsichten und Handlungspunkte.'
      : 'Analyze this reflection and extract mood, insights, and action items.';

    const response = await this.callOpenAI(`${systemPrompt}\n\nText: ${transcription}`, {
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        mood: 'neutral',
        insights: ['Reflection analyzed'],
        actionItems: []
      };
    }
  }

  // Fallback methods for when AI fails
  private getFallbackPriorities(tasks: Task[]): AITaskPriority[] {
    return tasks.map(task => ({
      taskId: task.id,
      priority: this.calculateFallbackPriority(task),
      reasoning: 'Calculated using fallback algorithm',
      confidenceScore: 0.6
    }));
  }

  private calculateFallbackPriority(task: Task): number {
    let priority = task.priority * 20; // Convert 1-4 to 20-80
    
    // Boost priority for overdue tasks
    if (task.due_date && task.due_date < Date.now()) {
      priority += 20;
    }
    
    // Boost for tasks due soon
    if (task.due_date && task.due_date < Date.now() + 86400000) {
      priority += 10;
    }

    return Math.min(100, Math.max(0, priority));
  }

  private getFallbackMeetingOptions(request: any): AIMeetingSchedule {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return {
      title: request.title,
      participants: request.participants,
      suggestedSlots: [
        {
          start: now + oneDay,
          end: now + oneDay + (request.duration * 60 * 1000),
          confidence: 0.5,
          reasoning: 'Next available business day'
        }
      ],
      conflictAnalysis: {
        hasConflicts: false,
        conflictCount: 0,
        alternatives: 1
      }
    };
  }

  private getFallbackPlan(input: string): AISmartPlan {
    return {
      planId: `plan_${Date.now()}`,
      tasks: [
        {
          title: input,
          description: 'Auto-generated from user input',
          priority: 50,
          estimatedDuration: 60,
          suggestedTime: Date.now() + 3600000, // 1 hour from now
          energyLevel: 5,
          context: 'general'
        }
      ],
      totalEstimatedTime: 60,
      confidenceScore: 0.3,
      reasoning: 'Fallback plan generated due to AI service unavailability'
    };
  }
}