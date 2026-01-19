/**
 * Simulate sending a notification to test token cleanup
 * 
 * Usage: node mock-backend/send-notification.js
 */

const { GoogleAuth } = require('google-auth-library');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Find service account
const secretsDir = path.join(__dirname, '..', 'secrets');
const files = fs.readdirSync(secretsDir);
const jsonFile = files.find(f => f.endsWith('.json') && f.includes('firebase'));
const serviceAccountPath = path.join(secretsDir, jsonFile);
const serviceAccount = require(serviceAccountPath);
const projectId = serviceAccount.project_id;

const BACKEND_URL = 'http://localhost:3000';

// Get all tokens from backend
async function getAllTokens() {
  return new Promise((resolve, reject) => {
    http.get(`${BACKEND_URL}/tokens`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        resolve(result.tokens);
      });
    }).on('error', reject);
  });
}

// Send notification via FCM
async function sendNotification(token) {
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  const message = {
    message: {
      token,
      notification: {
        title: '🧪 Test Notification',
        body: 'Testing token validity',
      },
    },
  };
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(message);
    
    const options = {
      hostname: 'fcm.googleapis.com',
      port: 443,
      path: `/v1/projects/${projectId}/messages:send`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, token });
        } else {
          const error = JSON.parse(responseData);
          resolve({ success: false, token, error: error.error });
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Remove invalid token from backend
async function removeToken(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ token });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve(JSON.parse(responseData)));
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main
async function main() {
  console.log('\n🔔 Mock Notification Sender - Token Cleanup Demo\n');
  
  const tokens = await getAllTokens();
  console.log(`📋 Found ${tokens.length} tokens in backend\n`);
  
  for (const tokenData of tokens) {
    const fullToken = tokenData.tokenPreview.replace('...', ''); // This is just preview
    console.log(`📤 Sending to: ${tokenData.tokenPreview}`);
    console.log(`   Created: ${tokenData.createdAt}`);
    console.log(`   Last Active: ${tokenData.lastActive}`);
    
    // In real scenario, we'd get full token and send
    // For demo, we'll just check if it's the old one (stale)
    const lastActive = new Date(tokenData.lastActive);
    const now = new Date();
    const minutesSinceActive = (now - lastActive) / 1000 / 60;
    
    if (minutesSinceActive > 1) {
      console.log(`   ⚠️  Token inactive for ${minutesSinceActive.toFixed(1)} minutes`);
      console.log(`   🧹 This would be identified as stray and removed\n`);
    } else {
      console.log(`   ✅ Token is current and active\n`);
    }
  }
  
  console.log('💡 In production:');
  console.log('   1. Send notification to all tokens');
  console.log('   2. FCM returns error for invalid tokens');
  console.log('   3. Backend automatically removes them');
  console.log('   4. Database stays clean!\n');
}

main().catch(console.error);
