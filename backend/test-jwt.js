// Test JWT verification
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyX2YzZDAxMGJkYzM5NjQyZjlhNTUwY2E0N2NhZDgwNzllIiwiZW1haWwiOiJtaWNoYWVsd2VrZXNhQGthYmFyYWsuYWMua2UiLCJzdWJzY3JpcHRpb25UeXBlIjoiZnJlZSIsImlzU3R1ZGVudCI6MCwicHJlZmVycmVkTGFuZ3VhZ2UiOiJlbiIsImV4cCI6MTc1ODk5Nzk4MiwidHlwZSI6ImFjY2VzcyJ9.AElcq0j-oPK_MwjgnQZ1yp74J-LC1KEI5Q5o2mDP_NY";
const secret = "local-jwt-secret-key-for-development-only";

// Decode the JWT token manually
const parts = token.split('.');
const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
const signature = parts[2];

console.log('Header:', header);
console.log('Payload:', payload);
console.log('Signature:', signature);

// Check if the token is expired
const now = Math.floor(Date.now() / 1000);
console.log('Current time:', now);
console.log('Token expires at:', payload.exp);
console.log('Is expired:', now > payload.exp);

