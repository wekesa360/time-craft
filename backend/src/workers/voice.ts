// Voice Processing Worker with R2 Storage Integration
import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import type { Env } from '../lib/env';
import { DatabaseService } from '../lib/db';
import type { SupportedLanguage } from '../types/database';
import { VoiceProcessor, type VoiceUploadRequest } from '../lib/voice-processor';
import { queueNotification } from '../lib/notifications';

const voice = new Hono<{ Bindings: Env }>();

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

// ========== VOICE RECORDING ENDPOINTS ==========

// POST /voice/upload - Upload audio file for processing
const uploadSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  recordingType: z.enum(['voice_note', 'reflection', 'task_creation', 'meeting_note', 'health_log', 'habit_reminder']).default('voice_note'),
  audioFormat: z.enum(['mp3', 'wav', 'm4a', 'ogg', 'webm']),
  durationSeconds: z.number().positive().optional(),
  transcriptionLanguage: z.enum(['en', 'de', 'auto']).default('auto'),
  enableAIAnalysis: z.boolean().default(true),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(10).optional()
});

voice.post('/upload', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Get form data
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const metadataStr = formData.get('metadata') as string;

    if (!audioFile) {
      return c.json({ error: 'Audio file is required' }, 400);
    }

    if (!metadataStr) {
      return c.json({ error: 'Metadata is required' }, 400);
    }

    // Parse and validate metadata
    const metadata = JSON.parse(metadataStr);
    const validatedMetadata = uploadSchema.parse(metadata);

    // Convert file to buffer
    const audioBuffer = await audioFile.arrayBuffer();

    // Create upload request
    const uploadRequest: VoiceUploadRequest = {
      user_id: auth.userId,
      recording_type: validatedMetadata.recordingType,
      title: validatedMetadata.title,
      description: validatedMetadata.description,
      audio_format: validatedMetadata.audioFormat,
      file_size_bytes: audioBuffer.byteLength,
      duration_seconds: validatedMetadata.durationSeconds,
      related_entity_type: validatedMetadata.relatedEntityType,
      related_entity_id: validatedMetadata.relatedEntityId,
      tags: validatedMetadata.tags,
      transcription_language: validatedMetadata.transcriptionLanguage,
      enable_ai_analysis: validatedMetadata.enableAIAnalysis
    };

    // Process upload
    const voiceProcessor = new VoiceProcessor(c.env);
    const recording = await voiceProcessor.uploadVoiceRecording(audioBuffer, uploadRequest);

    // Send notification for successful upload
    try {
      await queueNotification(c.env, {
        type: 'social_update',
        userId: auth.userId,
        data: {
          message: `Voice recording "${recording.title || 'Untitled'}" uploaded successfully and is being processed.`
        }
      });
    } catch (notificationError) {
      console.warn('Failed to send upload notification:', notificationError);
    }

    // Log analytics
    c.env.ANALYTICS?.writeDataPoint({
      blobs: [auth.userId, 'voice_upload', validatedMetadata.recordingType],
      doubles: [Date.now(), audioBuffer.byteLength, validatedMetadata.durationSeconds || 0],
      indexes: ['voice_usage']
    });

    return c.json({
      message: 'Voice recording uploaded successfully',
      recording: {
        id: recording.id,
        title: recording.title,
        recordingType: recording.recording_type,
        audioUrl: recording.r2_url,
        uploadStatus: recording.upload_status,
        transcriptionStatus: recording.transcription_status,
        duration: recording.duration_seconds,
        fileSize: recording.file_size_bytes,
        createdAt: recording.created_at
      }
    }, 201);
  } catch (error) {
    console.error('Voice upload error:', error);
    return c.json({ error: 'Failed to upload voice recording' }, 500);
  }
});

