# Time & Wellness API Quick Reference

**Version:** 2.0  
**Base URL:** `https://api.timeandwellness.com`

## Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh JWT token |
| GET | `/auth/validate` | Validate current token |
| GET | `/auth/me` | Get current user info |

## Core API Endpoints

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get user tasks |
| POST | `/api/tasks` | Create new task |
| GET | `/api/tasks/{id}` | Get specific task |
| PUT | `/api/tasks/{id}` | Update task |
| PATCH | `/api/tasks/{id}/complete` | Complete task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/tasks/stats` | Get task statistics |

### Health Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/health/exercise` | Log exercise activity |
| POST | `/api/health/mood` | Log mood data |
| POST | `/api/health/nutrition` | Log nutrition data |
| POST | `/api/health/hydration` | Log hydration data |
| GET | `/api/health/logs` | Get health logs |
| GET | `/api/health/summary` | Get health summary |
| GET | `/api/health/insights` | Get AI health insights |
| POST | `/api/health/goals` | Create health goal |

## New Features (v2.0)

### Focus Sessions (Pomodoro)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/focus/templates` | Get session templates |
| POST | `/api/focus/sessions` | Start focus session |
| GET | `/api/focus/sessions` | Get user sessions |
| PATCH | `/api/focus/sessions/{id}/complete` | Complete session |
| GET | `/api/focus/sessions/{id}/distractions` | Get session distractions |
| POST | `/api/focus/sessions/{id}/distractions` | Log distraction |
| GET | `/api/focus/dashboard` | Get focus dashboard |
| GET | `/api/focus/analytics` | Get focus analytics |
| GET | `/api/focus/environments` | Get focus environments |
| POST | `/api/focus/environments` | Create focus environment |

### Eisenhower Matrix

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/matrix` | Get tasks by quadrant |
| GET | `/api/tasks/matrix/stats` | Get matrix statistics |
| PATCH | `/api/tasks/{id}/matrix` | Update task quadrant |

### Push Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/devices/register` | Register device |
| PUT | `/api/notifications/preferences` | Update preferences |
| POST | `/api/notifications/send` | Send notification |
| GET | `/api/notifications/history` | Get notification history |
| GET | `/api/notifications/templates` | Get notification templates |

### Social Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social/connections/request` | Send connection request |
| GET | `/api/social/connections` | Get user connections |
| POST | `/api/social/connections/{id}/accept` | Accept connection |
| POST | `/api/social/challenges` | Create challenge |
| GET | `/api/social/challenges/public` | Get public challenges |
| POST | `/api/social/achievements/share` | Share achievement |

### Student Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student-verification/pricing` | Get student pricing |
| POST | `/api/student-verification/user/send-otp` | Send verification OTP |
| POST | `/api/student-verification/user/verify-otp` | Verify student email |
| GET | `/api/student-verification/user/status` | Get verification status |

### Localization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/localization/{language}` | Get localized content |
| GET | `/api/localization/cultural/{country}` | Get cultural adaptations |

### Admin Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get admin statistics |
| GET | `/api/admin/analytics` | Get user analytics |
| POST | `/api/admin/support-tickets` | Create support ticket |
| GET | `/api/admin/metrics` | Get system metrics |

### Badge System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/badges/user` | Get user badges |
| POST | `/api/badges/share` | Share badge achievement |
| GET | `/api/badges/leaderboard` | Get badge leaderboard |

### Voice Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/upload` | Upload voice note |
| GET | `/api/voice/notes` | Get voice notes |
| GET | `/api/voice/notes/{id}` | Get specific voice note |
| GET | `/api/voice/notes/{id}/audio` | Get voice note audio |
| POST | `/api/voice/commands/interpret` | Interpret voice command |
| POST | `/api/voice/commands/execute` | Execute voice command |
| GET | `/api/voice/analytics/usage` | Get usage analytics |
| GET | `/api/voice/analytics/accuracy` | Get accuracy analytics |
| GET | `/api/voice/settings` | Get voice settings |
| PUT | `/api/voice/settings` | Update voice settings |

### AI Meeting Scheduling

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calendar/meetings/request` | Create meeting request |
| GET | `/api/calendar/meetings/requests` | Get meeting requests |
| POST | `/api/calendar/meetings/{id}/respond` | Respond to meeting |
| GET | `/api/calendar/meetings/{id}/availability` | Check availability |
| POST | `/api/calendar/meetings/{id}/reschedule` | Reschedule meeting |
| DELETE | `/api/calendar/meetings/{id}` | Cancel meeting |

## Authentication

All API endpoints (except auth endpoints) require a Bearer token:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## HTTP Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **409** - Conflict
- **429** - Rate Limited
- **500** - Internal Server Error

## Rate Limits

- **Auth endpoints:** 5 requests per 15 minutes per IP
- **API endpoints:** 1000 requests per hour per user

## Supported Languages

- **English (en)** - Default
- **German (de)** - Full localization with cultural adaptations

## Student Verification

Students can get 50% discount on all plans by verifying their educational email address through the student verification system.

## Feature Flags

Some features may be controlled by feature flags and may not be available to all users immediately.