# Time & Wellness API Documentation

**Version:** 2.0  
**Base URL:** `https://api.timeandwellness.com`  
**Authentication:** Bearer Token (JWT)  
**Last Updated:** January 15, 2025

## Overview

The Time & Wellness API provides comprehensive endpoints for managing productivity, health tracking, wellness data, social features, and advanced AI-powered insights. All API endpoints return JSON and use standard HTTP status codes.

### New Features in v2.0
- **Payments & Subscriptions** - Complete Stripe integration with subscription management, billing, and usage analytics
- **Focus Sessions (Pomodoro)** - Advanced productivity tracking with 5 session templates and analytics
- **Social Features** - User connections, challenges, and achievement sharing with activity feeds
- **Student Verification** - Educational email verification with OTP and student pricing (50% discount)
- **Advanced Health Insights** - AI-powered health analytics, goal tracking, and nutrition analysis
- **German Localization** - Full German language support with cultural adaptations for DE/AT/CH
- **Admin Dashboard** - Comprehensive admin tools, system monitoring, and feature flags
- **Badge System** - Gamification with 15+ achievement badges and progress tracking
- **AI Meeting Scheduling** - Smart meeting coordination with availability detection and conflict resolution
- **Voice Processing** - Voice note transcription, AI analysis, and command interpretation
- **Eisenhower Matrix** - Task prioritization using urgency/importance quadrants
- **Push Notifications** - OneSignal integration with localized templates
- **Health Monitoring** - System health checks, metrics collection, and performance monitoring
- **OpenAPI Specification** - Complete API documentation with interactive endpoints
- **Real-Time Features** - Server-Sent Events (SSE) for live calendar sync and notifications
- **Mobile Platform** - Complete mobile app support with offline sync and device management
- **Database Migrations** - Safe migration system with rollback capabilities
- **Enhanced Security** - Advanced audit logging, encryption, and compliance reporting

## Authentication

### Register a New User
**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "timezone": "America/New_York",
  "preferredLanguage": "en",
  "isStudent": false
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "timezone": "America/New_York",
    "preferredLanguage": "en",
    "subscriptionType": "free",
    "isStudent": false,
    "createdAt": 1640995200000,
    "updatedAt": 1640995200000
  },
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Login
**POST** `/auth/login`

Authenticates a user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "subscriptionType": "free",
    "isStudent": false
  },
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Refresh Token
**POST** `/auth/refresh`

Gets a new access token using the refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "message": "Token refresh successful",
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### Validate Token
**GET** `/auth/validate`

Validates the current JWT token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "valid": true,
  "payload": {
    "userId": "user_abc123",
    "email": "user@example.com",
    "subscriptionType": "free",
    "isStudent": false,
    "preferredLanguage": "en",
    "exp": 1640998800
  }
}
```

### Get Current User
**GET** `/auth/me`

Gets the current authenticated user's information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "timezone": "America/New_York",
    "preferredLanguage": "en",
    "subscriptionType": "free",
    "isStudent": false,
    "createdAt": 1640995200000,
    "updatedAt": 1640995200000
  }
}
```

### Logout
**POST** `/auth/logout`

Logs out the current user (client-side token removal).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### Forgot Password
**POST** `/auth/forgot-password`

Initiates password reset process by sending reset link to email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a reset link has been sent",
  "resetToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Reset Password
**POST** `/auth/reset-password`

Resets user password using the reset token.

**Request Body:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

**Response (401) - Invalid Token:**
```json
{
  "error": "Invalid or expired reset token"
}
```

### Send OTP
**POST** `/auth/send-otp`

Sends one-time password to email for passwordless login.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully",
  "otpId": "otp_uuid_123",
  "expiresAt": 1641000600000
}
```

### Verify OTP
**POST** `/auth/verify-otp`

Verifies OTP and logs in the user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Response (400) - Invalid OTP:**
```json
{
  "error": "Invalid OTP"
}
```

### Google OAuth - Start Flow
**GET** `/auth/google`

Initiates Google OAuth authentication flow.

**Response (200):**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "uuid_state_123"
}
```

### Google OAuth - Callback
**GET** `/auth/google/callback`

Handles Google OAuth callback and completes authentication.

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: State parameter for security verification

**Response (200):**
```json
{
  "message": "Google authentication successful",
  "user": {
    "id": "user_abc123",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Response (400) - Invalid State:**
```json
{
  "error": "Invalid or expired state"
}
```

## User Management

### Get User Profile
**GET** `/api/user/profile`

Gets the current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "timezone": "America/New_York",
    "preferred_language": "en",
    "subscription_type": "free",
    "is_student": false,
    "created_at": 1640995200000,
    "updated_at": 1640995200000
  }
}
```

### Update User Profile
**PUT** `/api/user/profile`

Updates the current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "timezone": "Europe/London",
  "preferredLanguage": "de"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "timezone": "Europe/London",
    "preferred_language": "de"
  }
}
```

## Task Management

### Get Tasks
**GET** `/api/tasks`

Gets the user's tasks with optional filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): `pending`, `done`, `archived`
- `priority` (optional): `1`, `2`, `3`, `4`
- `contextType` (optional): Filter by context type
- `search` (optional): Search in title and description
- `startDate` (optional): Unix timestamp for date range
- `endDate` (optional): Unix timestamp for date range
- `limit` (optional): Number of results (max 100, default 50)
- `offset` (optional): Pagination offset

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "task_xyz789",
      "user_id": "user_abc123",
      "title": "Review project proposal",
      "description": "Review Q1 project proposal document",
      "priority": 3,
      "status": "pending",
      "due_date": 1641081600000,
      "estimated_duration": 60,
      "ai_priority_score": 0.85,
      "context_type": "work",
      "created_at": 1640995200000,
      "updated_at": 1640995200000
    }
  ],
  "hasMore": false,
  "nextCursor": null,
  "total": 1
}
```

### Create Task
**POST** `/api/tasks`

Creates a new task.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive documentation for the new feature",
  "priority": 2,
  "dueDate": 1641081600000,
  "estimatedDuration": 120,
  "energyLevelRequired": 7,
  "contextType": "work"
}
```

**Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "task_new123",
    "user_id": "user_abc123",
    "title": "Complete project documentation",
    "description": "Write comprehensive documentation for the new feature",
    "priority": 2,
    "status": "pending",
    "due_date": 1641081600000,
    "estimated_duration": 120,
    "energy_level_required": 7,
    "context_type": "work",
    "created_at": 1641000000000,
    "updated_at": 1641000000000
  }
}
```

### Get Task
**GET** `/api/tasks/{id}`

Gets a specific task by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "task": {
    "id": "task_xyz789",
    "user_id": "user_abc123",
    "title": "Review project proposal",
    "priority": 3,
    "status": "pending"
  }
}
```

### Update Task
**PUT** `/api/tasks/{id}`

Updates an existing task.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated task title",
  "status": "done",
  "priority": 4
}
```