// GET /voice/recordings - Get user's voice recordings
const recordingsFiltersSchema = z.object({
  recordingType: z.enum(['voice_note', 'reflection', 'task_creation', 'meeting_note', 'health_log', 'habit_reminder']).optional(),
  status: z.enum(['uploading', 'completed', 'failed', 'processing']).optional(),
  search: z.string().max(100).optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

voice.get('/recordings', zValidator('query', recordingsFiltersSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const filters = c.req.valid('query');
    const voiceProcessor = new VoiceProcessor(c.env);

    const result = await voiceProcessor.getUserVoiceRecordings(auth.userId, {
      recording_type: filters.recordingType,
      status: filters.status,
      search: filters.search,
      start_date: filters.startDate,
      end_date: filters.endDate,
      limit: filters.limit,
      offset: filters.offset
    });

    return c.json({
      recordings: result.recordings.map(recording => ({
        id: recording.id,
        title: recording.title,
        description: recording.description,
        recordingType: recording.recording_type,
        audioUrl: recording.r2_url,
        uploadStatus: recording.upload_status,
        transcriptionStatus: recording.transcription_status,
        transcriptionText: recording.transcription_text,
        transcriptionConfidence: recording.transcription_confidence,
        aiAnalysis: recording.ai_analysis,
        duration: recording.duration_seconds,
        fileSize: recording.file_size_bytes,
        audioFormat: recording.audio_format,
        tags: recording.tags,
        relatedEntityType: recording.related_entity_type,
        relatedEntityId: recording.related_entity_id,
        createdAt: recording.created_at
      })),
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: result.total,
        hasMore: result.hasMore
      }
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    return c.json({ error: 'Failed to get voice recordings' }, 500);
  }
});

// GET /voice/recordings/:id - Get specific voice recording
voice.get('/recordings/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const recordingId = c.req.param('id');
    const db = new DatabaseService(c.env);

    const result = await db.query(`
      SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?
    `, [recordingId, auth.userId]);

    if (!result.results || result.results.length === 0) {
      return c.json({ error: 'Recording not found' }, 404);
    }

    const recording = result.results[0];

    // Update play count
    await db.query(`
      UPDATE voice_recordings SET play_count = play_count + 1 WHERE id = ?
    `, [recordingId]);

    return c.json({
      recording: {
        id: recording.id,
        title: recording.title,
        description: recording.description,
        recordingType: recording.recording_type,
        audioUrl: recording.r2_url,
        uploadStatus: recording.upload_status,
        transcriptionStatus: recording.transcription_status,
        transcriptionText: recording.transcription_text,
        transcriptionConfidence: recording.transcription_confidence,
        aiAnalysis: recording.ai_analysis ? JSON.parse(recording.ai_analysis) : null,
        duration: recording.duration_seconds,
        fileSize: recording.file_size_bytes,
        audioFormat: recording.audio_format,
        tags: recording.tags ? JSON.parse(recording.tags) : [],
        playCount: recording.play_count + 1,
        lastPlayedAt: Date.now(),
        createdAt: recording.created_at
      }
    });
  } catch (error) {
    console.error('Get recording error:', error);
    return c.json({ error: 'Failed to get voice recording' }, 500);
  }
});

// DELETE /voice/recordings/:id - Delete voice recording
voice.delete('/recordings/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const recordingId = c.req.param('id');
    const voiceProcessor = new VoiceProcessor(c.env);

    await voiceProcessor.deleteVoiceRecording(recordingId, auth.userId);

    return c.json({ message: 'Voice recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error);
    return c.json({ error: 'Failed to delete voice recording' }, 500);
  }
});

// ========== VOICE PROCESSING ENDPOINTS ==========

// POST /voice/transcribe - Transcribe audio directly using Deepgram
voice.post('/transcribe', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { audioData, format, sampleRate, language } = body;

    if (!audioData) {
      return c.json({ error: 'Audio data is required' }, 400);
    }

    // Validate audio format
    const supportedFormats = ['webm', 'wav', 'mp3', 'm4a', 'ogg'];
    if (format && !supportedFormats.includes(format)) {
      return c.json({ error: 'Unsupported audio format' }, 400);
    }

    // Validate file size (50MB limit)
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    if (audioData.length > maxSizeBytes) {
      return c.json({ error: 'File too large' }, 413);
    }

    // Call Deepgram API for transcription
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${c.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'nova-2',
        language: language || 'en-US',
        smart_format: true,
        punctuate: true,
        diarize: false
      })
    });

    if (!deepgramResponse.ok) {
      const errorData = await deepgramResponse.json();
      return c.json({ error: 'Transcription service error' }, 400);
    }

    const deepgramData = await deepgramResponse.json();
    const transcript = deepgramData.results?.channels?.[0]?.alternatives?.[0];

    if (!transcript) {
      return c.json({ error: 'No transcription result' }, 400);
    }

    return c.json({
      transcription: {
        text: transcript.transcript,
        confidence: transcript.confidence,
        duration: deepgramData.metadata?.duration || 0,
        language: deepgramData.metadata?.language || language || 'en-US'
      },
      metadata: {
        language: deepgramData.metadata?.language || language || 'en-US',
        format: format || 'webm'
      }
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return c.json({ error: 'Transcription failed' }, 500);
  }
});

