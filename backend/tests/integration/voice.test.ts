// Voice Recognition and Audio Processing Integration Tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import apiGateway from '../../src/workers/api-gateway';
import { 
  createMockEnv, 
  testUsers,
  generateTestToken,
  makeRequest, 
  expectSuccessResponse, 
  expectErrorResponse,
  expectValidationError,
  cleanupTestData,
  mockExternalAPIs
} from '../utils/test-helpers';

describe('Voice Recognition and Audio Processing API', () => {
  let env: any;
  let app: any;
  let userToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = apiGateway;
    userToken = await generateTestToken(testUsers.regularUser.id);
    
    // Set up mock data
    env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUsers.regularUser]);
    env.DB._setMockData('SELECT * FROM voice_recordings WHERE user_id = ?', []);
    
    // Mock external APIs
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanupTestData(env);
    vi.clearAllMocks();
  });

  describe('Speech-to-Text Processing', () => {
    describe('POST /transcribe', () => {
      it('should transcribe audio successfully', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.deepgram.success
        });

        const audioData = {
          audioData: 'base64_encoded_audio_data',
          format: 'webm',
          sampleRate: 44100,
          language: 'en-US'
        };

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: audioData,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          transcription: {
            text: expect.any(String),
            confidence: expect.any(Number),
            duration: expect.any(Number)
          },
          metadata: {
            language: audioData.language,
            format: audioData.format
          }
        });

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('deepgram.com'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Token ')
            })
          })
        );
      });

      it('should handle multi-language transcription', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockExternalAPIs.deepgram.success,
            results: {
              channels: [{
                alternatives: [{
                  transcript: 'Hola, ¿cómo estás?',
                  confidence: 0.95,
                  language: 'es'
                }]
              }]
            }
          })
        });

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: {
            audioData: 'spanish_audio_data',
            format: 'wav',
            language: 'es-ES'
          },
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.transcription.text).toContain('Hola');
        expect(body.metadata.language).toBe('es-ES');
      });

      it('should reject invalid audio format', async () => {
        const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: {
            audioData: 'audio_data',
            format: 'unsupported_format'
          },
          env: env
        });

        await expectValidationError(response, 'format');
      });

      it('should handle transcription service errors', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid audio data' })
        });

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: {
            audioData: 'invalid_audio',
            format: 'wav'
          },
          env: env
        });

        expectErrorResponse(response, 400, 'Transcription service error');
      });
    });

    describe('POST /transcribe/stream', () => {
      it('should handle streaming transcription', async () => {
        const streamData = {
          sessionId: 'stream_session_123',
          audioChunk: 'base64_audio_chunk',
          isLast: false
        };

        env.CACHE._setMockData(`voice_stream_${streamData.sessionId}`, {
          chunks: [],
          startTime: Date.now()
        });

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe/stream', {
          token: userToken,
          body: streamData,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          sessionId: streamData.sessionId,
          partialTranscript: expect.any(String),
          isComplete: false
        });
      });

      it('should complete streaming session', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.deepgram.success
        });

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe/stream', {
          token: userToken,
          body: {
            sessionId: 'stream_session_123',
            audioChunk: 'final_chunk',
            isLast: true
          },
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.isComplete).toBe(true);
        expect(body.finalTranscript).toBeDefined();
      });
    });
  });

  describe('Voice Commands', () => {
    describe('POST /commands/interpret', () => {
      it('should interpret voice command for task creation', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  intent: 'create_task',
                  entities: {
                    title: 'buy groceries',
                    priority: 'high',
                    dueDate: Date.now() + 86400000
                  },
                  confidence: 0.9,
                  suggestedAction: {
                    type: 'create_task',
                    parameters: {
                      title: 'buy groceries',
                      priority: 'high',
                      dueDate: Date.now() + 86400000
                    }
                  }
                })
              }
            }]
          })
        });

        const commandData = {
          text: 'Create a new task called buy groceries with high priority for tomorrow'
        };

        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: commandData,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          intent: 'create_task',
          entities: {
            title: 'buy groceries',
            priority: 'high',
            dueDate: expect.any(Number)
          },
          confidence: expect.any(Number),
          suggestedAction: expect.objectContaining({
            type: 'create_task',
            parameters: expect.any(Object)
          })
        });
      });

      it('should interpret voice command for health logging', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  intent: 'log_health',
                  entities: {
                    activity: 'running',
                    duration: 30,
                    unit: 'minutes'
                  },
                  confidence: 0.9,
                  suggestedAction: {
                    type: 'log_health',
                    parameters: {
                      activity: 'running',
                      duration: 30,
                      unit: 'minutes'
                    }
                  }
                })
              }
            }]
          })
        });

        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: {
            text: 'Log that I ran for 30 minutes this morning'
          },
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.intent).toBe('log_health');
        expect(body.entities).toMatchObject({
          activity: 'running',
          duration: 30,
          unit: 'minutes'
        });
      });

      it('should interpret voice command for calendar scheduling', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  intent: 'schedule_event',
                  entities: {
                    title: 'meeting with John',
                    attendees: ['John'],
                    duration: 60
                  },
                  confidence: 0.9,
                  suggestedAction: {
                    type: 'schedule_event',
                    parameters: {
                      title: 'meeting with John',
                      attendees: ['John'],
                      duration: 60
                    }
                  }
                })
              }
            }]
          })
        });

        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: {
            text: 'Schedule a meeting with John tomorrow at 2 PM for 1 hour'
          },
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.intent).toBe('schedule_event');
        expect(body.entities).toMatchObject({
          title: expect.stringContaining('meeting'),
          attendees: expect.arrayContaining(['John']),
          duration: 60
        });
      });

      it('should handle ambiguous commands', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  intent: 'unclear',
                  entities: {},
                  confidence: 0.3,
                  clarificationNeeded: true,
                  suggestedClarifications: ['What would you like to do?', 'Can you be more specific?']
                })
              }
            }]
          })
        });

        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: {
            text: 'Do something'
          },
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.intent).toBe('unclear');
        expect(body.clarificationNeeded).toBe(true);
        expect(body.suggestedClarifications).toBeInstanceOf(Array);
      });
    });

    describe('POST /commands/execute', () => {
      it('should execute interpreted task creation command', async () => {
        const commandExecution = {
          intent: 'create_task',
          entities: {
            title: 'Buy groceries',
            priority: 'high',
            dueDate: Date.now() + 86400000
          },
          confirmExecution: true
        };

        env.DB._setMockData('INSERT INTO tasks', [{ id: 'new_task_from_voice' }]);

        const response = await makeRequest(app, 'POST', '/api/voice/commands/execute', {
          token: userToken,
          body: commandExecution,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          success: true,
          message: expect.stringContaining('created successfully'),
          data: {
            taskId: expect.any(String),
            title: commandExecution.entities.title
          }
        });
      });

      it('should execute health logging command', async () => {
        env.DB._setMockData('INSERT INTO health_logs', [{ id: 'new_health_from_voice' }]);

        const response = await makeRequest(app, 'POST', '/api/voice/commands/execute', {
          token: userToken,
          body: {
            intent: 'log_health',
            entities: {
              type: 'exercise',
              activity: 'running',
              duration: 30,
              unit: 'minutes'
            },
            confirmExecution: true
          },
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          success: true,
          message: expect.stringContaining('logged successfully'),
          data: {
            logId: expect.any(String),
            activity: 'running',
            duration: 30
          }
        });
      });
    });
  });

  describe('Voice Notes and Recordings', () => {
    describe('POST /notes', () => {
      it('should save voice note successfully', async () => {
        const noteData = {
          title: 'Meeting Notes',
          audioData: 'base64_audio_data',
          transcription: 'This was a productive meeting about the new project',
          duration: 120,
          format: 'webm'
        };

        env.DB._setMockData('INSERT INTO voice_recordings', [{ id: 'new_voice_note_id' }]);
        env.ASSETS._setMockData('PUT', { success: true });

        const response = await makeRequest(app, 'POST', '/api/voice/notes', {
          token: userToken,
          body: noteData,
          env: env
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('created successfully'),
          voiceNote: {
            id: expect.any(String),
            title: noteData.title,
            transcription: noteData.transcription,
            duration: noteData.duration,
            audioUrl: expect.any(String)
          }
        });
      });

      it('should auto-transcribe voice note if not provided', async () => {
        (fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockExternalAPIs.deepgram.success
        });

        const response = await makeRequest(app, 'POST', '/api/voice/notes', {
          token: userToken,
          body: {
            title: 'Auto-transcribed Note',
            audioData: 'base64_audio_data',
            format: 'wav'
          },
          env: env
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.voiceNote.transcription).toBeDefined();
        if (body.voiceNote.transcription) {
          expect(body.voiceNote.transcription.length).toBeGreaterThan(0);
        }
      });
    });

    describe('GET /notes', () => {
      it('should get user voice notes', async () => {
        const mockNotes = [
          {
            id: 'note_1',
            user_id: testUsers.regularUser.id,
            title: 'Meeting Notes',
            description: null,
            recording_type: 'voice_note',
            r2_url: 'https://example.com/audio1.mp3',
            transcription_text: 'Meeting content',
            ai_analysis: null,
            duration_seconds: 120,
            created_at: Date.now() - 86400000
          }
        ];

        // Mock the database queries - use more generic patterns
        env.DB._setMockData('SELECT * FROM voice_recordings', mockNotes);
        env.DB._setMockData('SELECT COUNT(*) as count', [{ count: mockNotes.length }]);
        
        // Debug: log what queries are being executed
        const originalQuery = env.DB.query;
        env.DB.query = vi.fn().mockImplementation(async (query: string, params?: any[]) => {
          console.log('Executing query:', query);
          console.log('With params:', params);
          return originalQuery(query, params);
        });

        const response = await makeRequest(app, 'GET', '/api/voice/notes', {
          token: userToken,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        console.log('Voice notes list response:', JSON.stringify(body, null, 2));
        expect(body).toMatchObject({
          notes: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              transcriptionText: expect.any(String),
              duration: expect.any(Number),
              createdAt: expect.any(Number)
            })
          ]),
          total: expect.any(Number)
        });
      });
    });

    describe('GET /notes/:id/audio', () => {
      it('should serve voice note audio', async () => {
        const noteId = 'note_123';
        const mockNote = {
          r2_key: `voice_notes/${noteId}.webm`
        };

        env.DB._setMockData('SELECT r2_key FROM voice_recordings WHERE id = ? AND user_id = ? AND recording_type = ?', [mockNote]);
        // Mock R2 response
        const mockR2Response = {
          body: new ArrayBuffer(1024),
          size: 1024
        };
        env.ASSETS.get = vi.fn().mockResolvedValue(mockR2Response);

        const response = await makeRequest(app, 'GET', `/api/voice/notes/${noteId}/audio`, {
          token: userToken,
          env: env
        });

        expectSuccessResponse(response);
        expect(response.headers.get('content-type')).toBe('audio/mpeg');
      });
    });
  });

  describe('Voice Analytics', () => {
    describe('GET /analytics/usage', () => {
      it('should get voice feature usage stats', async () => {
        const mockUsage = [
          { 
            recording_type: 'voice_note', 
            total_recordings: 8, 
            total_storage_bytes: 1200000, 
            total_duration_seconds: 1200,
            avg_confidence: 0.85,
            recent_recordings: 2
          }
        ];

        env.DB._setMockData('SELECT recording_type, COUNT(*) as total_recordings, SUM(file_size_bytes) as total_storage_bytes, SUM(duration_seconds) as total_duration_seconds, AVG(transcription_confidence) as avg_confidence, COUNT(CASE WHEN created_at > ? THEN 1 END) as recent_recordings FROM voice_recordings WHERE user_id = ? AND created_at > ? GROUP BY recording_type', mockUsage);

        const response = await makeRequest(app, 'GET', '/api/voice/analytics/usage', {
          token: userToken,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          usage: {
            totalRecordings: expect.any(Number),
            totalStorageMb: expect.any(Number),
            totalDurationMinutes: expect.any(Number),
            averageConfidence: expect.any(Number),
            recentActivity: expect.any(Number),
            byType: expect.any(Object)
          },
          period: {
            days: expect.any(Number),
            startDate: expect.any(Number),
            endDate: expect.any(Number)
          }
        });
      });
    });

    describe('GET /analytics/accuracy', () => {
      it('should get transcription accuracy metrics', async () => {
        const mockAccuracy = [
          {
            transcription_language: 'en',
            avg_confidence: 0.85,
            min_confidence: 0.6,
            max_confidence: 0.95,
            high_confidence_count: 10,
            medium_confidence_count: 5,
            low_confidence_count: 2,
            total_transcriptions: 17
          }
        ];

        env.DB._setMockData('SELECT AVG(transcription_confidence) as avg_confidence, MIN(transcription_confidence) as min_confidence, MAX(transcription_confidence) as max_confidence, COUNT(CASE WHEN transcription_confidence >= 0.9 THEN 1 END) as high_confidence_count, COUNT(CASE WHEN transcription_confidence >= 0.7 AND transcription_confidence < 0.9 THEN 1 END) as medium_confidence_count, COUNT(CASE WHEN transcription_confidence < 0.7 THEN 1 END) as low_confidence_count, COUNT(*) as total_transcriptions, transcription_language FROM voice_recordings WHERE user_id = ? AND created_at > ? AND transcription_status = ? GROUP BY transcription_language', mockAccuracy);

        const response = await makeRequest(app, 'GET', '/api/voice/analytics/accuracy', {
          token: userToken,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          accuracy: {
            overall: expect.objectContaining({
              averageConfidence: expect.any(Number),
              totalTranscriptions: expect.any(Number),
              distribution: expect.objectContaining({
                high: expect.any(Number),
                medium: expect.any(Number),
                low: expect.any(Number)
              })
            }),
            byLanguage: expect.any(Object)
          },
          period: {
            days: expect.any(Number),
            startDate: expect.any(Number),
            endDate: expect.any(Number)
          }
        });
      });
    });
  });

  describe('Voice Settings and Preferences', () => {
    describe('GET /settings', () => {
      it('should get user voice preferences', async () => {
        const mockSettings = {
          id: 'settings_1',
          user_id: testUsers.regularUser.id,
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

        env.DB._setMockData('SELECT * FROM user_voice_settings WHERE user_id = ?', [mockSettings]);

        const response = await makeRequest(app, 'GET', '/api/voice/settings', {
          token: userToken,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          settings: {
            preferredAudioFormat: mockSettings.preferred_audio_format,
            preferredQuality: mockSettings.preferred_quality,
            autoTranscription: mockSettings.auto_transcription,
            transcriptionLanguage: mockSettings.transcription_language,
            aiAnalysisEnabled: mockSettings.ai_analysis_enabled,
            voiceActivationEnabled: mockSettings.voice_activation_enabled,
            noiseReduction: mockSettings.noise_reduction,
            autoDeleteAfterDays: mockSettings.auto_delete_after_days,
            storageLimitMb: mockSettings.storage_limit_mb
          }
        });
      });
    });

    describe('PUT /settings', () => {
      it('should update voice preferences', async () => {
        const updateData = {
          preferredAudioFormat: 'wav',
          preferredQuality: 'high',
          autoTranscription: false,
          transcriptionLanguage: 'es-ES',
          aiAnalysisEnabled: true,
          voiceActivationEnabled: true,
          noiseReduction: false,
          autoDeleteAfterDays: 30,
          storageLimitMb: 2000
        };

        env.DB._setMockData('INSERT INTO user_voice_settings', [{ success: true }]);

        const response = await makeRequest(app, 'PUT', '/api/voice/settings', {
          token: userToken,
          body: updateData,
          env: env
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('updated successfully');
      });
    });
  });

  describe('Security and Privacy', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'POST', path: '/api/voice/transcribe' },
        { method: 'POST', path: '/api/voice/commands/interpret' },
        { method: 'POST', path: '/api/voice/notes' },
        { method: 'GET', path: '/api/voice/notes' },
        { method: 'GET', path: '/api/voice/settings' }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, endpoint.method, endpoint.path, { env: env });
        expectErrorResponse(response, 401);
      }
    });

    it('should not allow access to other users\' voice notes', async () => {
      env.DB._setMockData('SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?', []);

      const response = await makeRequest(app, 'GET', '/api/voice/notes/other_user_note/audio', {
          token: userToken,
          env: env
        });

      expectErrorResponse(response, 404);
    });

    it('should sanitize audio data before storage', async () => {
      const noteData = {
        title: '<script>alert("xss")</script>Meeting Notes',
        audioData: 'base64_audio_data',
        transcription: 'Normal transcription content'
      };

      env.DB._setMockData('INSERT INTO voice_recordings', [{ id: 'sanitized_note' }]);

      const response = await makeRequest(app, 'POST', '/api/voice/notes', {
          token: userToken,
          body: noteData,
          env: env
        });

      expectSuccessResponse(response, 201);
      const body = await response.json();
      
      // Title should be sanitized
      expect(body.voiceNote.title).not.toContain('<script>');
      expect(body.voiceNote.title).toBe('Meeting Notes');
    });
  });

  describe('Performance and Limits', () => {
    it('should enforce audio file size limits', async () => {
      const largeAudioData = 'x'.repeat(50 * 1024 * 1024 + 1); // 50MB + 1 byte

      const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
        token: userToken,
        body: {
          audioData: largeAudioData,
          format: 'wav'
        },
        env: env
      });

      expectErrorResponse(response, 413, 'File too large');
    });

    it('should respond quickly to transcription requests', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExternalAPIs.deepgram.success
      });

      const start = Date.now();
      const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
        token: userToken,
        body: {
          audioData: 'small_audio_sample',
          format: 'webm'
        },
        env: env
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent transcription requests', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockExternalAPIs.deepgram.success
      });

      const requests = Array.from({ length: 5 }, (_, i) =>
        makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: {
            audioData: `audio_sample_${i}`,
            format: 'webm'
          },
          env: env
        })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expectSuccessResponse(response);
      });
    });
  });
});