**Response (200):**
```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "task_xyz789",
    "title": "Updated task title",
    "status": "done",
    "priority": 4,
    "updated_at": 1641005000000
  }
}
```

### Complete Task
**PATCH** `/api/tasks/{id}/complete`

Marks a task as completed.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Task completed successfully"
}
```

### Delete Task
**DELETE** `/api/tasks/{id}`

Soft deletes a task.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

### Get Task Statistics
**GET** `/api/tasks/stats`

Gets task statistics for the current user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "stats": {
    "total": 25,
    "completed": 18,
    "pending": 6,
    "overdue": 1
  }
}
```

### Get Eisenhower Matrix
**GET** `/api/tasks/matrix`

Gets tasks organized by Eisenhower Matrix quadrants.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "matrix": {
    "do": [
      {
        "id": "task_1",
        "title": "Fix critical bug",
        "urgency": 5,
        "importance": 5,
        "quadrant": "do"
      }
    ],
    "decide": [
      {
        "id": "task_2",
        "title": "Plan next quarter",
        "urgency": 2,
        "importance": 5,
        "quadrant": "decide"
      }
    ],
    "delegate": [],
    "delete": []
  },
  "stats": {
    "do": 3,
    "decide": 5,
    "delegate": 2,
    "delete": 1
  }
}
```

### Get Matrix Statistics
**GET** `/api/tasks/matrix/stats`

Gets Eisenhower Matrix statistics and insights.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "stats": {
    "quadrantDistribution": {
      "do": 25,
      "decide": 45,
      "delegate": 20,
      "delete": 10
    },
    "completionRates": {
      "do": 0.85,
      "decide": 0.65,
      "delegate": 0.40,
      "delete": 0.95
    },
    "recommendations": [
      "Focus more on 'Decide' quadrant tasks",
      "Consider delegating more urgent but less important tasks"
    ]
  }
}
```

## Health Tracking

### Log Exercise
**POST** `/api/health/exercise`

Logs an exercise activity.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "activity": "Running",
  "durationMinutes": 30,
  "intensity": 7,
  "caloriesBurned": 300,
  "distance": 5.2,
  "notes": "Good morning run",
  "recordedAt": 1641000000000,
  "source": "manual",
  "deviceType": "apple_watch"
}
```

**Response (201):**
```json
{
  "message": "Exercise logged successfully",
  "log": {
    "id": "health_ex123",
    "user_id": "user_abc123",
    "type": "exercise",
    "payload": {
      "activity": "Running",
      "duration_minutes": 30,
      "intensity": 7,
      "calories_burned": 300,
      "distance": 5.2,
      "notes": "Good morning run"
    },
    "recorded_at": 1641000000000,
    "source": "manual",
    "device_type": "apple_watch",
    "created_at": 1641000000000
  }
}
```

### Log Mood
**POST** `/api/health/mood`

Logs mood and mental state data.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "score": 8,
  "energy": 7,
  "stress": 3,
  "notes": "Feeling great today",
  "tags": ["happy", "productive"],
  "recordedAt": 1641000000000,
  "source": "manual"
}
```

**Response (201):**
```json
{
  "message": "Mood logged successfully",
  "log": {
    "id": "health_mood123",
    "user_id": "user_abc123",
    "type": "mood",
    "payload": {
      "score": 8,
      "energy": 7,
      "stress": 3,
      "notes": "Feeling great today",
      "tags": ["happy", "productive"]
    },
    "recorded_at": 1641000000000,
    "source": "manual",
    "created_at": 1641000000000
  }
}
```

### Log Nutrition
**POST** `/api/health/nutrition`

Logs nutritional intake data.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "mealType": "breakfast",
  "foods": [
    {
      "name": "Oatmeal",
      "quantity": "1 cup",
      "calories": 150
    },
    {
      "name": "Banana",
      "quantity": "1 medium",
      "calories": 105
    }
  ],
  "totalCalories": 255,
  "waterMl": 250,
  "notes": "Healthy breakfast",
  "recordedAt": 1641000000000,
  "source": "manual"
}
```

**Response (201):**
```json
{
  "message": "Nutrition logged successfully",
  "log": {
    "id": "health_nutrition123",
    "user_id": "user_abc123",
    "type": "nutrition",
    "payload": {
      "meal_type": "breakfast",
      "foods": [
        {
          "name": "Oatmeal",
          "quantity": "1 cup",
          "calories": 150
        }
      ],
      "total_calories": 255,
      "water_ml": 250
    },
    "recorded_at": 1641000000000,
    "source": "manual",
    "created_at": 1641000000000
  }
}
```

### Log Hydration
**POST** `/api/health/hydration`

Logs hydration data.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amountMl": 500,
  "type": "water",
  "notes": "Post-workout hydration",
  "recordedAt": 1641000000000,
  "source": "manual"
}
```

**Response (201):**
```json
{
  "message": "Hydration logged successfully",
  "log": {
    "id": "health_hydration123",
    "user_id": "user_abc123",
    "type": "hydration",
    "payload": {
      "amount_ml": 500,
      "type": "water",
      "notes": "Post-workout hydration"
    },
    "recorded_at": 1641000000000,
    "source": "manual",
    "created_at": 1641000000000
  }
}
```

### Get Health Logs
**GET** `/api/health/logs`

Gets health logs with filtering options.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `type` (optional): `exercise`, `nutrition`, `mood`, `hydration`
- `source` (optional): `manual`, `auto`, `device`
- `startDate` (optional): Unix timestamp
- `endDate` (optional): Unix timestamp
- `limit` (optional): Number of results (max 100, default 50)
- `offset` (optional): Pagination offset

**Response (200):**
```json
{
  "logs": [
    {
      "id": "health_ex123",
      "user_id": "user_abc123",
      "type": "exercise",
      "payload": {
        "activity": "Running",
        "duration_minutes": 30,
        "intensity": 7
      },
      "recorded_at": 1641000000000,
      "source": "manual",
      "created_at": 1641000000000
    }
  ],
  "hasMore": false,
  "nextCursor": null,
  "total": 1
}
```

### Get Health Summary
**GET** `/api/health/summary`

Gets health summary for a specified period.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (optional): Number of days to include (default: 7, max: 365)

**Response (200):**
```json
{
  "summary": {
    "exerciseCount": 5,
    "nutritionCount": 21,
    "moodAverage": 7.5,
    "hydrationTotal": 14000
  },
  "period": {
    "days": 7,
    "startDate": 1640390400000,
    "endDate": 1641000000000
  }
}
```

## Dashboard

### Get Dashboard Data
**GET** `/api/dashboard`

