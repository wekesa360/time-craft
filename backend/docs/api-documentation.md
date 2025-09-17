# Time & Wellness API Documentation

**Version:** 2.0  
**Base URL:** `https://api.timeandwellness.com`  
**Authentication:** Bearer Token (JWT)  
**Last Updated:** January 15, 2025

## Overview

The Time & Wellness API provides comprehensive endpoints for managing productivity, health tracking, wellness data, social features, and advanced AI-powered insights. All API endpoints return JSON and use standard HTTP status codes.

### New Features in v2.0
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
  "type": "exercise_frequency",
  "targetValue": 5,
  "targetPeriod": "weekly",
  "startDate": 1641000000000,
  "endDate": 1643592000000,
  "description": "Exercise 5 times per week"
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

## Support

For API support, please contact:
- **Email:** api-support@timeandwellness.com
- **Documentation:** https://docs.timeandwellness.com
- **Status Page:** https://status.timeandwellness.com
- **GitHub Issues:** https://github.com/timeandwellness/api/issues