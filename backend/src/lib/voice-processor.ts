// Voice Processing Service for Time & Wellness Application
import type { Env } from './env';
import { DatabaseService } from './db';
import type { SupportedLanguage } from '../types/database';

export interface VoiceRecording {
  id: string;
  user_id: string;
  recording_type: 'voice_note' | 'reflection' | 'task_creation' | 'meeting_note' | 'health_log' | 'habit_reminder';
  title?: string;
  description?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  audio_format: 'mp3' | 'wav' | 'm4a' | 'ogg' | 'webm';
  r2_key: string;
  r2_url: string;
  upload_status: 'uploading' | 'completed' | 'failed' | 'processing';
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  transcription_text?: string;
  transcription_confidence?: number;
  ai_analysis?: any;
  related_entity_type?: string;
  related_entity_id?: string;
  tags?: string[];
  is_private: boolean;
  created_at: number;
}

export interface VoiceUploadRequest {
  user_id: string;
  recording_type: VoiceRecording['recording_type'];
  title?: string;
  description?: string;
  audio_format: VoiceRecording['audio_format'];
  file_size_bytes?: number;
  duration_seconds?: number;
  related_entity_type?: string;
  related_entity_id?: string;
  tags?: string[];
  transcription_language?: string;
  enable_ai_analysis?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface AIAnalysisResult {
  summary?: string;
  mood?: {
    primary: string;
    confidence: number;
    emotions: Array<{ emotion: string; intensity: number }>;
  };
  insights?: string[];
  action_items?: Array<{
    task: string;
    priority: 'low' | 'medium' | 'high';
    due_date?: number;
  }>;
  health_data?: {
    activities?: string[];
    mood_score?: number;
    energy_level?: number;
    symptoms?: string[];
  };
  keywords?: string[];
  categories?: string[];
  confidence_score: number;
}

export class VoiceProcessor {
  private db: DatabaseService;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.db = new DatabaseService(env);
  }