// POST /voice/transcribe/stream - Handle streaming transcription using Deepgram
voice.post('/transcribe/stream', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { sessionId, audioChunk, isLast } = body;

    if (!sessionId) {
      return c.json({ error: 'Session ID is required' }, 400);
    }

    // Store streaming data in KV
    const streamKey = `voice_stream_${sessionId}`;
    const existingData = await c.env.CACHE.get(streamKey);
    const streamData = existingData ? JSON.parse(existingData) : { chunks: [], startTime: Date.now() };

    if (isLast) {
      // Process final chunk with Deepgram
      const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${c.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          punctuate: true,
          diarize: false
        })
      });

      if (!deepgramResponse.ok) {
        return c.json({ error: 'Streaming transcription failed' }, 500);
      }

      const deepgramData = await deepgramResponse.json();
      const transcript = deepgramData.results?.channels?.[0]?.alternatives?.[0];

      // Clean up KV data
      await c.env.CACHE.delete(streamKey);

      return c.json({
        sessionId,
        isComplete: true,
        finalTranscript: transcript?.transcript || '',
        confidence: transcript?.confidence || 0
      });
    } else {
      // Store partial chunk
      streamData.chunks.push(audioChunk);
      await c.env.CACHE.put(streamKey, JSON.stringify(streamData));

      return c.json({
        sessionId,
        partialTranscript: 'Processing audio chunk...',
        isComplete: false
      });
    }
  } catch (error) {
    console.error('Streaming transcription error:', error);
    return c.json({ error: 'Streaming transcription failed' }, 500);
  }
});

// POST /voice/transcribe/:id - Manually trigger transcription
voice.post('/transcribe/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const recordingId = c.req.param('id');
    const voiceProcessor = new VoiceProcessor(c.env);

    // Verify ownership
    const db = new DatabaseService(c.env);
    const ownershipCheck = await db.query(`
      SELECT id FROM voice_recordings WHERE id = ? AND user_id = ?
    `, [recordingId, auth.userId]);

    if (!ownershipCheck.results || ownershipCheck.results.length === 0) {
      return c.json({ error: 'Recording not found' }, 404);
    }

    // Trigger transcription
    const result = await voiceProcessor.transcribeAudio(recordingId);

    return c.json({
      message: 'Transcription completed successfully',
      transcription: {
        text: result.text,
        confidence: result.confidence,
        language: result.language,
        wordCount: result.text.split(' ').length
      }
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return c.json({ error: 'Transcription failed' }, 500);
  }
});

// POST /voice/analyze/:id - Manually trigger AI analysis
voice.post('/analyze/:id', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const recordingId = c.req.param('id');
    const voiceProcessor = new VoiceProcessor(c.env);

    // Verify ownership
    const db = new DatabaseService(c.env);
    const ownershipCheck = await db.query(`
      SELECT id FROM voice_recordings WHERE id = ? AND user_id = ?
    `, [recordingId, auth.userId]);

    if (!ownershipCheck.results || ownershipCheck.results.length === 0) {
      return c.json({ error: 'Recording not found' }, 404);
    }

    // Trigger AI analysis
    const result = await voiceProcessor.analyzeVoiceContent(recordingId);

    return c.json({
      message: 'AI analysis completed successfully',
      analysis: result
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return c.json({ error: 'AI analysis failed' }, 500);
  }
});

// ========== VOICE TEMPLATES ==========

// GET /voice/templates - Get voice recording templates
voice.get('/templates', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const result = await db.query(`
      SELECT * FROM voice_templates WHERE is_active = true ORDER BY recording_type
    `);

    const templates = (result.results || []).map((template: any) => ({
      id: template.id,
      key: template.template_key,
      name: auth.language === 'de' ? template.name_de : template.name_en,
      description: auth.language === 'de' ? template.description_de : template.description_en,
      recordingType: template.recording_type,
      suggestedDuration: template.suggested_duration,
      promptText: auth.language === 'de' ? template.prompt_text_de : template.prompt_text_en,
      aiAnalysisConfig: template.ai_analysis_config ? JSON.parse(template.ai_analysis_config) : null
    }));

    return c.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return c.json({ error: 'Failed to get voice templates' }, 500);
  }
});