Gets overview data for the user dashboard.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "taskStats": {
    "total": 25,
    "completed": 18,
    "pending": 6,
    "overdue": 1
  },
  "recentTasks": [
    {
      "id": "task_recent1",
      "title": "Review documents",
      "priority": 2,
      "status": "pending"
    }
  ],
  "upcomingTasks": [
    {
      "id": "task_upcoming1",
      "title": "Team meeting",
      "due_date": 1641081600000,
      "priority": 3
    }
  ],
  "lastUpdated": 1641000000000
}
```

## Localization

### Get Localized Content
**GET** `/api/localization/{language}`

Gets localized content for the specified language.

**Parameters:**
- `language`: Language code (`en`, `de`)

**Response (200):**
```json
{
  "language": "en",
  "content": {
    "app.name": "Time & Wellness",
    "app.tagline": "Your personal productivity and wellness companion",
    "tasks.title": "Tasks",
    "tasks.create_new": "Create New Task",
    "calendar.title": "Calendar",
    "health.title": "Health Tracking"
  }
}
```

## Error Responses

### Standard Error Format
All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": ["Specific validation error"]
  }
}
```

### HTTP Status Codes

- **200** - Success
- **201** - Created
- **204** - No Content
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid or missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (e.g., email already exists)
- **413** - Payload Too Large
- **415** - Unsupported Media Type
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:

## New Monitoring & Documentation Endpoints

### Health Monitoring
- **GET** `/api/health` - Get system health status
- **GET** `/api/health/detailed` - Get detailed system health with statistics
- **GET** `/api/health/ready` - Kubernetes readiness probe
- **GET** `/api/health/live` - Kubernetes liveness probe

### Metrics & Analytics
- **GET** `/api/metrics` - Get system metrics (JSON format)
- **POST** `/api/metrics` - Record custom metrics
- **GET** `/api/metrics/analytics` - Get comprehensive analytics
- **GET** `/api/metrics/realtime` - Get real-time metrics
- **GET** `/api/metrics/summary` - Get metrics summary
- **GET** `/api/metrics/prometheus` - Get Prometheus-compatible metrics

### OpenAPI Documentation
- **GET** `/api/openapi` - Get OpenAPI specification (JSON)
- **GET** `/api/openapi/yaml` - Get OpenAPI specification (YAML)
- **GET** `/api/openapi/json` - Get OpenAPI specification (JSON)

## Rate Limiting

### Authentication Endpoints
- **Limit:** 5 requests per 15 minutes
- **Scope:** Per IP address
- **Behavior:** Failed attempts don't count toward limit

### API Endpoints (Authenticated)
- **Limit:** 1000 requests per hour
- **Scope:** Per authenticated user
- **Behavior:** All requests count toward limit

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641003600
Retry-After: 3600
```

## Security

### Headers
All responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### Authentication
- JWT tokens expire after 1 hour
- Refresh tokens expire after 30 days
- All sensitive operations require re-authentication
- Passwords are hashed with bcrypt (10 rounds)

### Data Privacy
- User data is encrypted at rest
- All API calls must use HTTPS
- Personal data can be exported or deleted upon request

## SDK and Examples

### JavaScript/TypeScript Example
```javascript
// Initialize client
const client = new TimeWellnessAPI('https://api.timeandwellness.com');

// Login
const { tokens } = await client.auth.login('user@example.com', 'password');
client.setAccessToken(tokens.accessToken);

// Create task
const task = await client.tasks.create({
  title: 'Complete API documentation',
  priority: 2,
  dueDate: new Date('2024-01-15').getTime()
});

// Log exercise
const exercise = await client.health.logExercise({
  activity: 'Running',
  durationMinutes: 30,
  intensity: 7,
  caloriesBurned: 300
});
```

## Focus Sessions (Pomodoro)

### Get Session Templates
**GET** `/api/focus/templates`

Gets available focus session templates.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "templates": [
    {
      "key": "classic_pomodoro",
      "name": "Classic Pomodoro",
      "description": "Traditional 25-minute focus sessions",
      "focusDuration": 25,
      "shortBreakDuration": 5,
      "longBreakDuration": 15,
      "sessionsUntilLongBreak": 4
    }
  ]
}
```

### Start Focus Session
**POST** `/api/focus/sessions`

Starts a new focus session.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateKey": "classic_pomodoro",
  "taskId": "task_123",
  "environmentId": "env_456"
}
```

**Response (201):**
```json
{
  "session": {
    "id": "session_789",
    "userId": "user_abc123",
    "templateKey": "classic_pomodoro",
    "status": "active",
    "startTime": 1641000000000,
    "plannedEndTime": 1641001500000
  }
}
```

### Get Session Template
**GET** `/api/focus/templates/{templateKey}`

Gets a specific focus session template.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "key": "classic_pomodoro",
    "name": "Classic Pomodoro",
    "description": "Traditional 25-minute focus sessions",
    "focusDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "sessionsUntilLongBreak": 4
  }
}
```

### Get Focus Sessions
**GET** `/api/focus/sessions`

Gets user's focus sessions with filtering options.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by session status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "session_789",
      "templateKey": "classic_pomodoro",
      "status": "completed",
      "startTime": 1641000000000,
      "endTime": 1641001500000,
      "productivityRating": 8
    }
  ],
  "pagination": {
    "total": 25,
    "hasMore": false
  }
}
```

### Get Focus Session
**GET** `/api/focus/sessions/{sessionId}`

Gets details of a specific focus session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "session_789",
    "templateKey": "classic_pomodoro",
    "status": "active",
    "startTime": 1641000000000,
    "plannedEndTime": 1641001500000,
    "taskId": "task_123",
    "environmentId": "env_456"
  }
}
```

### Complete Focus Session
**PATCH** `/api/focus/sessions/{sessionId}/complete`

Completes an active focus session.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "actualEndTime": 1641001400000,
  "productivityRating": 8,
  "notes": "Great focus session"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "session_789",
    "status": "completed",
    "actualDuration": 23,
    "productivityRating": 8
  }
}
```

### Pause Focus Session
**PATCH** `/api/focus/sessions/{sessionId}/pause`

Pauses an active focus session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "session_789",
    "status": "paused",
    "pausedAt": 1641000900000
  }
}
```

### Resume Focus Session
**PATCH** `/api/focus/sessions/{sessionId}/resume`

Resumes a paused focus session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "session_789",
    "status": "active",
    "resumedAt": 1641001000000
  }
}
```

### Cancel Focus Session
**PATCH** `/api/focus/sessions/{sessionId}/cancel`

Cancels an active focus session.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Unexpected interruption"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Session cancelled successfully"
}
```

### Record Distraction
**POST** `/api/focus/sessions/{sessionId}/distractions`

