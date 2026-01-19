/**
 * Send FCM Messages to Specific Notification Channels
 * 
 * Usage: node scripts/send-to-channel.js YOUR_FCM_TOKEN [channel]
 * Channels: important, messages, promotions
 */

const { GoogleAuth } = require('google-auth-library');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Channel IDs must match App constants
const CHANNELS = {
  important: 'important_updates',
  messages: 'messages',
  promotions: 'promotions',
};

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

// Get arguments
const deviceToken = process.argv[2];
const channelArg = process.argv[3] || 'messages';

if (!deviceToken) {
  console.error('❌ Missing device token!');
  console.log('\nUsage: node scripts/send-to-channel.js YOUR_FCM_TOKEN [channel]');
  console.log('Channels: important, messages, promotions\n');
  process.exit(1);
}

const channelId = CHANNELS[channelArg];
if (!channelId) {
  console.error(`❌ Invalid channel: ${channelArg}`);
  console.log('Valid channels: important, messages, promotions');
  process.exit(1);
}

// Message templates based on channel
const getMessageForChannel = (channel) => {
  switch (channel) {
    case 'important':
      return {
        message: {
          token: deviceToken,
          notification: {
            title: '🚨 Urgent: Order Arriving Soon!',
            body: 'Your driver is 5 minutes away. Order #12345',
          },
          android: {
            notification: {
              channelId: CHANNELS.important,
              // HIGH importance channel will make sound + pop on screen
            },
          },
          data: {
            type: 'order_update',
            orderId: '12345',
            status: 'arriving',
          },
        },
      };

    case 'messages':
      return {
        message: {
          token: deviceToken,
          notification: {
            title: '💬 New Message from John',
            body: 'Hey! Are we still on for lunch tomorrow?',
          },
          android: {
            notification: {
              channelId: CHANNELS.messages,
              // DEFAULT importance channel will make sound (no pop-up)
            },
          },
          data: {
            type: 'chat_message',
            senderId: 'john_123',
            messageId: 'msg_789',
          },
        },
      };

    case 'promotions':
      return {
        message: {
          token: deviceToken,
          notification: {
            title: '🎉 Weekend Sale - 50% Off!',
            body: 'Limited time offer on all electronics. Shop now!',
          },
          android: {
            notification: {
              channelId: CHANNELS.promotions,
              // LOW importance channel = no sound, just shows in tray
            },
          },
          data: {
            type: 'promotion',
            campaignId: 'weekend_sale_2026',
            discount: '50',
          },
        },
      };

    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
};

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

async function sendMessage() {
  try {
    console.log(`\n🔔 Sending notification to channel: ${channelArg}`);
    console.log(`📱 Channel ID: ${channelId}`);
    
    const accessToken = await getAccessToken();
    const payload = getMessageForChannel(channelArg);

    console.log(`\n📤 Message preview:`);
    console.log(`   Title: ${payload.message.notification.title}`);
    console.log(`   Body: ${payload.message.notification.body}`);
    console.log(`   Channel: ${payload.message.android.notification.channelId}`);

    const options = {
      hostname: 'fcm.googleapis.com',
      path: `/v1/projects/${projectId}/messages:send`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('\n✅ Notification sent successfully!');
          console.log(`\n💡 Tip: Check your device settings for this channel:`);
          console.log(`   Settings → Apps → MyApp → Notifications → ${channelArg}`);
        } else {
          console.error('\n❌ Error sending notification:');
          console.error('Status:', res.statusCode);
          console.error('Response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
    });

    req.write(JSON.stringify(payload));
    req.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

sendMessage();
