/**
 * Send FCM Data Messages using V1 API
 * 
 * Usage: node scripts/send-data-message.js YOUR_FCM_TOKEN [messageType]
 * Message types: dataOnly, notification, combined
 */

const { GoogleAuth } = require('google-auth-library');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Find service account file
const secretsDir = path.join(__dirname, '..', 'secrets');
let serviceAccountPath = null;

if (fs.existsSync(secretsDir)) {
  const files = fs.readdirSync(secretsDir);
  const jsonFile = files.find(f => f.endsWith('.json'));
  if (jsonFile) {
    serviceAccountPath = path.join(secretsDir, jsonFile);
  }
}

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account JSON not found in secrets/ folder!');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const projectId = serviceAccount.project_id;

// Get token from command line
const deviceToken = process.argv[2];
const messageType = process.argv[3] || 'dataOnly';

if (!deviceToken) {
  console.error('❌ Missing device token!');
  console.log('\nUsage: node scripts/send-data-message.js YOUR_FCM_TOKEN [messageType]');
  console.log('Message types: dataOnly, notification, combined\n');
  process.exit(1);
}

// Message templates
const messages = {
  dataOnly: {
    message: {
      token: deviceToken,
      android: {
        priority: 'high',
      },
      data: {
        type: 'data_only',
        userId: '12345',
        title: 'Data Message',
        body: 'This is a pure data message - no auto notification!',
        timestamp: Date.now().toString(),
      },
    },
  },
  
  notification: {
    message: {
      token: deviceToken,
      notification: {
        title: '📱 V1 API Notification',
        body: 'This is a notification message from V1 API!',
      },
    },
  },
  
  combined: {
    message: {
      token: deviceToken,
      notification: {
        title: '📦 Combined Message',
        body: 'This has both notification and data payload',
      },
      data: {
        type: 'combined',
        userId: '12345',
        customField: 'Custom value',
        timestamp: Date.now().toString(),
      },
    },
  },
};

const message = messages[messageType];

if (!message) {
  console.error(`❌ Unknown message type: ${messageType}`);
  console.log('Available types:', Object.keys(messages).join(', '));
  process.exit(1);
}

console.log(`\n📤 Sending ${messageType} message...`);
console.log('Message:', JSON.stringify(message, null, 2));
console.log('\n🔑 Using service account:', serviceAccount.client_email);
console.log('📱 Target token:', deviceToken.substring(0, 20) + '...\n');

// Send using Google Auth Library
async function sendMessage() {
  try {
    console.log('⏳ Getting access token...\n');
    
    const auth = new GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    console.log('✅ Access token obtained');
    console.log('⏳ Sending message...\n');
    
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
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('📥 Response status:', res.statusCode);
        
        if (res.statusCode === 200) {
          const response = JSON.parse(responseData);
          console.log('✅ Message sent successfully!');
          console.log('📋 Message name:', response.name);
          console.log('\n💡 Check your app now!');
          
          if (messageType === 'dataOnly') {
            console.log('\n🎯 DATA-ONLY MESSAGE BEHAVIOR:');
            console.log('   ✅ Foreground: Alert should appear with data payload');
            console.log('   ✅ Background: Check Metro logs - NO system notification!');
            console.log('   ✅ Quit: App wakes up (headless), check Metro logs');
          } else if (messageType === 'notification') {
            console.log('\n🎯 NOTIFICATION MESSAGE BEHAVIOR:');
            console.log('   ✅ Foreground: Alert appears');
            console.log('   ✅ Background: System notification shows');
            console.log('   ✅ Quit: System notification shows');
          } else {
            console.log('\n🎯 COMBINED MESSAGE BEHAVIOR:');
            console.log('   ✅ Foreground: Alert with both notification + data');
            console.log('   ✅ Background: System notification + data in tap handler');
            console.log('   ✅ Quit: System notification + data when opened');
          }
        } else {
          console.log('❌ Failed to send message');
          console.log('Response:', responseData);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
    });
    
    req.write(data);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendMessage();