Records a distraction during a focus session.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "notification",
  "description": "Phone notification",
  "duration": 30
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Distraction recorded successfully"
}
```

### Get Break Reminders
**GET** `/api/focus/break-reminders`

Gets user's break reminder settings.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "reminder_123",
      "type": "short_break",
      "interval": 25,
      "enabled": true,
      "message": "Time for a short break!"
    }
  ]
}
```

### Update Break Reminder
**PATCH** `/api/focus/break-reminders/{reminderId}`

Updates break reminder settings.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "enabled": false,
  "interval": 30
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Break reminder updated successfully"
}
```

### Get Focus Dashboard
**GET** `/api/focus/dashboard`

Gets focus session dashboard data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "todayStats": {
      "sessionsCompleted": 4,
      "totalFocusTime": 100,
      "averageProductivity": 7.5
    },
    "weeklyStats": {
      "totalSessions": 28,
      "totalFocusTime": 700,
      "streak": 5
    }
  }
}
```

### Get Focus Analytics
**GET** `/api/focus/analytics`

Gets detailed focus session analytics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `period` (optional): Analysis period (default: 30 days)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "productivity": {
      "average": 7.2,
      "trend": "improving",
      "bestTimeOfDay": "10:00"
    },
    "patterns": {
      "mostProductiveDays": ["Tuesday", "Wednesday"],
      "optimalSessionLength": 25,
      "distractionTypes": ["phone", "email"]
    }
  }
}
```

### Get Focus Patterns
**GET** `/api/focus/patterns`

Gets focus patterns and insights.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "type": "time_of_day",
        "insight": "Most productive between 9-11 AM",
        "confidence": 0.85
      }
    ]
  }
}
```

### Get Weekly Stats
**GET** `/api/focus/stats/weekly`

Gets weekly focus statistics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentWeek": {
      "sessions": 15,
      "focusTime": 375,
      "productivity": 7.8
    },
    "previousWeek": {
      "sessions": 12,
      "focusTime": 300,
      "productivity": 7.2
    }
  }
}
```

### Get Session Type Stats
**GET** `/api/focus/stats/session-types`

Gets statistics by session type.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "templateKey": "classic_pomodoro",
      "sessions": 45,
      "averageProductivity": 7.5,
      "completionRate": 0.89
    }
  ]
}
```

### Create Environment
**POST** `/api/focus/environments`

Creates a new focus environment.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Home Office",
  "description": "Quiet home office setup",
  "location": "Home",
  "noiseLevel": 2,
  "lighting": "Natural"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "env_123",
    "name": "Home Office",
    "location": "Home",
    "createdAt": 1641000000000
  }
}
```

### Get Environments
**GET** `/api/focus/environments`

Gets user's focus environments.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "env_123",
      "name": "Home Office",
      "location": "Home",
      "averageProductivity": 8.2,
      "sessionsCount": 25
    }
  ]
}
```

### Update Environment
**PATCH** `/api/focus/environments/{environmentId}`

Updates a focus environment.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Home Office",
  "noiseLevel": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Environment updated successfully"
}
```

### Delete Environment
**DELETE** `/api/focus/environments/{environmentId}`

Deletes a focus environment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Environment deleted successfully"
}
```

## Social Features

### Send Connection Request
**POST** `/api/social/connections/request`

Sends a connection request to another user.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "targetUserId": "user_def456",
  "message": "Let's connect and motivate each other!"
}
```

**Response (201):**
```json
{
  "message": "Connection request sent successfully",
  "connectionId": "conn_789"
}
```

### Get User Connections
**GET** `/api/social/connections`

Gets the user's connections and pending requests.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "connections": [
    {
      "id": "conn_123",
      "userId": "user_def456",
      "firstName": "Jane",
      "lastName": "Doe",
      "status": "accepted",
      "connectedAt": 1641000000000
    }
  ],
  "pendingRequests": []
}
```

### Create Challenge
**POST** `/api/social/challenges`

Creates a new social challenge.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "30-Day Fitness Challenge",
  "description": "Exercise for 30 minutes daily",
  "type": "exercise_streak",
  "targetValue": 30,
  "startDate": 1641000000000,
  "endDate": 1643592000000,
  "isPublic": true
}
```

## Student Verification

### Get Student Pricing
**GET** `/api/student-verification/pricing`

Gets student pricing information.

**Response (200):**
```json
{
  "pricing": {
    "regular": {
      "monthly": 9.99,
      "yearly": 99.99
    },
    "student": {
      "monthly": 4.99,
      "yearly": 49.99,
      "discount": 50
    }
  }
}
```

### Send Verification OTP
**POST** `/api/student-verification/user/send-otp`

Sends OTP to student email for verification.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentEmail": "student@university.edu"
}
```

**Response (200):**
```json
{
  "message": "OTP sent successfully",
  "expiresAt": 1641000600000
}
```

### Verify Student Email
**POST** `/api/student-verification/user/verify-otp`

Verifies the OTP for student email.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "123456"
}
```

## Advanced Health Insights

### Get Health Insights
**GET** `/api/health/insights`

Gets AI-powered health insights and recommendations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 30)

**Response (200):**
```json
{
  "insights": {
    "overallScore": 7.5,
    "trends": {
      "exercise": "improving",
      "nutrition": "stable",
      "mood": "declining"
    },
    "recommendations": [
      {
        "type": "exercise",
        "priority": "high",
        "message": "Consider adding 2 more cardio sessions per week"
      }
    ]
  }
}
```

### Manual Health Entry
**POST** `/api/health/manual-entry`

Generic health data logging for any health metric.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "weight",
  "value": 75.5,
  "unit": "kg",
  "notes": "Morning weight after workout",
  "category": "body_metrics",
  "recordedAt": 1641000000000
}
```

**Response (201):**
```json
{
  "message": "weight logged successfully",
  "healthLog": {
    "id": "health_log_123",
    "type": "weight",
    "value": 75.5,
    "unit": "kg",
    "recordedAt": 1641000000000
  }
}
```

### Get Health Statistics
**GET** `/api/health/stats`

Gets detailed health statistics and analytics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "stats": {
    "totalLogs": 156,
    "exerciseSessions": 45,
    "averageMood": 7.2,
    "totalCalories": 125000,
    "hydrationGoalMet": 0.85,
    "streaks": {
      "exercise": 7,
      "mood": 14,
      "hydration": 3
    }
  }
}
```

### Delete Health Log
**DELETE** `/api/health/logs/{id}`

Deletes a specific health log entry.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Health log deleted successfully"
}
```

### Get Health Goals
**GET** `/api/health/goals`

