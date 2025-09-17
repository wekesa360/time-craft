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
          json: async () => mockExternalAPIs.deepgram.transcription
        });

        const audioData = {
          audioData: 'base64_encoded_audio_data',
          format: 'webm',
          sampleRate: 44100,
          language: 'en-US'
        };

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: audioData
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
            ...mockExternalAPIs.deepgram.transcription,
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
          }
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
          }
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
          }
        });

        expectErrorResponse(response, 400, 'Invalid audio data');
      });
    });

    describe('POST /transcribe/stream', () => {
      it('should handle streaming transcription', async () => {
        const streamData = {
          sessionId: 'stream_session_123',
          audioChunk: 'base64_audio_chunk',
          isLast: false
        };

        env.KV._setMockData(`voice_stream_${streamData.sessionId}`, {
          chunks: [],
          startTime: Date.now()
        });

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe/stream', {
          token: userToken,
          body: streamData
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
          json: async () => mockExternalAPIs.deepgram.transcription
        });

        const response = await makeRequest(app, 'POST', '/api/voice/transcribe/stream', {
          token: userToken,
          body: {
            sessionId: 'stream_session_123',
            audioChunk: 'final_chunk',
            isLast: true
          }
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
        const commandData = {
          text: 'Create a new task called buy groceries with high priority for tomorrow'
        };

        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: commandData
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
        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: {
            text: 'Log that I ran for 30 minutes this morning'
          }
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
        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: {
            text: 'Schedule a meeting with John tomorrow at 2 PM for 1 hour'
          }
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
        const response = await makeRequest(app, 'POST', '/api/voice/commands/interpret', {
          token: userToken,
          body: {
            text: 'Do something'
          }
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
          confirmed: true
        };

        env.DB._setMockData('INSERT INTO tasks', [{ id: 'new_task_from_voice' }]);

        const response = await makeRequest(app, 'POST', '/api/voice/commands/execute', {
          token: userToken,
          body: commandExecution
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('task created'),
          result: {
            type: 'task',
            id: expect.any(String),
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
            confirmed: true
          }
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('health data logged');
        expect(body.result.type).toBe('health_log');
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
        env.R2._setMockData('PUT', { success: true });

        const response = await makeRequest(app, 'POST', '/api/voice/notes', {
          token: userToken,
          body: noteData
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body).toMatchObject({
          message: expect.stringContaining('saved'),
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
          json: async () => mockExternalAPIs.deepgram.transcription
        });

        const response = await makeRequest(app, 'POST', '/api/voice/notes', {
          token: userToken,
          body: {
            title: 'Auto-transcribed Note',
            audioData: 'base64_audio_data',
            format: 'wav'
          }
        });

        expectSuccessResponse(response, 201);
        const body = await response.json();
        
        expect(body.voiceNote.transcription).toBeDefined();
        expect(body.voiceNote.transcription.length).toBeGreaterThan(0);
      });
    });

    describe('GET /notes', () => {
      it('should get user voice notes', async () => {
        const mockNotes = [
          {
            id: 'note_1',
            user_id: testUsers.regularUser.id,
            title: 'Meeting Notes',
            transcription: 'Meeting content',
            duration: 120,
            created_at: Date.now() - 86400000
          }
        ];

        env.DB._setMockData('SELECT * FROM voice_recordings WHERE user_id = ?', mockNotes);

        const response = await makeRequest(app, 'GET', '/api/voice/notes', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          notes: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              transcription: expect.any(String),
              duration: expect.any(Number),
              createdAt: expect.any(Number)
            })
          ]),
          pagination: expect.any(Object)
        });
      });
    });

    describe('GET /notes/:id/audio', () => {
      it('should serve voice note audio', async () => {
        const noteId = 'note_123';
        const mockNote = {
          id: noteId,
          user_id: testUsers.regularUser.id,
          audio_key: `voice_notes/${noteId}.webm`
        };

        env.DB._setMockData('SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?', [mockNote]);
        env.R2._setMockData('GET', { 
          success: true, 
          body: new ArrayBuffer(1024),
          contentType: 'audio/webm'
        });

        const response = await makeRequest(app, 'GET', `/notes/${noteId}/audio`, {
          token: userToken
        });

        expectSuccessResponse(response);
        expect(response.headers.get('content-type')).toBe('audio/webm');
      });
    });
  });

  describe('Voice Analytics', () => {
    describe('GET /analytics/usage', () => {
      it('should get voice feature usage stats', async () => {
        const mockUsage = [
          { feature_type: 'transcription', count: 25, total_duration: 3600 },
          { feature_type: 'voice_commands', count: 15, total_duration: 450 },
          { feature_type: 'voice_notes', count: 8, total_duration: 1200 }
        ];

        env.DB._setMockData('SELECT feature_type, COUNT(*) as count, SUM(duration) as total_duration FROM voice_usage WHERE user_id = ?', mockUsage);

        const response = await makeRequest(app, 'GET', '/api/voice/analytics/usage', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          usage: {
            transcription: expect.objectContaining({
              totalSessions: 25,
              totalDuration: 3600
            }),
            voiceCommands: expect.objectContaining({
              totalCommands: 15,
              averageDuration: expect.any(Number)
            }),
            voiceNotes: expect.objectContaining({
              totalNotes: 8,
              totalDuration: 1200
            })
          },
          insights: expect.arrayContaining([
            expect.objectContaining({
              type: expect.any(String),
              message: expect.any(String)
            })
          ])
        });
      });
    });

    describe('GET /analytics/accuracy', () => {
      it('should get transcription accuracy metrics', async () => {
        const response = await makeRequest(app, 'GET', '/api/voice/analytics/accuracy', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          accuracy: {
            averageConfidence: expect.any(Number),
            byLanguage: expect.any(Object),
            improvementSuggestions: expect.any(Array)
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
          preferred_language: 'en-US',
          voice_commands_enabled: true,
          auto_transcribe: true,
          noise_reduction: true
        };

        env.DB._setMockData('SELECT * FROM voice_settings WHERE user_id = ?', [mockSettings]);

        const response = await makeRequest(app, 'GET', '/api/voice/settings', {
          token: userToken
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body).toMatchObject({
          settings: {
            preferredLanguage: mockSettings.preferred_language,
            voiceCommandsEnabled: mockSettings.voice_commands_enabled,
            autoTranscribe: mockSettings.auto_transcribe,
            noiseReduction: mockSettings.noise_reduction
          }
        });
      });
    });

    describe('PUT /settings', () => {
      it('should update voice preferences', async () => {
        const updateData = {
          preferredLanguage: 'es-ES',
          voiceCommandsEnabled: false,
          autoTranscribe: true,
          noiseReduction: false
        };

        const response = await makeRequest(app, 'PUT', '/api/voice/settings', {
          token: userToken,
          body: updateData
        });

        expectSuccessResponse(response);
        const body = await response.json();
        
        expect(body.message).toContain('updated');
        expect(body.settings).toMatchObject(updateData);
      });
    });
  });

  describe('Security and Privacy', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'POST', path: '/transcribe' },
        { method: 'POST', path: '/commands/interpret' },
        { method: 'POST', path: '/notes' },
        { method: 'GET', path: '/notes' },
        { method: 'GET', path: '/settings' }
      ];

      for (const endpoint of endpoints) {
        const response = await makeRequest(app, endpoint.method, endpoint.path);
        expectErrorResponse(response, 401);
      }
    });

    it('should not allow access to other users\' voice notes', async () => {
      env.DB._setMockData('SELECT * FROM voice_recordings WHERE id = ? AND user_id = ?', []);

      const response = await makeRequest(app, 'GET', '/api/voice/notes/other_user_note/audio', {
        token: userToken
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
        body: noteData
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
      const largeAudioData = 'x'.repeat(50 * 1024 * 1024); // 50MB of data

      const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
        token: userToken,
        body: {
          audioData: largeAudioData,
          format: 'wav'
        }
      });

      expectErrorResponse(response, 413, 'File too large');
    });

    it('should respond quickly to transcription requests', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockExternalAPIs.deepgram.transcription
      });

      const start = Date.now();
      const response = await makeRequest(app, 'POST', '/api/voice/transcribe', {
        token: userToken,
        body: {
          audioData: 'small_audio_sample',
          format: 'webm'
        }
      });
      const duration = Date.now() - start;

      expectSuccessResponse(response);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent transcription requests', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockExternalAPIs.deepgram.transcription
      });

      const requests = Array.from({ length: 5 }, (_, i) =>
        makeRequest(app, 'POST', '/api/voice/transcribe', {
          token: userToken,
          body: {
            audioData: `audio_sample_${i}`,
            format: 'webm'
          }
        })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expectSuccessResponse(response);
      });
    });
  });
});