// ========== VOICE ANALYTICS ==========

// GET /voice/analytics - Get voice usage analytics
voice.get('/analytics', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const days = parseInt(c.req.query('days') || '30');
    const voiceProcessor = new VoiceProcessor(c.env);

    const analytics = await voiceProcessor.getVoiceAnalytics(auth.userId, days);

    return c.json({
      analytics: {
        ...analytics,
        period: {
          days,
          startDate: Date.now() - (days * 24 * 60 * 60 * 1000),
          endDate: Date.now()
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return c.json({ error: 'Failed to get voice analytics' }, 500);
  }
});

// ========== VOICE COMMANDS ==========

// POST /voice/commands/interpret - Interpret voice command
const interpretCommandSchema = z.object({
  text: z.string().min(1).max(1000),
  context: z.object({
    currentView: z.string().optional(),
    recentActions: z.array(z.string()).optional()
  }).optional()
});

voice.post('/commands/interpret', zValidator('json', interpretCommandSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { text, context } = c.req.valid('json');
    const voiceProcessor = new VoiceProcessor(c.env);

    const interpretation = await voiceProcessor.interpretVoiceCommand(text, auth.userId, context);

    return c.json({
      intent: interpretation.intent,
      entities: interpretation.entities,
      confidence: interpretation.confidence,
      suggestedAction: interpretation.suggestedAction,
      alternatives: interpretation.alternatives || []
    });
  } catch (error) {
    console.error('Command interpretation error:', error);
    return c.json({ error: 'Failed to interpret voice command' }, 500);
  }
});

// POST /voice/commands/execute - Execute interpreted voice command
const executeCommandSchema = z.object({
  intent: z.string(),
  entities: z.record(z.any()),
  confirmExecution: z.boolean().default(false)
});

voice.post('/commands/execute', zValidator('json', executeCommandSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { intent, entities, confirmExecution } = c.req.valid('json');
    const voiceProcessor = new VoiceProcessor(c.env);

    const result = await voiceProcessor.executeVoiceCommand(intent, entities, auth.userId, confirmExecution);

    return c.json({
      success: result.success,
      message: result.message,
      data: result.data,
      requiresConfirmation: result.requiresConfirmation || false
    });
  } catch (error) {
    console.error('Command execution error:', error);
    return c.json({ error: 'Failed to execute voice command' }, 500);
  }
});

// GET /voice/notes - Get voice notes (alias for recordings with voice_note type)
voice.get('/notes', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const voiceProcessor = new VoiceProcessor(c.env);
    const result = await voiceProcessor.getUserVoiceRecordings(auth.userId, {
      recording_type: 'voice_note',
      limit: 50,
      offset: 0
    });

    return c.json({
      notes: result.recordings.map(recording => ({
        id: recording.id,
        title: recording.title,
        description: recording.description,
        audioUrl: recording.r2_url,
        transcriptionText: recording.transcription_text,
        aiAnalysis: recording.ai_analysis,
        duration: recording.duration_seconds,
        createdAt: recording.created_at
      })),
      total: result.total
    });
  } catch (error) {
    console.error('Get voice notes error:', error);
    return c.json({ error: 'Failed to get voice notes' }, 500);
  }
});