Gets the user's health goals.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "goals": [
    {
      "id": "goal_123",
      "goalType": "weight_loss",
      "title": "Lose 10 pounds",
      "targetValue": 10,
      "targetUnit": "lbs",
      "targetDate": 1643592000000,
      "progress": 6.5,
      "isActive": true
    }
  ]
}
```

### Create Health Goal
**POST** `/api/health/goals`

Creates a new health goal.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "goalType": "exercise_frequency",
  "title": "Exercise 5 times per week",
  "targetValue": 5,
  "targetUnit": "sessions",
  "targetDate": 1643592000000,
  "description": "Maintain consistent exercise routine"
}
```

**Response (201):**
```json
{
  "message": "Health goal created successfully",
  "goal": {
    "id": "goal_456",
    "goalType": "exercise_frequency",
    "title": "Exercise 5 times per week",
    "targetValue": 5,
    "targetDate": 1643592000000
  }
}
```

### Update Goal Progress
**PUT** `/api/health/goals/{id}/progress`

Updates progress for a specific health goal.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "value": 3.5,
  "notes": "Good progress this week"
}
```

**Response (200):**
```json
{
  "message": "Goal progress updated successfully"
}
```

### Get Nutrition Analysis
**GET** `/api/health/nutrition/analysis`

Gets detailed nutrition analysis and recommendations.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "analysis": {
    "dailyAverage": {
      "calories": 2150,
      "protein": 85,
      "carbs": 250,
      "fat": 75
    },
    "recommendations": [
      "Increase protein intake by 15g daily",
      "Consider more complex carbohydrates"
    ]
  }
}
```

### Generate Health Insights
**POST** `/api/health/insights/generate`

Generates new AI-powered health insights.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Health insights generated successfully",
  "insights": [
    {
      "type": "exercise",
      "message": "Your workout consistency has improved 25% this month",
      "confidence": 0.92
    }
  ]
}
```

### Mark Insight as Read
**PUT** `/api/health/insights/{id}/read`

Marks a health insight as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Insight marked as read"
}
```

### Get Health Dashboard
**GET** `/api/health/dashboard`

Gets comprehensive health dashboard data.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "dashboard": {
    "todayStats": {
      "steps": 8500,
      "calories": 2100,
      "water": 1800,
      "mood": 8
    },
    "weeklyTrends": {
      "exercise": "improving",
      "nutrition": "stable",
      "mood": "excellent"
    },
    "goals": {
      "completed": 3,
      "inProgress": 2,
      "total": 5
    }
  }
}
```

### Sync Device Data
**POST** `/api/health/device-sync`

Syncs health data from connected devices.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceType": "fitbit",
  "dataType": "steps",
  "data": {
    "steps": 10500,
    "distance": 8.2,
    "calories": 450,
    "activeMinutes": 65
  },
  "syncDate": 1641000000000
}
```

**Response (200):**
```json
{
  "message": "Device data synced successfully",
  "recordsProcessed": 4
}
```

### Track Wellness Mood
**POST** `/api/health/wellness/mood`

Tracks mood with additional wellness context.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "mood": 8,
  "energy": 7,
  "stress": 3,
  "context": "work",
  "activities": ["meditation", "exercise"],
  "notes": "Feeling great after morning workout"
}
```

**Response (201):**
```json
{
  "message": "Wellness mood tracked successfully",
  "entry": {
    "id": "wellness_mood_123",
    "mood": 8,
    "energy": 7,
    "recordedAt": 1641000000000
  }
}
```

### Save Daily Reflection
**POST** `/api/health/wellness/reflection`

Saves daily wellness reflection.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reflection": "Today was productive and fulfilling. Managed to complete all tasks and felt energized.",
  "highlights": ["Completed project", "Good workout", "Quality time with family"],
  "improvements": ["Could have slept earlier"],
  "tomorrowGoals": ["Start new project", "Try yoga class"]
}
```

**Response (201):**
```json
{
  "message": "Daily reflection saved successfully",
  "reflection": {
    "id": "reflection_123",
    "date": "2024-01-15",
    "wordCount": 85
  }
}
```

### Save Gratitude Entries
**POST** `/api/health/wellness/gratitude`

Saves gratitude journal entries.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "entries": [
    "Grateful for my health and energy today",
    "Thankful for supportive colleagues",
    "Appreciative of beautiful weather"
  ],
  "mood": 9
}
```

**Response (201):**
```json
{
  "message": "Gratitude entries saved successfully",
  "entry": {
    "id": "gratitude_123",
    "entriesCount": 3,
    "recordedAt": 1641000000000
  }
}
```

### Analyze Health Patterns
**GET** `/api/health/analytics/patterns`

Analyzes health patterns and trends.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `days` (optional): Analysis period in days (default: 30)
- `type` (optional): Focus on specific health type

**Response (200):**
```json
{
  "patterns": {
    "exercise": {
      "bestDays": ["Monday", "Wednesday", "Friday"],
      "averageIntensity": 7.2,
      "trend": "improving"
    },
    "mood": {
      "averageScore": 7.8,
      "highestHour": 10,
      "correlations": ["exercise", "sleep"]
    }
  }
}
```

### Find Health Correlations
**GET** `/api/health/analytics/correlations`

Finds correlations between different health metrics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "correlations": [
    {
      "metrics": ["exercise", "mood"],
      "correlation": 0.78,
      "strength": "strong",
      "insight": "Exercise sessions strongly correlate with improved mood"
    },
    {
      "metrics": ["sleep", "energy"],
      "correlation": 0.65,
      "strength": "moderate",
      "insight": "Better sleep quality leads to higher energy levels"
    }
  ]
}
```

## Localization

### Get Localized Content
**GET** `/api/localization/{language}`

Gets localized content for the specified language.

**Parameters:**
- `language`: Language code (`en`, `de`)

**Response (200):**
```json
{
  "language": "de",
  "content": {
    "app.name": "Zeit & Wellness",
    "app.tagline": "Ihr persönlicher Produktivitäts- und Wellness-Begleiter",
    "tasks.title": "Aufgaben",
    "tasks.create_new": "Neue Aufgabe erstellen"
  },
  "pricing": {
    "currency": "EUR",
    "monthly": "9,99 €",
    "yearly": "99,99 €"
  }
}
```

### Get Cultural Adaptations
**GET** `/api/localization/cultural/{country}`

Gets cultural adaptations for specific countries.

**Parameters:**
- `country`: Country code (`DE`, `AT`, `CH`)

**Response (200):**
```json
{
  "country": "DE",
  "dateFormat": "DD.MM.YYYY",
  "timeFormat": "HH:mm",
  "currency": "EUR",
  "taxRate": 0.19,
  "workingHours": {
    "start": "09:00",
    "end": "17:00"
  }
}
```

## Admin Dashboard

### Get Dashboard Statistics
**GET** `/api/admin/dashboard`

Gets comprehensive admin dashboard statistics.

**Headers:**
```
Authorization: Bearer <access_token>
X-Admin-Role: admin
```

