// Test JWT verification with hono/jwt
import { verify } from 'hono/jwt';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyX2YzZDAxMGJkYzM5NjQyZjlhNTUwY2E0N2NhZDgwNzllIiwiZW1haWwiOiJtaWNoYWVsd2VrZXNhQGthYmFyYWsuYWMua2UiLCJzdWJzY3JpcHRpb25UeXBlIjoiZnJlZSIsImlzU3R1ZGVudCI6MCwicHJlZmVycmVkTGFuZ3VhZ2UiOiJlbiIsImV4cCI6MTc1ODk5Nzk4MiwidHlwZSI6ImFjY2VzcyJ9.AElcq0j-oPK_MwjgnQZ1yp74J-LC1KEI5Q5o2mDP_NY";
const secret = "local-jwt-secret-key-for-development-only";

async function testJWT() {
  try {
    console.log('Testing JWT verification...');
    console.log('Secret:', secret);
    console.log('Token:', token.substring(0, 50) + '...');
    
    const payload = await verify(token, secret);
    console.log('JWT verification successful!');
    console.log('Payload:', payload);
  } catch (error) {
    console.log('JWT verification failed:', error.message);
    console.log('Error:', error);
  }
}

testJWT();
