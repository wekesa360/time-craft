#!/usr/bin/env node

/**
 * Frontend-Backend Integration Verification Script
 * This script verifies that the frontend API client properly integrates with the backend
 */

const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8787';

// Test configuration
const TEST_USER = {
  email: 'integration-test@example.com',
  password: 'TestPassword123!',
  firstName: 'Integration',
  lastName: 'Test',
  timezone: 'UTC',
  preferredLanguage: 'en'
};

let accessToken = '';
let refreshToken = '';

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  // Test registration
  const registerResult = await makeRequest('POST', '/auth/register', TEST_USER);
  if (registerResult.success) {
    console.log('✅ Registration successful');
    accessToken = registerResult.data.tokens.accessToken;
    refreshToken = registerResult.data.tokens.refreshToken;
  } else if (registerResult.status === 409) {
    console.log('ℹ️  User already exists, testing login...');
    
    // Test login
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResult.success) {
      console.log('✅ Login successful');
      accessToken = loginResult.data.tokens.accessToken;
      refreshToken = loginResult.data.tokens.refreshToken;
    } else {
      console.log('❌ Login failed:', loginResult.error);
      return false;
    }
  } else {
    console.log('❌ Registration failed:', registerResult.error);
    return false;
  }

  // Test token validation
  const validateResult = await makeRequest('GET', '/auth/validate');
  if (validateResult.success) {
    console.log('✅ Token validation successful');
  } else {
    console.log('❌ Token validation failed:', validateResult.error);
    return false;
  }

  return true;
}

async function testTaskManagement() {
  console.log('\n📝 Testing Task Management...');
  
  // Test task creation with Eisenhower Matrix fields
  const taskData = {
    title: 'Integration Test Task',
    description: 'This is a test task for integration verification',
    priority: 3,
    urgency: 3,
    importance: 4,
    matrixNotes: 'Test matrix notes',
    isDelegated: false,
    contextType: 'work',
    estimatedDuration: 30
  };

  const createResult = await makeRequest('POST', '/api/tasks', taskData);
  if (!createResult.success) {
    console.log('❌ Task creation failed:', createResult.error);
    return false;
  }
  
  console.log('✅ Task created successfully');
  const taskId = createResult.data.task.id;

  // Test getting tasks
  const getTasksResult = await makeRequest('GET', '/api/tasks');
  if (!getTasksResult.success) {
    console.log('❌ Get tasks failed:', getTasksResult.error);
    return false;
  }
  console.log('✅ Get tasks successful');

  // Test getting specific task
  const getTaskResult = await makeRequest('GET', `/api/tasks/${taskId}`);
  if (!getTaskResult.success) {
    console.log('❌ Get specific task failed:', getTaskResult.error);
    return false;
  }
  console.log('✅ Get specific task successful');

  // Test updating task
  const updateData = {
    title: 'Updated Integration Test Task',
    priority: 4
  };
  const updateResult = await makeRequest('PUT', `/api/tasks/${taskId}`, updateData);
  if (!updateResult.success) {
    console.log('❌ Task update failed:', updateResult.error);
    return false;
  }
  console.log('✅ Task update successful');

  // Test Eisenhower Matrix
  const matrixResult = await makeRequest('GET', '/api/tasks/matrix');
  if (!matrixResult.success) {
    console.log('❌ Get Eisenhower Matrix failed:', matrixResult.error);
    return false;
  }
  console.log('✅ Get Eisenhower Matrix successful');

  // Test task completion
  const completeResult = await makeRequest('PATCH', `/api/tasks/${taskId}/complete`);
  if (!completeResult.success) {
    console.log('❌ Task completion failed:', completeResult.error);
    return false;
  }
  console.log('✅ Task completion successful');

  // Test task deletion
  const deleteResult = await makeRequest('DELETE', `/api/tasks/${taskId}`);
  if (!deleteResult.success) {
    console.log('❌ Task deletion failed:', deleteResult.error);
    return false;
  }
  console.log('✅ Task deletion successful');

  return true;
}

async function testHealthTracking() {
  console.log('\n💪 Testing Health Tracking...');
  
  // Test exercise logging
  const exerciseData = {
    activity: 'Running',
    durationMinutes: 30,
    intensity: 7,
    caloriesBurned: 300,
    distance: 5.2,
    notes: 'Integration test run'
  };

  const exerciseResult = await makeRequest('POST', '/api/health/exercise', exerciseData);
  if (!exerciseResult.success) {
    console.log('❌ Exercise logging failed:', exerciseResult.error);
    return false;
  }
  console.log('✅ Exercise logging successful');

  // Test mood logging
  const moodData = {
    score: 8,
    energy: 7,
    stress: 3,
    sleep: 8,
    notes: 'Feeling great after the run!',
    tags: ['productive', 'happy']
  };

  const moodResult = await makeRequest('POST', '/api/health/mood', moodData);
  if (!moodResult.success) {
    console.log('❌ Mood logging failed:', moodResult.error);
    return false;
  }
  console.log('✅ Mood logging successful');

  // Test health summary
  const summaryResult = await makeRequest('GET', '/api/health/summary');
  if (!summaryResult.success) {
    console.log('❌ Get health summary failed:', summaryResult.error);
    return false;
  }
  console.log('✅ Get health summary successful');

  return true;
}