**Response (200):**
```json
{
  "stats": {
    "totalUsers": 15420,
    "activeUsers": 8934,
    "totalTasks": 45678,
    "completedTasks": 32145,
    "revenue": 125430.50,
    "supportTickets": {
      "open": 23,
      "resolved": 156
    }
  }
}
```

### Create Support Ticket
**POST** `/api/admin/support-tickets`

Creates a new support ticket.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Login Issues",
  "description": "Unable to log in with correct credentials",
  "priority": "medium",
  "category": "technical"
}
```

## Badge System

### Get User Badges
**GET** `/api/badges/user`

Gets the current user's badges and progress.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "badges": [
    {
      "id": "early_bird",
      "name": "Early Bird",
      "description": "Complete 10 tasks before 9 AM",
      "unlockedAt": 1641000000000,
      "progress": {
        "current": 10,
        "target": 10,
        "percentage": 100
      }
    }
  ],
  "totalBadges": 15,
  "unlockedBadges": 8
}
```

### Share Badge Achievement
**POST** `/api/badges/share`

Shares a badge achievement on social platforms.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "badgeId": "early_bird",
  "platform": "twitter",
  "message": "Just earned my Early Bird badge! 🌅"
}
```

## Voice Processing

### Upload Voice Note
**POST** `/api/voice/upload`

Uploads and processes a voice note.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
audio: <audio_file>
language: en
processType: transcribe_and_analyze
```

**Response (201):**
```json
{
  "voiceNote": {
    "id": "voice_123",
    "transcription": "Remember to call the client tomorrow",
    "confidence": 0.95,
    "analysis": {
      "sentiment": "neutral",
      "actionItems": ["Call client"],
      "priority": "medium"
    },
    "audioUrl": "https://r2.timeandwellness.com/voice/voice_123.mp3"
  }
}
```

### Get Voice Notes
**GET** `/api/voice/notes`

Gets user's voice notes with filtering options.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of results (max 100, default 50)
- `offset` (optional): Pagination offset
- `startDate` (optional): Unix timestamp for date range
- `endDate` (optional): Unix timestamp for date range

**Response (200):**
```json
{
  "notes": [
    {
      "id": "voice_123",
      "transcription": "Remember to call the client tomorrow",
      "confidence": 0.95,
      "createdAt": 1641000000000,
      "audioUrl": "https://r2.timeandwellness.com/voice/voice_123.mp3"
    }
  ],
  "total": 1
}
```

### Interpret Voice Command
**POST** `/api/voice/commands/interpret`

Interprets a voice command using AI.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "transcription": "Create a task to review the project proposal",
  "context": "task_management"
}
```

**Response (200):**
```json
{
  "interpretation": {
    "intent": "create_task",
    "confidence": 0.95,
    "parameters": {
      "title": "Review the project proposal",
      "priority": "medium"
    }
  }
}
```

### Execute Voice Command
**POST** `/api/voice/commands/execute`

Executes an interpreted voice command.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "intent": "create_task",
  "parameters": {
    "title": "Review the project proposal",
    "priority": "medium"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "taskId": "task_new123",
    "message": "Task created successfully"
  }
}
```

### Get Voice Analytics
**GET** `/api/voice/analytics/usage`

Gets voice processing usage analytics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "usage": {
    "totalUploads": 156,
    "totalDuration": 7890,
    "averageAccuracy": 0.94,
    "languageBreakdown": {
      "en": 120,
      "de": 36
    }
  },
  "period": {
    "days": 30,
    "startDate": 1640390400000,
    "endDate": 1641000000000
  }
}
```

## Payments & Subscriptions

### Get Subscription Plans
**GET** `/api/payments/plans`

Gets available subscription plans.

**Response (200):**
```json
{
  "plans": [
    {
      "id": "basic_monthly",
      "name": "Basic Monthly",
      "description": "Essential features for personal productivity",
      "price": 999,
      "currency": "USD",
      "interval": "month",
      "features": [
        "Unlimited tasks",
        "Basic health tracking",
        "Priority support",
        "Export data"
      ],
      "pricePerMonth": 999
    },
    {
      "id": "premium",
      "name": "Premium Monthly",
      "description": "Advanced features for power users",
      "price": 1999,
      "currency": "USD",
      "interval": "month",
      "features": [
        "All Basic features",
        "AI-powered insights",
        "Advanced analytics",
        "Calendar integrations",
        "Voice transcription",
        "Custom badges",
        "Priority AI processing"
      ],
      "pricePerMonth": 1999
    }
  ]
}
```

### Get User Subscription
**GET** `/api/payments/subscription`

Gets the current user's subscription status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200) - With Active Subscription:**
```json
{
  "subscription": {
    "id": "sub_123",
    "plan": "premium",
    "status": "active",
    "currentPeriodEnd": 1643592000000,
    "isActive": true
  }
}
```

**Response (200) - No Subscription:**
```json
{
  "subscription": null,
  "availablePlans": [
    {
      "id": "basic_monthly",
      "name": "Basic Monthly",
      "price": 999,
      "features": ["Unlimited tasks", "Basic health tracking"]
    }
  ]
}
```

### Create Subscription Checkout
**POST** `/api/payments/subscription/create`

Creates a Stripe checkout session for subscription.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "premium",
  "billingCycle": "monthly"
}
```

**Response (200):**
```json
{
  "sessionId": "cs_test_session123",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_session123"
}
```

### Cancel Subscription
**POST** `/api/payments/subscription/cancel`

Cancels the user's active subscription.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Subscription cancelled successfully",
  "subscription": {
    "status": "cancelled"
  }
}
```

**Response (404) - No Active Subscription:**
```json
{
  "error": "No active subscription found"
}
```

### Get Payment Methods
**GET** `/api/payments/payment-methods`

Gets the user's saved payment methods.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "paymentMethods": [
    {
      "id": "pm_test_123",
      "type": "card",
      "last4": "4242",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "brand": "visa",
      "isDefault": true
    }
  ]
}
```

### Add Payment Method
**POST** `/api/payments/payment-methods`

Creates a setup intent for adding a new payment method.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "clientSecret": "seti_test_123_secret_abc123",
  "setupIntentId": "seti_test_123"
}
```

### Remove Payment Method
**DELETE** `/api/payments/payment-methods/{id}`

Removes a saved payment method.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Payment method removed successfully"
}
```

### Get Billing History
**GET** `/api/payments/billing/history`

Gets the user's billing history and invoices.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "invoices": [
    {
      "id": "in_test_123",
      "amount": 1999,
      "status": "paid",
      "date": 1641000000000,
      "downloadUrl": "https://invoice.stripe.com/in_test_123",
      "description": "Payment for subscription"
    }
  ],
  "pagination": {
    "hasMore": false
  }
}
```

### Get Upcoming Invoice
**GET** `/api/payments/billing/upcoming`

Gets preview of the next invoice.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "invoice": {
    "amount": 1999,
    "currency": "usd",
    "periodStart": 1641000000000,
    "periodEnd": 1643592000000,
    "lineItems": [
      {
        "description": "Premium Monthly Subscription",
        "amount": 1999
      }
    ]
  }
}
```