// POST /voice/notes - Create voice note (alias for upload with voice_note type)
voice.post('/notes', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    // Handle both JSON and form data
    const contentType = c.req.header('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON data (for tests)
      const body = await c.req.json();
      const { title, audioData, transcription, duration, format } = body;

      if (!audioData) {
        return c.json({ error: 'Audio data is required' }, 400);
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');

      // Sanitize title to prevent XSS
      const sanitizedTitle = title ? title.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : 'Voice Note';

      // Create upload request for voice note
      const uploadRequest: VoiceUploadRequest = {
        user_id: auth.userId,
        recording_type: 'voice_note',
        title: sanitizedTitle,
        audio_format: format || 'mp3',
        file_size_bytes: audioBuffer.byteLength,
        duration_seconds: duration,
        transcription_language: 'auto',
        enable_ai_analysis: true
      };

      // Process upload
      const voiceProcessor = new VoiceProcessor(c.env);
      const recording = await voiceProcessor.uploadVoiceRecording(audioBuffer, uploadRequest);

      // If transcription was provided, update it
      if (transcription) {
        const db = new DatabaseService(c.env);
        await db.query(`
          UPDATE voice_recordings 
          SET transcription_text = ?, transcription_status = 'completed'
          WHERE id = ?
        `, [transcription, recording.id]);
      }

      return c.json({
        message: 'Voice note created successfully',
        voiceNote: {
          id: recording.id,
          title: recording.title,
          audioUrl: recording.r2_url,
          transcription: transcription || null,
          duration: recording.duration_seconds,
          createdAt: recording.created_at
        }
      }, 201);
    } else {
      // Handle form data (for production)
      const formData = await c.req.formData();
      const audioFile = formData.get('audio') as File;
      const title = formData.get('title') as string;
      const transcription = formData.get('transcription') as string;

      if (!audioFile) {
        return c.json({ error: 'Audio file is required' }, 400);
      }

      // Convert file to buffer
      const audioBuffer = await audioFile.arrayBuffer();

      // Create upload request for voice note
      const uploadRequest: VoiceUploadRequest = {
        user_id: auth.userId,
        recording_type: 'voice_note',
        title: title || 'Voice Note',
        audio_format: 'mp3', // Default format
        file_size_bytes: audioBuffer.byteLength,
        transcription_language: 'auto',
        enable_ai_analysis: true
      };

      // Process upload
      const voiceProcessor = new VoiceProcessor(c.env);
      const recording = await voiceProcessor.uploadVoiceRecording(audioBuffer, uploadRequest);

      // If transcription was provided, update it
      if (transcription) {
        const db = new DatabaseService(c.env);
        await db.query(`
          UPDATE voice_recordings 
          SET transcription_text = ?, transcription_status = 'completed'
          WHERE id = ?
        `, [transcription, recording.id]);
      }

      return c.json({
        message: 'Voice note created successfully',
        voiceNote: {
          id: recording.id,
          title: recording.title,
          audioUrl: recording.r2_url,
          transcription: transcription || null,
          duration: recording.duration_seconds,
          createdAt: recording.created_at
        }
      }, 201);
    }
  } catch (error) {
    console.error('Voice note creation error:', error);
    return c.json({ error: 'Failed to create voice note' }, 500);
  }
});

// GET /voice/notes/:id/audio - Serve voice note audio
voice.get('/notes/:id/audio', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const noteId = c.req.param('id');
    const db = new DatabaseService(c.env);

    // Verify ownership and get R2 key
    const result = await db.query(`
      SELECT r2_key FROM voice_recordings 
      WHERE id = ? AND user_id = ? AND recording_type = 'voice_note'
    `, [noteId, auth.userId]);

    if (!result.results || result.results.length === 0) {
      return c.json({ error: 'Voice note not found' }, 404);
    }

    const r2Key = result.results[0].r2_key;

    // Get audio from R2
    const audioObject = await c.env.ASSETS.get(r2Key);
    if (!audioObject) {
      return c.json({ error: 'Audio file not found' }, 404);
    }

    // Return audio stream
    return new Response(audioObject.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioObject.size.toString(),
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Serve audio error:', error);
    return c.json({ error: 'Failed to serve audio' }, 500);
  }
});

