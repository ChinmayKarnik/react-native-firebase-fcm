/**
 * Send FCM Messages to Topics
 * 
 * Topics = Send ONE message to MANY devices
 * 
 * Usage: node scripts/send-to-topic.js TOPIC_NAME
 * Topics: courses, tech_news, quiz_of_the_day, all_users
 */

const { GoogleAuth } = require('google-auth-library');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Topic names must match app constants
const TOPICS = {
  courses: 'courses',
  tech_news: 'tech_news',
  quiz_of_the_day: 'quiz_of_the_day',
  all_users: 'all_users',
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

// Get topic from command line
const topicArg = process.argv[2];

if (!topicArg) {
  console.error('❌ Missing topic name!');
  console.log('\nUsage: node scripts/send-to-topic.js TOPIC_NAME');
  console.log('Available topics: courses, tech_news, quiz_of_the_day, all_users\n');
  process.exit(1);
}

const topic = TOPICS[topicArg];
if (!topic) {
  console.error(`❌ Invalid topic: ${topicArg}`);
  console.log('Available topics:', Object.keys(TOPICS).join(', '));
  process.exit(1);
}

// Message templates based on topic
const getMessageForTopic = (topicName) => {
  const messages = {
    courses: {
      message: {
        topic: topicName,
        notification: {
          title: '📚 New Course Available!',
          body: 'Advanced React Native - Build Production Apps. Enroll now!',
        },
        android: {
          notification: {
            channelId: 'important_updates',
          },
        },
        data: {
          type: 'course_announcement',
          courseId: 'react-native-advanced',
          category: 'mobile_development',
        },
      },
    },

    tech_news: {
      message: {
        topic: topicName,
        notification: {
          title: '🚀 Tech News: React 19 Released!',
          body: 'Major performance improvements and new features. Read more.',
        },
        android: {
          notification: {
            channelId: 'messages',  // DEFAULT importance
          },
        },
        data: {
          type: 'tech_news',
          articleId: 'react-19-release',
          category: 'frameworks',
        },
      },
    },

    quiz_of_the_day: {
      message: {
        topic: topicName,
        notification: {
          title: '🧠 Daily Quiz: JavaScript',
          body: 'What is the output of: typeof null? Test your knowledge!',
        },
        android: {
          notification: {
            channelId: 'messages',
          },
        },
        data: {
          type: 'daily_quiz',
          quizId: 'js-quiz-123',
          difficulty: 'medium',
        },
      },
    },

    all_users: {
      message: {
        topic: topicName,
        notification: {
          title: '📢 Important Announcement',
          body: 'Scheduled maintenance tonight 11 PM - 2 AM. App may be unavailable.',
        },
        android: {
          notification: {
            channelId: 'important_updates',  // HIGH importance
          },
        },
        data: {
          type: 'system_announcement',
          priority: 'high',
          category: 'maintenance',
        },
      },
    },
  };

  return messages[topicArg];
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
    console.log(`\n📤 Sending notification to topic: ${topic}`);
    console.log(`📊 This will reach ALL devices subscribed to "${topic}"`);
    
    const accessToken = await getAccessToken();
    const payload = getMessageForTopic(topic);

    if (!payload) {
      console.error(`❌ No message template for topic: ${topicArg}`);
      process.exit(1);
    }

    console.log(`\n📝 Message preview:`);
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
          console.log('\n✅ Topic notification sent successfully!');
          console.log(`\n💡 All subscribers to "${topic}" will receive this notification`);
          console.log(`   (Delivery depends on user's device state and channel settings)`);
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