### Get Payment History
**GET** `/api/payments/history`

Gets the user's complete payment and subscription history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "history": [
    {
      "subscriptionId": "sub_123",
      "planId": "premium",
      "amount": 1999,
      "currency": "USD",
      "status": "active",
      "paymentDate": 1641000000000,
      "periodStart": 1641000000000,
      "periodEnd": 1643592000000
    }
  ],
  "totalRecords": 1
}
```

### Get Usage Analytics
**GET** `/api/payments/usage`

Gets subscription usage analytics and limits.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "plan": "premium",
  "limits": {
    "tasks": 1000,
    "storage": 5368709120,
    "ai_requests": 500
  },
  "current": {
    "tasks": 45,
    "storage": 1073741824,
    "ai_requests": 23
  },
  "percentUsed": {
    "tasks": 4.5,
    "storage": 20.0,
    "ai_requests": 4.6
  }
}
```

**Response (200) - No Subscription:**
```json
{
  "hasSubscription": false,
  "usage": {}
}
```

### Stripe Webhook Handler
**POST** `/api/payments/webhooks/stripe`

Handles Stripe webhook events for subscription updates.

**Headers:**
```
stripe-signature: <webhook_signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "evt_test_webhook",
  "object": "event",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_test_123",
      "customer": "cus_test_123",
      "status": "active"
    }
  }
}
```

**Response (200):**
```json
{
  "received": true
}
```

**Supported Webhook Events:**
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

## Calendar Integration

### Get Calendar Events
**GET** `/api/calendar/events`

Gets the user's calendar events with optional filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "analytics": {
    "totalNotes": 45,
    "totalDuration": 3600,
    "averageConfidence": 0.92,
    "commandsExecuted": 23,
    "topCommands": ["create_task", "set_reminder"]
  }
}
```

## Push Notifications

### Register Device
**POST** `/api/notifications/devices/register`

Registers a device for push notifications.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceToken": "device_token_123",
  "platform": "ios",
  "appVersion": "1.0.0"
}
```

**Response (201):**
```json
{
  "message": "Device registered successfully",
  "deviceId": "device_456"
}
```

### Update Notification Preferences
**PUT** `/api/notifications/preferences`

Updates user's notification preferences.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "taskReminders": true,
  "healthReminders": true,
  "socialNotifications": false,
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

**Response (200):**
```json
{
  "message": "Preferences updated successfully",
  "preferences": {
    "taskReminders": true,
    "healthReminders": true,
    "socialNotifications": false,
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }
}
```

### Send Notification
**POST** `/api/notifications/send`

Sends a push notification to the user.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "task_reminder",
  "title": "Task Reminder",
  "message": "Don't forget to complete your daily review",
  "data": {
    "taskId": "task_123"
  }
}
```

**Response (200):**
```json
{
  "message": "Notification sent successfully",
  "notificationId": "notif_789"
}
```

### Get Notification History
**GET** `/api/notifications/history`

Gets user's notification history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of results (max 100, default 50)
- `type` (optional): Filter by notification type

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif_789",
      "type": "task_reminder",
      "title": "Task Reminder",
      "message": "Don't forget to complete your daily review",
      "sentAt": 1641000000000,
      "opened": true
    }
  ],
  "total": 1
}
```

## AI Meeting Scheduling

### Create Meeting Request
**POST** `/api/calendar/meetings/request`

Creates an AI-powered meeting request.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Project Review Meeting",
  "description": "Quarterly project review",
  "duration": 60,
  "participants": ["user_def456", "user_ghi789"],
  "preferredTimeSlots": [
    {
      "start": 1641027600000,
      "end": 1641031200000
    }
  ],
  "meetingType": "video_call"
}
```

**Response (201):**
```json
{
  "meetingRequest": {
    "id": "meeting_req_123",
    "suggestedSlots": [
      {
        "start": 1641027600000,
        "end": 1641031200000,
        "score": 0.95,
        "conflicts": []
      }
    ],
    "status": "pending_responses"
  }
}
```

### Get Meeting Requests
**GET** `/api/calendar/meetings/requests`

Gets user's meeting requests.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "requests": [
    {
      "id": "meeting_req_123",
      "title": "Project Review Meeting",
      "status": "pending_responses",
      "createdAt": 1641000000000,
      "participants": ["user_def456", "user_ghi789"]
    }
  ]
}
```

### Respond to Meeting Request
**POST** `/api/calendar/meetings/{id}/respond`

Responds to a meeting request.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "response": "accept",
  "selectedSlot": {
    "start": 1641027600000,
    "end": 1641031200000
  }
}
```

**Response (200):**
```json
{
  "message": "Response recorded successfully",
  "meetingStatus": "confirmed"
}
```

## Real-Time Features

### Server-Sent Events (SSE) Connection
**GET** `/api/realtime/sse`

Establishes a real-time connection for live updates.

**Headers:**
```
Authorization: Bearer <access_token>
Accept: text/event-stream
Cache-Control: no-cache
```

**Response (200):**
```
data: {"type":"connected","data":{"connectionId":"sse_123","timestamp":1641027600000}}

event: task.created
data: {"taskId":"task_123","title":"New Task","priority":"high"}

