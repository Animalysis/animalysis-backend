// Simple script to test the webhook endpoint manually
// Run with: node scripts/test-webhook.js

const https = require('https');

const webhookUrl = 'http://localhost:3000/api/webhooks/clerk';

const testUserData = {
  type: 'user.created',
  data: {
    id: 'test_clerk_user_id_123',
    first_name: 'Test',
    last_name: 'User',
    email_addresses: [
      {
        email_address: 'test@example.com'
      }
    ]
  }
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/clerk',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'svix-signature': 'test-signature-for-development'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(JSON.stringify(testUserData));
req.end();

console.log('Sending test webhook to:', webhookUrl);