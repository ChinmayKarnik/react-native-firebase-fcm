/**
 * Script to send data-only FCM messages for testing
 * 
 * Usage:
 * 1. Get your Server Key from Firebase Console:
 *    Project Settings > Cloud Messaging > Server key
 * 2. Get your device FCM token from the app
 * 3. Run: node scripts/send-data-notification.js YOUR_SERVER_KEY YOUR_DEVICE_TOKEN
 */

const https = require('https');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Missing arguments!');
  console.log('\nUsage:');
  console.log('  node scripts/send-data-notification.js SERVER_KEY DEVICE_TOKEN');
  console.log('\nGet Server Key from:');
  console.log('  Firebase Console > Project Settings > Cloud Messaging > Server key');
  process.exit(1);
}

const [serverKey, deviceToken] = args;

// Different types of messages to test
const messageTypes = {
  // 1. Pure data message (no auto-notification)
  dataOnly: {
    to: deviceToken,
    data: {
      type: 'data_only',
      userId: '12345',
      message: 'This is a silent data message',
      timestamp: Date.now().toString(),
    },
  },

  // 2. Notification + data (combined)
  combined: {
    to: deviceToken,
    notification: {
      title: 'Combined Message',
      body: 'This has both notification and data',
    },
    data: {
      type: 'combined',
      userId: '12345',
      customField: 'Custom value',
    },
  },

  // 3. High priority data (better delivery in doze mode)
  highPriority: {
    to: deviceToken,
    priority: 'high',
    data: {
      type: 'high_priority',
      action: 'sync_data',
      urgent: 'true',
    },
  },
};

function sendFCM(messageType) {
  const message = messageTypes[messageType];

  if (!message) {
    console.error(`❌ Unknown message type: ${messageType}`);
    console.log('Available types:', Object.keys(messageTypes).join(', '));
    process.exit(1);
  }

  const data = JSON.stringify(message);

  const options = {
    hostname: 'fcm.googleapis.com',
    port: 443,
    path: '/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${serverKey}`,
      'Content-Length': data.length,
    },
  };

  console.log(`\n📤 Sending ${messageType} message...`);
  console.log('Message:', JSON.stringify(message, null, 2));

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\n📥 Response:');
      console.log(JSON.parse(responseData));

      if (res.statusCode === 200) {
        console.log('\n✅ Message sent successfully!');
        console.log('\n💡 Check your app and Metro logs to see how it was handled.');
      } else {
        console.log('\n❌ Failed to send message');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error);
  });

  req.write(data);
  req.end();
}

// Interactive menu
console.log('\n🔔 FCM Data Message Tester\n');
console.log('Choose message type to send:');
console.log('1. dataOnly     - Pure data message (no notification)');
console.log('2. combined     - Notification + data payload');
console.log('3. highPriority - High priority data message');
console.log('\nOr pass type as 3rd argument\n');

const messageType = args[2] || 'dataOnly';
sendFCM(messageType);
