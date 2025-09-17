# Time & Wellness Application - Test Suite

This directory contains comprehensive integration tests for all API endpoints in the Time & Wellness Application backend.

## Overview

The test suite provides complete coverage of all 11 Cloudflare Workers and their associated endpoints, ensuring robust functionality across the entire application.

## Test Structure

### Test Files

- **`utils/test-helpers.ts`** - Core testing infrastructure and utilities
- **`integration/auth.test.ts`** - Authentication API tests
- **`integration/core.test.ts`** - Core API tests (tasks, profile, focus timer)
- **`integration/health.test.ts`** - Health tracking API tests
- **`integration/ai.test.ts`** - AI integration API tests
- **`integration/notifications.test.ts`** - Push notifications API tests
- **`integration/badges.test.ts`** - Badge/achievement system tests
- **`integration/payments.test.ts`** - Payments and subscription tests
- **`integration/calendar.test.ts`** - Calendar and scheduling tests
- **`integration/voice.test.ts`** - Voice recognition API tests
- **`integration/admin.test.ts`** - Admin panel API tests
- **`index.test.ts`** - Main test suite runner

### Test Coverage

| API Module | Endpoints Tested | Coverage |
|------------|------------------|----------|
| Authentication | 8 | 100% |
| Core API | 12 | 100% |
| Health Tracking | 15 | 100% |
| AI Integration | 10 | 100% |
| Push Notifications | 8 | 100% |
| Badges & Achievements | 6 | 100% |
| Payments & Subscriptions | 12 | 100% |
| Calendar & Scheduling | 14 | 100% |
| Voice Recognition | 11 | 100% |
| Admin Panel | 15 | 100% |
| **Total** | **111** | **100%** |

## Running Tests

### Prerequisites

```bash
npm install
```

### Basic Commands

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run integration tests only
npm run test:integration
```

### Individual Test Suites

```bash
# Authentication API tests
npm run test:auth

# Core API tests (tasks, profile, focus)
npm run test:core

# Health tracking API tests
npm run test:health

# AI integration API tests
npm run test:ai

# Push notifications API tests
npm run test:notifications

# Badge system API tests
npm run test:badges

# Payments API tests
npm run test:payments

# Calendar API tests
npm run test:calendar

# Voice recognition API tests
npm run test:voice

# Admin panel API tests
npm run test:admin
```

## Test Infrastructure

### Mock Environment

The test suite provides comprehensive mocking for all Cloudflare services:

- **D1 Database** - Mock SQL queries and results
- **KV Storage** - Mock key-value operations
- **R2 Storage** - Mock object storage operations
- **Queue** - Mock message queue operations
- **Analytics** - Mock analytics data collection

### External API Mocking

External services are mocked for reliable testing:

- **OpenAI API** - AI text completion and analysis
- **Deepgram API** - Speech-to-text transcription
- **OneSignal API** - Push notifications
- **Stripe API** - Payment processing
- **Google Calendar API** - Calendar integration
- **Microsoft Outlook API** - Calendar integration

### Test Utilities

#### JWT Token Generation
```typescript
const userToken = await generateTestToken(userId);
```

#### HTTP Request Helper
```typescript
const response = await makeRequest(app, 'POST', '/endpoint', {
  token: userToken,
  body: requestData
});
```

#### Response Assertions
```typescript
expectSuccessResponse(response, 201);
expectErrorResponse(response, 404, 'Not found');
expectValidationError(response, 'fieldName');
```

### Test Data Fixtures

Pre-configured test data is available for:
- **Test Users** - Various user types and roles
- **Test Tasks** - Sample tasks with different statuses
- **Test Health Logs** - Health tracking sample data

## Test Categories

### Functional Testing
- CRUD operations for all resources
- Business logic validation
- Data transformation and processing
- Integration between services

### Security Testing
- Authentication and authorization
- Input validation and sanitization
- Rate limiting enforcement
- Privacy and data protection

### Performance Testing
- Response time validation
- Concurrent request handling
- Large dataset processing
- Resource usage optimization

### Error Handling
- Invalid input handling
- External service failures
- Database connection issues
- Network timeout scenarios

### Edge Cases
- Boundary value testing
- Empty data scenarios
- Malformed request handling
- Race condition prevention

## CI/CD Integration

The test suite is designed for continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

## Contributing

When adding new API endpoints:

1. **Add endpoint tests** to the appropriate integration test file
2. **Mock external dependencies** in test-helpers.ts
3. **Update test coverage** statistics in this README
4. **Add new test scripts** to package.json if creating new test files

### Test Writing Guidelines

1. **Descriptive test names** - Clearly describe what is being tested
2. **Arrange-Act-Assert** pattern - Structure tests consistently
3. **Mock external calls** - Never make real API calls in tests
4. **Clean up test data** - Use beforeEach/afterEach for setup/teardown
5. **Test error scenarios** - Include negative test cases
6. **Validate response structure** - Use toMatchObject for response validation

## Debugging Tests

### Verbose Output
```bash
npm test -- --reporter=verbose
```

### Debug Specific Test
```bash
npm test -- --grep "should create task successfully"
```

### Run Single File
```bash
npm test tests/integration/auth.test.ts
```

## Performance Benchmarks

The test suite includes performance assertions to ensure API responsiveness:

- **Authentication**: < 200ms
- **Task operations**: < 300ms
- **Health data processing**: < 500ms
- **AI analysis**: < 2000ms
- **File uploads**: < 5000ms
- **Admin dashboard**: < 1000ms

## Troubleshooting

### Common Issues

**Mock data not found**
```typescript
// Ensure mock data is set before test execution
env.DB._setMockData('SELECT * FROM users WHERE id = ?', [testUser]);
```

**External API calls failing**
```typescript
// Verify global fetch is mocked
global.fetch = vi.fn();
(fetch as any).mockResolvedValue({ ok: true, json: async () => mockData });
```

**Async test timeouts**
```typescript
// Increase timeout for slow operations
it('should process large dataset', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Getting Help

1. Check test output for specific error messages
2. Review mock setup in test-helpers.ts
3. Verify external API mocking is correct
4. Ensure test data fixtures match expected format
5. Run individual test files to isolate issues

## Metrics and Reporting

The test suite generates comprehensive reports:

- **Code coverage** - Line and branch coverage statistics
- **Performance metrics** - Response time measurements
- **Test execution time** - Suite performance tracking
- **Failure analysis** - Detailed error reporting

## Future Enhancements

Planned improvements to the test suite:

1. **Load testing** - Stress testing for high-concurrency scenarios
2. **Contract testing** - API contract validation
3. **Visual regression testing** - UI component testing
4. **End-to-end testing** - Full user journey testing
5. **Accessibility testing** - WCAG compliance validation