// GET /voice/analytics/usage - Get voice feature usage stats
voice.get('/analytics/usage', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const days = parseInt(c.req.query('days') || '30');
    const db = new DatabaseService(c.env);

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_recordings,
        SUM(file_size_bytes) as total_storage_bytes,
        SUM(duration_seconds) as total_duration_seconds,
        AVG(transcription_confidence) as avg_confidence,
        recording_type,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as recent_recordings
      FROM voice_recordings 
      WHERE user_id = ? AND created_at > ?
      GROUP BY recording_type
    `, [Date.now() - (7 * 24 * 60 * 60 * 1000), auth.userId, Date.now() - (days * 24 * 60 * 60 * 1000)]);

    const stats = {
      totalRecordings: 0,
      totalStorageMb: 0,
      totalDurationMinutes: 0,
      averageConfidence: 0,
      recentActivity: 0,
      byType: {} as Record<string, any>
    };

    (result.results || []).forEach((row: any) => {
      stats.totalRecordings += row.total_recordings;
      stats.totalStorageMb += Math.round((row.total_storage_bytes || 0) / (1024 * 1024) * 100) / 100;
      stats.totalDurationMinutes += Math.round((row.total_duration_seconds || 0) / 60 * 100) / 100;
      stats.averageConfidence = Math.max(stats.averageConfidence, row.avg_confidence || 0);
      stats.recentActivity += row.recent_recordings;
      
      stats.byType[row.recording_type] = {
        count: row.total_recordings,
        storageMb: Math.round((row.total_storage_bytes || 0) / (1024 * 1024) * 100) / 100,
        durationMinutes: Math.round((row.total_duration_seconds || 0) / 60 * 100) / 100
      };
    });

    return c.json({
      usage: stats,
      period: {
        days,
        startDate: Date.now() - (days * 24 * 60 * 60 * 1000),
        endDate: Date.now()
      }
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    return c.json({ error: 'Failed to get usage statistics' }, 500);
  }
});

// GET /voice/analytics/accuracy - Get transcription accuracy metrics
voice.get('/analytics/accuracy', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const days = parseInt(c.req.query('days') || '30');
    const db = new DatabaseService(c.env);

    const result = await db.query(`
      SELECT 
        AVG(transcription_confidence) as avg_confidence,
        MIN(transcription_confidence) as min_confidence,
        MAX(transcription_confidence) as max_confidence,
        COUNT(CASE WHEN transcription_confidence >= 0.9 THEN 1 END) as high_confidence_count,
        COUNT(CASE WHEN transcription_confidence >= 0.7 AND transcription_confidence < 0.9 THEN 1 END) as medium_confidence_count,
        COUNT(CASE WHEN transcription_confidence < 0.7 THEN 1 END) as low_confidence_count,
        COUNT(*) as total_transcriptions,
        transcription_language
      FROM voice_recordings 
      WHERE user_id = ? AND created_at > ? AND transcription_status = 'completed'
      GROUP BY transcription_language
    `, [auth.userId, Date.now() - (days * 24 * 60 * 60 * 1000)]);

    const accuracy = {
      overall: {
        averageConfidence: 0,
        minConfidence: 1,
        maxConfidence: 0,
        totalTranscriptions: 0,
        distribution: {
          high: 0,    // >= 0.9
          medium: 0,  // 0.7-0.89
          low: 0      // < 0.7
        }
      },
      byLanguage: {} as Record<string, any>
    };

    let totalTranscriptions = 0;
    let weightedConfidenceSum = 0;

    (result.results || []).forEach((row: any) => {
      const count = row.total_transcriptions;
      totalTranscriptions += count;
      weightedConfidenceSum += (row.avg_confidence || 0) * count;

      accuracy.overall.minConfidence = Math.min(accuracy.overall.minConfidence, row.min_confidence || 1);
      accuracy.overall.maxConfidence = Math.max(accuracy.overall.maxConfidence, row.max_confidence || 0);
      accuracy.overall.distribution.high += row.high_confidence_count || 0;
      accuracy.overall.distribution.medium += row.medium_confidence_count || 0;
      accuracy.overall.distribution.low += row.low_confidence_count || 0;

      accuracy.byLanguage[row.transcription_language] = {
        averageConfidence: Math.round((row.avg_confidence || 0) * 100) / 100,
        transcriptions: count,
        distribution: {
          high: row.high_confidence_count || 0,
          medium: row.medium_confidence_count || 0,
          low: row.low_confidence_count || 0
        }
      };
    });

    accuracy.overall.averageConfidence = totalTranscriptions > 0 
      ? Math.round((weightedConfidenceSum / totalTranscriptions) * 100) / 100 
      : 0;
    accuracy.overall.totalTranscriptions = totalTranscriptions;

    return c.json({
      accuracy,
      period: {
        days,
        startDate: Date.now() - (days * 24 * 60 * 60 * 1000),
        endDate: Date.now()
      }
    });
  } catch (error) {
    console.error('Get accuracy metrics error:', error);
    return c.json({ error: 'Failed to get accuracy metrics' }, 500);
  }
});

// ========== USER SETTINGS ==========

// GET /voice/settings - Get user voice settings
voice.get('/settings', async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const db = new DatabaseService(c.env);
    const result = await db.query(`
      SELECT * FROM user_voice_settings WHERE user_id = ?
    `, [auth.userId]);

    const settings = result.results?.[0] || {
      preferred_audio_format: 'mp3',
      preferred_quality: 'medium',
      auto_transcription: true,
      transcription_language: 'auto',
      ai_analysis_enabled: true,
      voice_activation_enabled: false,
      noise_reduction: true,
      auto_delete_after_days: null,
      storage_limit_mb: 1000
    };

    return c.json({
      settings: {
        preferredAudioFormat: settings.preferred_audio_format,
        preferredQuality: settings.preferred_quality,
        autoTranscription: Boolean(settings.auto_transcription),
        transcriptionLanguage: settings.transcription_language,
        aiAnalysisEnabled: Boolean(settings.ai_analysis_enabled),
        voiceActivationEnabled: Boolean(settings.voice_activation_enabled),
        noiseReduction: Boolean(settings.noise_reduction),
        autoDeleteAfterDays: settings.auto_delete_after_days,
        storageLimitMb: settings.storage_limit_mb
      }
    });
  } catch (error) {
    console.error('Get voice settings error:', error);
    return c.json({ error: 'Failed to get voice settings' }, 500);
  }
});

// PUT /voice/settings - Update user voice settings
const settingsSchema = z.object({
  preferredAudioFormat: z.enum(['mp3', 'wav', 'm4a', 'ogg', 'webm']).optional(),
  preferredQuality: z.enum(['low', 'medium', 'high', 'lossless']).optional(),
  autoTranscription: z.boolean().optional(),
  transcriptionLanguage: z.string().max(10).optional(),
  aiAnalysisEnabled: z.boolean().optional(),
  voiceActivationEnabled: z.boolean().optional(),
  noiseReduction: z.boolean().optional(),
  autoDeleteAfterDays: z.number().int().min(1).max(365).nullable().optional(),
  storageLimitMb: z.number().int().min(100).max(10000).optional()
});

voice.put('/settings', zValidator('json', settingsSchema), async (c) => {
  const auth = await getUserFromToken(c);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const updates = c.req.valid('json');
    const db = new DatabaseService(c.env);

    // Convert camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.preferredAudioFormat) dbUpdates.preferred_audio_format = updates.preferredAudioFormat;
    if (updates.preferredQuality) dbUpdates.preferred_quality = updates.preferredQuality;
    if (updates.autoTranscription !== undefined) dbUpdates.auto_transcription = updates.autoTranscription;
    if (updates.transcriptionLanguage) dbUpdates.transcription_language = updates.transcriptionLanguage;
    if (updates.aiAnalysisEnabled !== undefined) dbUpdates.ai_analysis_enabled = updates.aiAnalysisEnabled;
    if (updates.voiceActivationEnabled !== undefined) dbUpdates.voice_activation_enabled = updates.voiceActivationEnabled;
    if (updates.noiseReduction !== undefined) dbUpdates.noise_reduction = updates.noiseReduction;
    if (updates.autoDeleteAfterDays !== undefined) dbUpdates.auto_delete_after_days = updates.autoDeleteAfterDays;
    if (updates.storageLimitMb) dbUpdates.storage_limit_mb = updates.storageLimitMb;

    if (Object.keys(dbUpdates).length === 0) {
      return c.json({ error: 'No valid settings to update' }, 400);
    }

    dbUpdates.updated_at = Date.now();

    // Upsert settings
    const updateFields = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(dbUpdates);

    await db.query(`
      INSERT INTO user_voice_settings (user_id, ${Object.keys(dbUpdates).join(', ')})
      VALUES (?, ${Object.keys(dbUpdates).map(() => '?').join(', ')})
      ON CONFLICT(user_id) DO UPDATE SET ${updateFields}
    `, [auth.userId, ...updateValues, ...updateValues]);

    return c.json({ message: 'Voice settings updated successfully' });
  } catch (error) {
    console.error('Update voice settings error:', error);
    return c.json({ error: 'Failed to update voice settings' }, 500);
  }
});

export default voice;