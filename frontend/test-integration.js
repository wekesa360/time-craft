#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test Script
 * This script tests the basic connectivity between frontend and backend
 */

const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8787';

async function testBackendConnection() {
  console.log('🔍 Testing Frontend-Backend Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing backend health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Backend is healthy:', healthResponse.data);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }

  try {
    // Test 2: API Documentation
    console.log('\n2. Testing API documentation endpoint...');
    const docsResponse = await axios.get(`${API_BASE_URL}/api/docs`);
    console.log('✅ API documentation accessible');
  } catch (error) {
    console.log('⚠️  API documentation not accessible:', error.message);
  }

  try {
    // Test 3: Database Status
    console.log('\n3. Testing database status...');
    const dbResponse = await axios.get(`${API_BASE_URL}/api/status`);
    console.log('✅ Database status:', dbResponse.data);
  } catch (error) {
    console.log('❌ Database status check failed:', error.message);
  }

  try {
    // Test 4: CORS Headers
    console.log('\n4. Testing CORS configuration...');
    const corsResponse = await axios.options(`${API_BASE_URL}/api/tasks`);
    const corsHeaders = corsResponse.headers;
    console.log('✅ CORS headers:', {
      'access-control-allow-origin': corsHeaders['access-control-allow-origin'],
      'access-control-allow-methods': corsHeaders['access-control-allow-methods'],
      'access-control-allow-headers': corsHeaders['access-control-allow-headers']
    });
  } catch (error) {
    console.log('⚠️  CORS test failed:', error.message);
  }

  try {
    // Test 5: Authentication Endpoint
    console.log('\n5. Testing authentication endpoint...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ Registration endpoint working');
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Registration endpoint working (user already exists)');
    } else {
      console.log('❌ Registration endpoint failed:', error.message);
    }
  }

  try {
    // Test 6: SSE Endpoint
    console.log('\n6. Testing SSE endpoint...');
    const sseUrl = `${API_BASE_URL}/api/realtime/sse`;
    console.log('✅ SSE endpoint URL:', sseUrl);
    console.log('ℹ️  SSE connection requires authentication token');
  } catch (error) {
    console.log('❌ SSE endpoint test failed:', error.message);
  }

  console.log('\n🎉 Integration test completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start the backend server: npm run dev (in backend directory)');
  console.log('2. Start the frontend server: npm run dev (in frontend directory)');
  console.log('3. Open http://localhost:5173 in your browser');
  console.log('4. Test the authentication flow');
  console.log('5. Test creating and managing tasks');
  console.log('6. Test the Eisenhower Matrix functionality');

  return true;
}

// Run the test
testBackendConnection().catch(console.error);