  // Upload audio file to R2 and create voice recording
  async uploadVoiceRecording(
    audioBuffer: ArrayBuffer,
    request: VoiceUploadRequest
  ): Promise<VoiceRecording> {
    try {
      const recordingId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const r2Key = `voice-recordings/${request.user_id}/${recordingId}.${request.audio_format}`;
      
      // Upload to R2
      const uploadResult = await this.env.ASSETS.put(r2Key, audioBuffer, {
        httpMetadata: {
          contentType: this.getContentType(request.audio_format),
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: {
          userId: request.user_id,
          recordingType: request.recording_type,
          uploadedAt: Date.now().toString()
        }
      });

      if (!uploadResult) {
        throw new Error('Failed to upload audio file to R2');
      }

      // Generate R2 public URL
      const r2Url = `https://wellness-audio.${this.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${r2Key}`;

      // Create voice recording record
      const recording: VoiceRecording = {
        id: recordingId,
        user_id: request.user_id,
        recording_type: request.recording_type,
        title: request.title,
        description: request.description,
        duration_seconds: request.duration_seconds,
        file_size_bytes: request.file_size_bytes || audioBuffer.byteLength,
        audio_format: request.audio_format,
        r2_key: r2Key,
        r2_url: r2Url,
        upload_status: 'completed',
        transcription_status: 'pending',
        related_entity_type: request.related_entity_type,
        related_entity_id: request.related_entity_id,
        tags: request.tags,
        is_private: true,
        created_at: Date.now()
      };

      // Store in database
      await this.storeVoiceRecording(recording, request.transcription_language);

      // Queue transcription job (handled by database trigger)
      console.log(`Voice recording ${recordingId} uploaded and queued for processing`);

      return recording;
    } catch (error) {
      console.error('Voice upload failed:', error);
      throw new Error('Failed to upload voice recording');
    }
  }

  // Process transcription using Deepgram
  async transcribeAudio(recordingId: string): Promise<TranscriptionResult> {
    try {
      const recording = await this.getVoiceRecording(recordingId);
      if (!recording) {
        throw new Error('Recording not found');
      }

      // Update status to processing
      await this.updateRecordingStatus(recordingId, { transcription_status: 'processing' });

      // Get audio file from R2
      const audioObject = await this.env.ASSETS.get(recording.r2_key);
      if (!audioObject) {
        throw new Error('Audio file not found in R2');
      }

      const audioBuffer = await audioObject.arrayBuffer();

      // Transcribe with Deepgram
      const transcriptionResult = await this.callDeepgramAPI(audioBuffer, recording);

      // Update recording with transcription
      await this.updateRecordingStatus(recordingId, {
        transcription_status: 'completed',
        transcription_text: transcriptionResult.text,
        transcription_confidence: transcriptionResult.confidence
      });

      return transcriptionResult;
    } catch (error) {
      console.error('Transcription failed:', error);
      await this.updateRecordingStatus(recordingId, {
        transcription_status: 'failed',
        transcription_error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Analyze transcribed content with AI
  async analyzeVoiceContent(recordingId: string): Promise<AIAnalysisResult> {
    try {
      const recording = await this.getVoiceRecording(recordingId);
      if (!recording || !recording.transcription_text) {
        throw new Error('Recording or transcription not found');
      }

      // Update status to processing
      await this.updateRecordingStatus(recordingId, { ai_analysis_status: 'processing' });

      // Analyze with OpenAI based on recording type
      const analysisResult = await this.analyzeWithOpenAI(
        recording.transcription_text,
        recording.recording_type
      );

      // Update recording with analysis
      await this.updateRecordingStatus(recordingId, {
        ai_analysis_status: 'completed',
        ai_analysis: analysisResult
      });

      // Create related entities if needed (tasks, health logs, etc.)
      await this.createRelatedEntities(recording, analysisResult);

      return analysisResult;
    } catch (error) {
      console.error('AI analysis failed:', error);
      await this.updateRecordingStatus(recordingId, {
        ai_analysis_status: 'failed'
      });
      throw error;
    }
  }

  // Get user's voice recordings with filtering
  async getUserVoiceRecordings(
    userId: string,
    filters: {
      recording_type?: VoiceRecording['recording_type'];
      status?: string;
      search?: string;
      start_date?: number;
      end_date?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ recordings: VoiceRecording[]; total: number; hasMore: boolean }> {
    let query = `
      SELECT * FROM voice_recordings 
      WHERE user_id = ? AND is_archived = false
    `;
    const params = [userId];

    if (filters.recording_type) {
      query += ' AND recording_type = ?';
      params.push(filters.recording_type);
    }

    if (filters.status) {
      query += ' AND upload_status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR transcription_text LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.start_date) {
      query += ' AND created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND created_at <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY created_at DESC';

    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.offset || 0;

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db.query(countQuery, params);
    const total = countResult.results?.[0]?.count || 0;

    // Get paginated results
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    const result = await this.db.query(query, params);

    const recordings = (result.results || []).map(this.mapDatabaseRowToRecording);

    return {
      recordings,
      total,
      hasMore: offset + recordings.length < total
    };
  }


  // Get voice recording analytics
  async getVoiceAnalytics(userId: string, days: number = 30): Promise<{
    totalRecordings: number;
    totalDuration: number;
    averageDuration: number;
    transcriptionRate: number;
    analysisRate: number;
    typeBreakdown: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number; duration: number }>;
  }> {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

    const [summaryResult, typeResult, dailyResult] = await Promise.all([
      this.db.query(`
        SELECT 
          COUNT(*) as total_recordings,
          SUM(COALESCE(duration_seconds, 0)) as total_duration,
          AVG(COALESCE(duration_seconds, 0)) as avg_duration,
          COUNT(CASE WHEN transcription_status = 'completed' THEN 1 END) as transcribed_count,
          COUNT(CASE WHEN ai_analysis_status = 'completed' THEN 1 END) as analyzed_count
        FROM voice_recordings 
        WHERE user_id = ? AND created_at >= ? AND is_archived = false
      `, [userId, startDate]),

      this.db.query(`
        SELECT recording_type, COUNT(*) as count
        FROM voice_recordings 
        WHERE user_id = ? AND created_at >= ? AND is_archived = false
        GROUP BY recording_type
      `, [userId, startDate]),

      this.db.query(`
        SELECT 
          DATE(datetime(created_at/1000, 'unixepoch')) as date,
          COUNT(*) as count,
          SUM(COALESCE(duration_seconds, 0)) as duration
        FROM voice_recordings 
        WHERE user_id = ? AND created_at >= ? AND is_archived = false
        GROUP BY DATE(datetime(created_at/1000, 'unixepoch'))
        ORDER BY date DESC
      `, [userId, startDate])
    ]);

    const summary = summaryResult.results?.[0] || {};
    const typeBreakdown: Record<string, number> = {};
    
    (typeResult.results || []).forEach((row: any) => {
      typeBreakdown[row.recording_type] = row.count;
    });

    const dailyActivity = (dailyResult.results || []).map((row: any) => ({
      date: row.date,
      count: row.count,
      duration: row.duration || 0
    }));

    return {
      totalRecordings: summary.total_recordings || 0,
      totalDuration: summary.total_duration || 0,
      averageDuration: summary.avg_duration || 0,
      transcriptionRate: summary.total_recordings > 0 ? 
        (summary.transcribed_count / summary.total_recordings) * 100 : 0,
      analysisRate: summary.total_recordings > 0 ? 
        (summary.analyzed_count / summary.total_recordings) * 100 : 0,
      typeBreakdown,
      dailyActivity
    };
  }

  // Interpret voice command using AI
  async interpretVoiceCommand(text: string, userId: string, context?: any): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
    suggestedAction: any;
    alternatives?: any[];
    clarificationNeeded?: boolean;
    suggestedClarifications?: string[];
  }> {
    try {
      const systemPrompt = `You are a voice command interpreter for a productivity app. Analyze the user's voice command and extract:
1. Intent (create_task, log_health, schedule_meeting, set_reminder, etc.)
2. Entities (specific data like task title, priority, date, etc.)
3. Confidence score (0-1)
4. Suggested action with parameters

Respond with JSON only.`;

      const userPrompt = `Command: "${text}"
Context: ${JSON.stringify(context || {})}

Extract the intent and entities from this voice command.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const interpretation = JSON.parse(data.choices[0].message.content);

      // Add default values if missing, including clarification properties
      const result = {
        intent: interpretation.intent || 'unknown',
        entities: interpretation.entities || {},
        confidence: interpretation.confidence || 0.5,
        suggestedAction: interpretation.suggestedAction || { type: 'none', parameters: {} },
        alternatives: interpretation.alternatives || [],
        clarificationNeeded: interpretation.clarificationNeeded,
        suggestedClarifications: interpretation.suggestedClarifications
      };

      // Add clarification properties for unclear commands if not already provided
      if ((result.intent === 'unclear' || result.confidence <= 0.3) && !result.clarificationNeeded) {
        result.clarificationNeeded = true;
        result.suggestedClarifications = [
          'What would you like to do?',
          'Please be more specific about your request',
          'Try saying "create a task" or "log my workout"'
        ];
      }

      return result;
    } catch (error) {
      console.error('Voice command interpretation error:', error);
      // Return fallback interpretation
      return {
        intent: 'unknown',
        entities: { text },
        confidence: 0.1,
        suggestedAction: { type: 'manual_review', parameters: { originalText: text } }
      };
    }
  }

  // Execute voice command based on intent and entities
  async executeVoiceCommand(intent: string, entities: Record<string, any>, userId: string, confirmExecution: boolean = false): Promise<{
    success: boolean;
    message: string;
    data?: any;
    requiresConfirmation?: boolean;
  }> {
    try {
      switch (intent) {
        case 'create_task':
          return await this.executeCreateTask(entities, userId, confirmExecution);
        
        case 'log_health':
          return await this.executeLogHealth(entities, userId, confirmExecution);
        
        case 'schedule_meeting':
          return await this.executeScheduleMeeting(entities, userId, confirmExecution);
        
        case 'set_reminder':
          return await this.executeSetReminder(entities, userId, confirmExecution);
        
        default:
          return {
            success: false,
            message: `Unknown intent: ${intent}`,
            requiresConfirmation: false
          };
      }
    } catch (error) {
      console.error('Voice command execution error:', error);
      return {
        success: false,
        message: 'Failed to execute voice command',
        requiresConfirmation: false
      };
    }
  }

  // Execute task creation command
  private async executeCreateTask(entities: Record<string, any>, userId: string, confirmExecution: boolean): Promise<any> {
    if (!confirmExecution) {
      return {
        success: false,
        message: 'Task creation requires confirmation',
        requiresConfirmation: true,
        data: {
          preview: {
            title: entities.title || 'Untitled Task',
            priority: entities.priority || 'medium',
            dueDate: entities.dueDate || null,
            description: entities.description || null
          }
        }
      };
    }

    // Create the task
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    await this.db.query(`
      INSERT INTO tasks (id, user_id, title, description, priority, due_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      taskId,
      userId,
      entities.title || 'Voice Created Task',
      entities.description || null,
      entities.priority || 'medium',
      entities.dueDate || null,
      now,
      now
    ]);

    return {
      success: true,
      message: `Task "${entities.title || 'Untitled'}" created successfully`,
      data: { taskId, title: entities.title }
    };
  }

  // Execute health logging command
  private async executeLogHealth(entities: Record<string, any>, userId: string, confirmExecution: boolean): Promise<any> {
    if (!confirmExecution) {
      return {
        success: false,
        message: 'Health logging requires confirmation',
        requiresConfirmation: true,
        data: {
          preview: {
            activity: entities.activity || 'Unknown activity',
            duration: entities.duration || null,
            unit: entities.unit || 'minutes',
            notes: entities.notes || null
          }
        }
      };
    }

    // Log the health activity
    const logId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    await this.db.query(`
      INSERT INTO health_logs (id, user_id, activity_type, duration_minutes, notes, logged_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      logId,
      userId,
      entities.activity || 'exercise',
      entities.duration || 0,
      entities.notes || `Voice logged: ${entities.activity}`,
      now,
      now
    ]);

    return {
      success: true,
      message: `Health activity "${entities.activity}" logged successfully`,
      data: { logId, activity: entities.activity, duration: entities.duration }
    };
  }

  // Execute meeting scheduling command
  private async executeScheduleMeeting(entities: Record<string, any>, userId: string, confirmExecution: boolean): Promise<any> {
    if (!confirmExecution) {
      return {
        success: false,
        message: 'Meeting scheduling requires confirmation',
        requiresConfirmation: true,
        data: {
          preview: {
            title: entities.title || 'Voice Scheduled Meeting',
            duration: entities.duration || 60,
            participants: entities.participants || [],
            suggestedTime: entities.suggestedTime || null
          }
        }
      };
    }

    // Create meeting request
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    await this.db.query(`
      INSERT INTO calendar_events (id, user_id, title, description, "start", "end", event_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'meeting', ?)
    `, [
      meetingId,
      userId,
      entities.title || 'Voice Scheduled Meeting',
      `Meeting scheduled via voice command`,
      entities.suggestedTime || (now + 3600000), // Default to 1 hour from now
      entities.suggestedTime ? entities.suggestedTime + (entities.duration * 60000) : (now + 7200000),
      now
    ]);

    return {
      success: true,
      message: `Meeting "${entities.title || 'Untitled'}" scheduled successfully`,
      data: { meetingId, title: entities.title }
    };
  }

  // Execute reminder setting command
  private async executeSetReminder(entities: Record<string, any>, userId: string, confirmExecution: boolean): Promise<any> {
    if (!confirmExecution) {
      return {
        success: false,
        message: 'Reminder setting requires confirmation',
        requiresConfirmation: true,
        data: {
          preview: {
            message: entities.message || 'Voice reminder',
            time: entities.time || null,
            recurring: entities.recurring || false
          }
        }
      };
    }

    // Create reminder
    const reminderId = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    await this.db.query(`
      INSERT INTO reminders (id, user_id, message, remind_at, is_recurring, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      reminderId,
      userId,
      entities.message || 'Voice reminder',
      entities.time || (now + 3600000), // Default to 1 hour from now
      entities.recurring ? 1 : 0,
      now
    ]);

    return {
      success: true,
      message: `Reminder "${entities.message || 'Untitled'}" set successfully`,
      data: { reminderId, message: entities.message }
    };
  }

  // Delete voice recording and cleanup R2 file
  async deleteVoiceRecording(recordingId: string, userId: string): Promise<void> {
    try {
      const recording = await this.getVoiceRecording(recordingId);
      if (!recording || recording.user_id !== userId) {
        throw new Error('Recording not found or access denied');
      }

      // Delete from R2
      await this.env.ASSETS.delete(recording.r2_key);

      // Delete from database
      await this.db.query(`
        DELETE FROM voice_recordings WHERE id = ? AND user_id = ?
      `, [recordingId, userId]);

      // Delete related processing jobs
      await this.db.query(`
        DELETE FROM voice_processing_jobs WHERE recording_id = ?
      `, [recordingId]);

      console.log(`Voice recording ${recordingId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete voice recording:', error);
      throw error;
    }
  }

  // Private helper methods
  private async storeVoiceRecording(recording: VoiceRecording, transcriptionLanguage?: string): Promise<void> {
    await this.db.query(`
      INSERT INTO voice_recordings (
        id, user_id, recording_type, title, description, duration_seconds,
        file_size_bytes, audio_format, r2_key, r2_url, upload_status,
        transcription_status, transcription_language, related_entity_type,
        related_entity_id, tags, is_private, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recording.id, recording.user_id, recording.recording_type, recording.title,
      recording.description, recording.duration_seconds, recording.file_size_bytes,
      recording.audio_format, recording.r2_key, recording.r2_url, recording.upload_status,
      recording.transcription_status, transcriptionLanguage || 'auto',
      recording.related_entity_type, recording.related_entity_id,
      JSON.stringify(recording.tags || []), recording.is_private ? 1 : 0,
      recording.created_at, recording.created_at
    ]);
  }

  private async getVoiceRecording(recordingId: string): Promise<VoiceRecording | null> {
    const result = await this.db.query(`
      SELECT * FROM voice_recordings WHERE id = ?
    `, [recordingId]);

    const row = result.results?.[0];
    return row ? this.mapDatabaseRowToRecording(row) : null;
  }

  private async updateRecordingStatus(recordingId: string, updates: any): Promise<void> {
    const updateFields = [];
    const updateValues = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return;

    updateFields.push('updated_at = ?');
    updateValues.push(Date.now());
    updateValues.push(recordingId);

    await this.db.query(`
      UPDATE voice_recordings 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
  }

  private async callDeepgramAPI(audioBuffer: ArrayBuffer, recording: VoiceRecording): Promise<TranscriptionResult> {
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.env.DEEPGRAM_API_KEY}`,
        'Content-Type': this.getContentType(recording.audio_format)
      },
      body: audioBuffer
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0];

    if (!transcript) {
      throw new Error('No transcription result from Deepgram');
    }

    return {
      text: transcript.transcript || '',
      confidence: transcript.confidence || 0,
      language: data.results?.channels?.[0]?.detected_language || 'en',
      words: transcript.words || [],
      segments: data.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs?.[0]?.sentences || []
    };
  }

  private async analyzeWithOpenAI(text: string, recordingType: string): Promise<AIAnalysisResult> {
    const systemPrompt = this.getAnalysisPrompt(recordingType);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis result from OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      // If JSON parsing fails, return a basic analysis
      return {
        summary: content,
        confidence_score: 0.7,
        keywords: this.extractKeywords(text),
        categories: [recordingType]
      };
    }
  }

  private getAnalysisPrompt(recordingType: string): string {
    const prompts = {
      voice_note: 'Analyze this voice note and extract key insights, mood, and actionable items. Return JSON with summary, mood, insights, action_items, keywords, and confidence_score.',
      reflection: 'Analyze this daily reflection and identify mood, insights, patterns, and areas for improvement. Return JSON with summary, mood, insights, keywords, and confidence_score.',
      task_creation: 'Extract tasks from this voice input. Identify task titles, priorities, due dates, and descriptions. Return JSON with action_items array, each with task, priority, due_date, keywords, and confidence_score.',
      health_log: 'Extract health-related information from this voice log. Identify activities, mood, energy levels, and symptoms. Return JSON with health_data object, mood, insights, and confidence_score.',
      meeting_note: 'Analyze these meeting notes and extract key decisions, action items, and important points. Return JSON with summary, action_items, insights, keywords, and confidence_score.',
      habit_reminder: 'Analyze this habit check-in response. Assess progress, challenges, and satisfaction. Return JSON with summary, mood, insights, progress indicators, and confidence_score.'
    };

    return prompts[recordingType as keyof typeof prompts] || prompts.voice_note;
  }

  private async createRelatedEntities(recording: VoiceRecording, analysis: AIAnalysisResult): Promise<void> {
    try {
      // Create tasks from action items
      if (analysis.action_items && analysis.action_items.length > 0) {
        for (const actionItem of analysis.action_items) {
          await this.db.query(`
            INSERT INTO tasks (
              id, user_id, title, description, priority, status, due_date,
              ai_priority_score, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            `task_voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recording.user_id,
            actionItem.task,
            `Created from voice recording: ${recording.title || 'Voice Note'}`,
            this.mapPriorityToNumber(actionItem.priority),
            'pending',
            actionItem.due_date || null,
            0.8, // High confidence for voice-created tasks
            Date.now(),
            Date.now()
          ]);
        }
      }

      // Create health log entries
      if (recording.recording_type === 'health_log' && analysis.health_data) {
        await this.db.query(`
          INSERT INTO health_logs (
            id, user_id, type, payload, recorded_at, source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          `health_voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recording.user_id,
          'mood',
          JSON.stringify(analysis.health_data),
          recording.created_at,
          'manual',
          Date.now()
        ]);
      }
    } catch (error) {
      console.error('Failed to create related entities:', error);
      // Don't throw - this is not critical for the voice processing
    }
  }

  private mapDatabaseRowToRecording(row: any): VoiceRecording {
    return {
      id: row.id,
      user_id: row.user_id,
      recording_type: row.recording_type,
      title: row.title,
      description: row.description,
      duration_seconds: row.duration_seconds,
      file_size_bytes: row.file_size_bytes,
      audio_format: row.audio_format,
      r2_key: row.r2_key,
      r2_url: row.r2_url,
      upload_status: row.upload_status,
      transcription_status: row.transcription_status,
      transcription_text: row.transcription_text,
      transcription_confidence: row.transcription_confidence,
      ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : undefined,
      related_entity_type: row.related_entity_type,
      related_entity_id: row.related_entity_id,
      tags: row.tags ? JSON.parse(row.tags) : [],
      is_private: Boolean(row.is_private),
      created_at: row.created_at
    };
  }

  private getContentType(format: string): string {
    const contentTypes = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
      webm: 'audio/webm'
    };
    return contentTypes[format as keyof typeof contentTypes] || 'audio/mpeg';
  }

  private mapPriorityToNumber(priority: string): number {
    const priorityMap = { low: 1, medium: 2, high: 3 };
    return priorityMap[priority as keyof typeof priorityMap] || 2;
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use more sophisticated NLP
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }
}