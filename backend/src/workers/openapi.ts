import { Hono } from 'hono';

const openapi = new Hono();

// OpenAPI specification
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Time & Wellness API',
    description: 'Comprehensive wellness and productivity management API with AI-powered features, voice processing, social features, and health tracking.',
    version: '1.0.0',
    contact: {
      name: 'Time & Wellness Support',
      email: 'support@timewellness.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://api.timewellness.com',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.timewellness.com',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:8787',
      description: 'Development server'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Tasks', description: 'Task management and Eisenhower matrix' },
    { name: 'Health', description: 'Health tracking and insights' },
    { name: 'Focus Sessions', description: 'Pomodoro timer and focus tracking' },
    { name: 'Voice Processing', description: 'Voice notes and AI transcription' },
    { name: 'Calendar', description: 'Calendar and meeting scheduling' },
    { name: 'Notifications', description: 'Push notifications and alerts' },
    { name: 'Social', description: 'Social features and challenges' },
    { name: 'Badges', description: 'Achievement system and gamification' },
    { name: 'Student Verification', description: 'Student verification and pricing' },
    { name: 'Localization', description: 'Multi-language support' },
    { name: 'Admin', description: 'Administrative functions' },
    { name: 'Health Monitor', description: 'System health and monitoring' },
    { name: 'Metrics', description: 'Analytics and metrics collection' }
  ],
  paths: {
    // Authentication endpoints
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' }
                },
                required: ['email', 'password', 'firstName', 'lastName']
              }
            }
          }
        },
        responses: {
          '201': { description: 'User created successfully' },
          '400': { description: 'Invalid input' },
          '409': { description: 'User already exists' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        responses: {
          '200': { description: 'Token refreshed successfully' },
          '401': { description: 'Invalid refresh token' }
        }
      }
    },

    // Task management endpoints
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Get user tasks',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'completed', 'cancelled'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': { description: 'Tasks retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create new task',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  dueDate: { type: 'string', format: 'date-time' },
                  urgency: { type: 'integer', minimum: 1, maximum: 4 },
                  importance: { type: 'integer', minimum: 1, maximum: 4 }
                },
                required: ['title']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Task created successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Task retrieved successfully' },
          '404': { description: 'Task not found' },
          '401': { description: 'Unauthorized' }
        }
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  completed: { type: 'boolean' },
                  dueDate: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Task updated successfully' },
          '404': { description: 'Task not found' },
          '401': { description: 'Unauthorized' }
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Task deleted successfully' },
          '404': { description: 'Task not found' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/matrix': {
      get: {
        tags: ['Tasks'],
        summary: 'Get Eisenhower matrix view',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Matrix data retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Health tracking endpoints
    '/api/health/logs': {
      get: {
        tags: ['Health'],
        summary: 'Get health logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['exercise', 'nutrition', 'sleep', 'mood'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': { description: 'Health logs retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Health'],
        summary: 'Log health data',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['exercise', 'nutrition', 'sleep', 'mood'] },
                  data: { type: 'object' },
                  notes: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                },
                required: ['type', 'data']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Health data logged successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/health/insights': {
      get: {
        tags: ['Health'],
        summary: 'Get health insights',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'quarter'], default: 'month' } }
        ],
        responses: {
          '200': { description: 'Health insights retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Focus sessions endpoints
    '/api/focus/sessions': {
      get: {
        tags: ['Focus Sessions'],
        summary: 'Get focus sessions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'completed', 'cancelled'] } },
          { name: 'template', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Focus sessions retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Focus Sessions'],
        summary: 'Start focus session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  templateKey: { type: 'string' },
                  duration: { type: 'integer' },
                  tasks: { type: 'array', items: { type: 'string' } }
                },
                required: ['templateKey']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Focus session started successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/focus/sessions/{id}/complete': {
      post: {
        tags: ['Focus Sessions'],
        summary: 'Complete focus session',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  actualDuration: { type: 'integer' },
                  completedTasks: { type: 'integer' },
                  productivityRating: { type: 'integer', minimum: 1, maximum: 5 },
                  notes: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Focus session completed successfully' },
          '404': { description: 'Session not found' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Voice processing endpoints
    '/api/voice/transcribe': {
      post: {
        tags: ['Voice Processing'],
        summary: 'Transcribe audio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  audioData: { type: 'string', format: 'base64' },
                  format: { type: 'string', enum: ['webm', 'wav', 'mp3', 'm4a', 'ogg'] },
                  language: { type: 'string', default: 'en-US' }
                },
                required: ['audioData']
              }
            }
          }
        },
        responses: {
          '200': { description: 'Audio transcribed successfully' },
          '400': { description: 'Invalid audio data' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/voice/notes': {
      get: {
        tags: ['Voice Processing'],
        summary: 'Get voice notes',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': { description: 'Voice notes retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Voice Processing'],
        summary: 'Create voice note',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  audioData: { type: 'string', format: 'base64' },
                  transcription: { type: 'string' },
                  duration: { type: 'integer' }
                },
                required: ['audioData']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Voice note created successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Calendar endpoints
    '/api/calendar/events': {
      get: {
        tags: ['Calendar'],
        summary: 'Get calendar events',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': { description: 'Events retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Calendar'],
        summary: 'Create calendar event',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                  attendees: { type: 'array', items: { type: 'string' } }
                },
                required: ['title', 'startTime', 'endTime']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Event created successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Notifications endpoints
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get notifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'unread', in: 'query', schema: { type: 'boolean' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          '200': { description: 'Notifications retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/notifications/{id}/read': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Notification marked as read' },
          '404': { description: 'Notification not found' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Social features endpoints
    '/api/social/connections': {
      get: {
        tags: ['Social'],
        summary: 'Get social connections',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Connections retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Social'],
        summary: 'Send connection request',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  type: { type: 'string', enum: ['friend', 'family', 'colleague', 'accountability_partner'] }
                },
                required: ['userId', 'type']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Connection request sent successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/social/challenges': {
      get: {
        tags: ['Social'],
        summary: 'Get social challenges',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['habit', 'goal', 'fitness', 'mindfulness'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'completed', 'upcoming'] } }
        ],
        responses: {
          '200': { description: 'Challenges retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Social'],
        summary: 'Create social challenge',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string', enum: ['habit', 'goal', 'fitness', 'mindfulness'] },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  isPublic: { type: 'boolean' }
                },
                required: ['title', 'type', 'startDate', 'endDate']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Challenge created successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Badges endpoints
    '/api/badges': {
      get: {
        tags: ['Badges'],
        summary: 'Get available badges',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Badges retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/badges/user': {
      get: {
        tags: ['Badges'],
        summary: 'Get user badges',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User badges retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      }
    },

    // Student verification endpoints
    '/api/student/pricing': {
      get: {
        tags: ['Student Verification'],
        summary: 'Get student pricing information',
        responses: {
          '200': { description: 'Pricing information retrieved successfully' }
        }
      }
    },
    '/api/student/verify-otp': {
      post: {
        tags: ['Student Verification'],
        summary: 'Verify student OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string' }
                },
                required: ['email', 'otp']
              }
            }
          }
        },
        responses: {
          '200': { description: 'OTP verified successfully' },
          '400': { description: 'Invalid OTP' }
        }
      }
    },

    // Localization endpoints
    '/api/localization/content': {
      get: {
        tags: ['Localization'],
        summary: 'Get localized content',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string', default: 'en' } },
          { name: 'category', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Localized content retrieved successfully' }
        }
      }
    },
    '/api/localization/pricing': {
      get: {
        tags: ['Localization'],
        summary: 'Get localized pricing',
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string', default: 'US' } }
        ],
        responses: {
          '200': { description: 'Localized pricing retrieved successfully' }
        }
      }
    },

    // Admin endpoints
    '/api/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin dashboard data',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard data retrieved successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Get users (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }
        ],
        responses: {
          '200': { description: 'Users retrieved successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' }
        }
      }
    },

    // Health monitoring endpoints
    '/api/health': {
      get: {
        tags: ['Health Monitor'],
        summary: 'Get system health status',
        responses: {
          '200': { description: 'Health status retrieved successfully' },
          '503': { description: 'Service unavailable' }
        }
      }
    },
    '/api/health/detailed': {
      get: {
        tags: ['Health Monitor'],
        summary: 'Get detailed system health',
        responses: {
          '200': { description: 'Detailed health status retrieved successfully' },
          '503': { description: 'Service unavailable' }
        }
      }
    },

    // Metrics endpoints
    '/api/metrics': {
      get: {
        tags: ['Metrics'],
        summary: 'Get system metrics',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'name', in: 'query', schema: { type: 'string' } },
          { name: 'start_time', in: 'query', schema: { type: 'integer' } },
          { name: 'end_time', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'Metrics retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Metrics'],
        summary: 'Record system metric',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  value: { type: 'number' },
                  tags: { type: 'object' },
                  timestamp: { type: 'integer' }
                },
                required: ['name', 'value']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Metric recorded successfully' },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/metrics/analytics': {
      get: {
        tags: ['Metrics'],
        summary: 'Get system analytics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Analytics retrieved successfully' },
          '401': { description: 'Unauthorized' }
        }
      }
    },
    '/api/metrics/prometheus': {
      get: {
        tags: ['Metrics'],
        summary: 'Get Prometheus-compatible metrics',
        description: 'Returns metrics in Prometheus exposition format for monitoring systems',
        responses: {
          '200': {
            description: 'Prometheus metrics retrieved successfully',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: '# HELP time_wellness_application_info Application information\n# TYPE time_wellness_application_info gauge\ntime_wellness_application_info{version="1.0.0",environment="production"} 1'
                }
              }
            }
          },
          '500': { description: 'Internal server error' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          subscriptionStatus: { type: 'string', enum: ['free', 'premium', 'student'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          completed: { type: 'boolean' },
          dueDate: { type: 'string', format: 'date-time' },
          urgency: { type: 'integer', minimum: 1, maximum: 4 },
          importance: { type: 'integer', minimum: 1, maximum: 4 },
          eisenhowerQuadrant: { type: 'string', enum: ['do', 'decide', 'delegate', 'delete'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      HealthLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['exercise', 'nutrition', 'sleep', 'mood'] },
          data: { type: 'object' },
          notes: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      FocusSession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          templateKey: { type: 'string' },
          duration: { type: 'integer' },
          actualDuration: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'completed', 'cancelled'] },
          productivityRating: { type: 'integer', minimum: 1, maximum: 5 },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      VoiceNote: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          transcription: { type: 'string' },
          duration: { type: 'integer' },
          audioUrl: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Badge: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          points: { type: 'integer' },
          category: { type: 'string' },
          earned: { type: 'boolean' },
          earnedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

// OpenAPI specification endpoint
openapi.get('/', async (c) => {
  return c.json(openApiSpec);
});

// OpenAPI specification in YAML format
openapi.get('/yaml', async (c) => {
  const yaml = require('js-yaml');
  const yamlSpec = yaml.dump(openApiSpec);
  
  return new Response(yamlSpec, {
    headers: {
      'Content-Type': 'text/yaml'
    }
  });
});

// OpenAPI specification in JSON format (same as root)
openapi.get('/json', async (c) => {
  return c.json(openApiSpec);
});

export default openapi;