async function testFocusSessions() {
  console.log('\n🎯 Testing Focus Sessions...');
  
  // Test getting templates
  const templatesResult = await makeRequest('GET', '/api/focus/templates');
  if (!templatesResult.success) {
    console.log('❌ Get focus templates failed:', templatesResult.error);
    return false;
  }
  console.log('✅ Get focus templates successful');

  // Test starting focus session
  const sessionData = {
    templateKey: 'pomodoro_25',
    taskId: null,
    environmentId: null
  };

  const startResult = await makeRequest('POST', '/api/focus/sessions', sessionData);
  if (!startResult.success) {
    console.log('❌ Start focus session failed:', startResult.error);
    return false;
  }
  console.log('✅ Start focus session successful');
  const sessionId = startResult.data.session.id;

  // Test completing focus session
  const completeData = {
    actualEndTime: Date.now(),
    productivityRating: 8,
    notes: 'Great focus session!'
  };

  const completeResult = await makeRequest('PATCH', `/api/focus/sessions/${sessionId}/complete`, completeData);
  if (!completeResult.success) {
    console.log('❌ Complete focus session failed:', completeResult.error);
    return false;
  }
  console.log('✅ Complete focus session successful');

  return true;
}

async function testRealTimeFeatures() {
  console.log('\n⚡ Testing Real-time Features...');
  
  // Test SSE endpoint availability
  const sseResult = await makeRequest('GET', '/api/realtime/sse');
  if (sseResult.status === 200 || sseResult.status === 401) {
    console.log('✅ SSE endpoint accessible');
  } else {
    console.log('❌ SSE endpoint not accessible:', sseResult.error);
    return false;
  }

  // Test SSE stats
  const statsResult = await makeRequest('GET', '/api/realtime/sse/stats');
  if (!statsResult.success) {
    console.log('❌ Get SSE stats failed:', statsResult.error);
    return false;
  }
  console.log('✅ Get SSE stats successful');

  return true;
}

async function testSocialFeatures() {
  console.log('\n👥 Testing Social Features...');
  
  // Test getting connections
  const connectionsResult = await makeRequest('GET', '/api/social/connections');
  if (!connectionsResult.success) {
    console.log('❌ Get connections failed:', connectionsResult.error);
    return false;
  }
  console.log('✅ Get connections successful');

  // Test getting challenges
  const challengesResult = await makeRequest('GET', '/api/social/challenges');
  if (!challengesResult.success) {
    console.log('❌ Get challenges failed:', challengesResult.error);
    return false;
  }
  console.log('✅ Get challenges successful');

  return true;
}

async function testAdminFeatures() {
  console.log('\n🔧 Testing Admin Features...');
  
  // Test admin dashboard (may fail if user is not admin)
  const dashboardResult = await makeRequest('GET', '/api/admin/dashboard');
  if (dashboardResult.success) {
    console.log('✅ Admin dashboard accessible');
  } else if (dashboardResult.status === 403) {
    console.log('ℹ️  Admin dashboard requires admin privileges (expected)');
  } else {
    console.log('❌ Admin dashboard test failed:', dashboardResult.error);
    return false;
  }

  return true;
}

async function testVoiceFeatures() {
  console.log('\n🎤 Testing Voice Features...');
  
  // Test getting voice notes
  const voiceNotesResult = await makeRequest('GET', '/api/voice/notes');
  if (!voiceNotesResult.success) {
    console.log('❌ Get voice notes failed:', voiceNotesResult.error);
    return false;
  }
  console.log('✅ Get voice notes successful');

  // Test getting voice settings
  const settingsResult = await makeRequest('GET', '/api/voice/settings');
  if (!settingsResult.success) {
    console.log('❌ Get voice settings failed:', settingsResult.error);
    return false;
  }
  console.log('✅ Get voice settings successful');

  return true;
}

async function runIntegrationTests() {
  console.log('🚀 Starting Frontend-Backend Integration Verification...\n');
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Task Management', fn: testTaskManagement },
    { name: 'Health Tracking', fn: testHealthTracking },
    { name: 'Focus Sessions', fn: testFocusSessions },
    { name: 'Real-time Features', fn: testRealTimeFeatures },
    { name: 'Social Features', fn: testSocialFeatures },
    { name: 'Admin Features', fn: testAdminFeatures },
    { name: 'Voice Features', fn: testVoiceFeatures }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test crashed:`, error.message);
      failed++;
    }
  }

  console.log('\n📊 Integration Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! Frontend is properly integrated with backend.');
  } else {
    console.log('\n⚠️  Some integration tests failed. Please check the errors above.');
  }

  return failed === 0;
}

// Run the tests
runIntegrationTests().catch(console.error);