event: calendar.event.created
data: {"eventId":"event_123","title":"Meeting","startTime":1641027600000}
```

### Subscribe to Event Types
**POST** `/api/realtime/sse/subscribe`

Subscribe to specific event types.

**Request Body:**
```json
{
  "connectionId": "sse_123",
  "eventTypes": ["task.created", "calendar.event.updated", "focus.session.started"]
}
```

### Real-Time Calendar Synchronization
**POST** `/api/realtime/calendar/sync`

Start real-time calendar synchronization.

**Request Body:**
```json
{
  "provider": "google"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Calendar sync started for google",
  "provider": "google"
}
```

### Get Calendar Sync Status
**GET** `/api/realtime/calendar/sync/status`

Get current synchronization status.

**Response (200):**
```json
{
  "statuses": [
    {
      "userId": "user_123",
      "provider": "google",
      "status": "syncing",
      "lastSyncAt": 1641027600000,
      "conflictsCount": 2
    }
  ]
}
```

### Resolve Calendar Conflict
**POST** `/api/realtime/calendar/conflicts/resolve`

Resolve calendar synchronization conflicts.

**Request Body:**
```json
{
  "conflictId": "conflict_123",
  "resolution": "local_wins"
}
```

### Create Recurring Event
**POST** `/api/realtime/calendar/events/recurring`

Create a recurring calendar event.

**Request Body:**
```json
{
  "title": "Weekly Team Meeting",
  "description": "Our weekly team sync",
  "startTime": 1641027600000,
  "endTime": 1641031200000,
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "endDate": 1648771200000
  }
}
```

## Mobile Platform Features

### Register Mobile Device
**POST** `/api/mobile/device/register`

Register a mobile device for push notifications.

**Request Body:**
```json
{
  "deviceToken": "device_token_123",
  "platform": "ios",
  "appVersion": "1.0.0",
  "osVersion": "17.0",
  "capabilities": {
    "pushNotifications": true,
    "backgroundSync": true,
    "hapticFeedback": true,
    "camera": true,
    "voice": true
  }
}
```

### Send Push Notification
**POST** `/api/mobile/notifications/send`

Send a push notification to user's devices.

**Request Body:**
```json
{
  "userId": "user_123",
  "title": "Task Reminder",
  "body": "Don't forget: Complete project",
  "type": "task_reminder",
  "platform": "ios",
  "data": {
    "taskId": "task_123"
  }
}
```

### Schedule Task Reminder
**POST** `/api/mobile/notifications/task-reminder`

Schedule a task reminder notification.

**Request Body:**
```json
{
  "taskId": "task_123",
  "taskTitle": "Complete project",
  "reminderTime": 1641027600000,
  "platform": "ios"
}
```

### Offline Sync Upload
**POST** `/api/mobile/sync/upload`

Upload offline sync data.

**Request Body:**
```json
{
  "lastSyncAt": 1641027600000,
  "pendingChanges": {
    "tasks": [
      {
        "id": "task_123",
        "title": "New Task",
        "status": "pending",
        "created_at": 1641027600000
      }
    ],
    "events": [],
    "healthData": [],
    "habits": []
  }
}
```

### Offline Sync Download
**GET** `/api/mobile/sync/download`

Download pending changes for offline sync.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "lastSyncAt": 1641027600000,
    "pendingChanges": {
      "tasks": [],
      "events": [],
      "healthData": [],
      "habits": []
    },
    "conflicts": []
  }
}
```

### Process Camera Data
**POST** `/api/mobile/camera/process`

Process camera data for food scanning or document recognition.

**Request Body:**
```json
{
  "type": "food",
  "imageBase64": "base64_encoded_image_data",
  "metadata": {
    "timestamp": 1641027600000,
    "location": "restaurant"
  }
}
```

### Process Voice Command
**POST** `/api/mobile/voice/process`

Process voice commands for task creation.

**Request Body:**
```json
{
  "audioBase64": "base64_encoded_audio_data",
  "language": "en",
  "context": "task_creation"
}
```

## Database Migrations

### Get Migration Status
**GET** `/api/migrations/status`

Get current migration status and history.

**Response (200):**
```json
{
  "success": true,
  "status": {
    "totalMigrations": 15,
    "appliedMigrations": 14,
    "pendingMigrations": 1,
    "lastAppliedVersion": 14,
    "migrations": [
      {
        "id": "015_high_priority_features",
        "version": 15,
        "name": "High Priority Features",
        "status": "pending"
      }
    ]
  }
}
```

### Run Migrations
**POST** `/api/migrations/run`

Run all pending migrations.

**Response (200):**
```json
{
  "success": true,
  "appliedMigrations": ["015_high_priority_features"],
  "failedMigrations": [],
  "errors": [],
  "message": "Migrations completed successfully"
}
```

### Rollback Last Migration
**POST** `/api/migrations/rollback`

Rollback the last applied migration.

**Response (200):**
```json
{
  "success": true,
  "appliedMigrations": ["015_high_priority_features"],
  "message": "Rollback completed successfully"
}
```

### Validate Migrations
**GET** `/api/migrations/validate`

Validate migration integrity.

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "message": "All migrations are valid"
}
```

## Enhanced Security Features

### Log Audit Event
**POST** `/api/security/audit/log`

Log a security audit event.

**Request Body:**
```json
{
  "action": "user_login",
  "resource": "authentication",
  "resourceId": "user_123",
  "details": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "severity": "medium"
}
```

### Get Audit Logs
**GET** `/api/security/audit/logs`

Get audit logs with filtering.

**Query Parameters:**
- `userId` - Filter by user ID
- `action` - Filter by action type
- `severity` - Filter by severity level
- `startTime` - Start timestamp
- `endTime` - End timestamp
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**Response (200):**
```json
{
  "success": true,
  "logs": [
    {
      "id": "audit_123",
      "userId": "user_123",
      "action": "user_login",
      "resource": "authentication",
      "timestamp": 1641027600000,
      "severity": "medium",
      "success": true
    }
  ],
  "count": 1
}
```

### Check Rate Limit
**POST** `/api/security/rate-limit/check`

Check rate limiting for an action.

**Request Body:**
```json
{
  "identifier": "user_123",
  "action": "api_call",
  "limit": 100,
  "windowMs": 3600000
}
```

**Response (200):**
```json
{
  "success": true,
  "allowed": true,
  "remaining": 95,
  "resetTime": 1641031200000
}
```

### Encrypt Data
**POST** `/api/security/encrypt`

Encrypt sensitive data.

**Request Body:**
```json
{
  "data": "sensitive_information"
}
```

**Response (200):**
```json
{
  "success": true,
  "encryptedData": "encrypted_data_string",
  "message": "Data encrypted successfully"
}
```

### Generate Compliance Report
**POST** `/api/security/compliance/report`

Generate compliance report for auditing.

**Request Body:**
```json
{
  "reportType": "gdpr",
  "period": {
    "start": 1641027600000,
    "end": 1643619600000
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "report": {
    "reportId": "report_123",
    "reportType": "gdpr",
    "generatedAt": 1641027600000,
    "data": {
      "totalUsers": 1000,
      "dataProcessed": 50000,
      "securityIncidents": 2
    },
    "compliance": {
      "gdpr": true,
      "ccpa": true
    }
  }
}
```

### Get Security Dashboard
**GET** `/api/security/dashboard`

Get security dashboard data.

**Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "totalAuditLogs": 10000,
    "securityEvents": 25,
    "criticalEvents": 2,
    "recentActivity": [],
    "topActions": [
      {"action": "user_login", "count": 5000},
      {"action": "task_created", "count": 3000}
    ],
    "complianceStatus": {
      "gdpr": true,
      "ccpa": true,
      "hipaa": false
    }
  }
}
```

## Support

For API support, please contact:
- **Email:** api-support@timeandwellness.com
- **Documentation:** https://docs.timeandwellness.com
- **Status Page:** https://status.timeandwellness.com
- **GitHub Issues:** https://github.com/timeandwellness/api/issues