# Firebase Cloud Messaging - Production Implementation

> **A comprehensive React Native implementation demonstrating enterprise-grade Firebase Cloud Messaging architecture and best practices.**

![React Native](https://img.shields.io/badge/React_Native-0.82.1-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-FCM_V1_API-FFCA28?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Android](https://img.shields.io/badge/Android-API_24+-3DDC84?logo=android)

## 🎯 Project Overview

This project showcases production-ready Firebase Cloud Messaging implementation patterns for React Native applications, covering advanced scenarios including multi-device token management, background message processing, notification channels, and scalable topic-based messaging.

## ✨ Key Features

### Core FCM Implementation
- **Multi-Device Token Management** - Synchronized token lifecycle across devices with automated cleanup
- **Message Type Handling** - Notification messages, data messages, and combined payloads
- **App State Processing** - Foreground, background, and quit state message handlers
- **Headless JS Workers** - Background task processing without UI dependencies

### Android Notification Channels
- **Channel Architecture** - Importance-based categorization (HIGH, DEFAULT, LOW)
- **User Control** - Granular notification preferences per category
- **Notifee Integration** - Advanced channel management and local notifications

### Scalable Messaging
- **Topic Subscriptions** - Pub/Sub pattern for efficient group messaging
- **Token Synchronization** - Multi-device support with backend coordination
- **Stray Token Cleanup** - Automated detection and removal of invalid tokens

### Backend Integration
- **FCM V1 API** - Modern API with service account authentication
- **Testing Utilities** - Node.js scripts for message delivery validation
- **Channel-Specific Delivery** - Targeted notifications with channel routing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FCM Backend Services                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ FCM V1 API  │  │ Service Auth │  │ Topic Manager│       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              React Native Application Layer                  │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Message Handlers │  │ Token Service│  │ Topic Service│  │
│  │ - Foreground     │  │ - Lifecycle  │  │ - Subscribe  │  │
│  │ - Background     │  │ - Refresh    │  │ - Manage     │  │
│  │ - Notification   │  │ - Cleanup    │  │ - Sync       │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Notification Channel Service                │  │
│  │  - Channel Creation  - Importance Levels             │  │
│  │  - User Preferences  - System Integration            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Native Layer (Android)                     │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ FCM Service  │  │ Notification  │  │ Channel Manager │  │
│  │ (Always On)  │  │ Manager       │  │                 │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Technical Implementation

### Message Processing Flow

**Notification Messages:**
```typescript
// Automatic system handling in background/quit
// Custom handling in foreground
onForegroundMessage((message) => {
  // Display custom UI or system alert
});
```

**Data Messages:**
```typescript
// Headless JS processing in all states
setBackgroundMessageHandler(async (message) => {
  // Background logic without UI
  await processDataPayload(message.data);
});
```

### Token Management Strategy

```typescript
// Registration with multi-device support
const token = await getFCMToken();
await registerTokenWithBackend(userId, token, deviceInfo);

// Automated refresh handling
onTokenRefresh(async (newToken) => {
  await updateBackendToken(newToken);
});

// Cleanup on logout
await removeTokenFromBackend(currentToken);
```

### Notification Channels

```typescript
// Channel creation at app startup
await notifee.createChannel({
  id: 'important_updates',
  name: 'Important Updates',
  importance: AndroidImportance.HIGH,
  sound: 'default',
  vibration: true
});

// Backend specifies channel
{
  android: {
    notification: { channelId: 'important_updates' }
  }
}
```

### Topic Subscriptions

```typescript
// Subscribe to topics
await messaging().subscribeToTopic('tech_news');

// Backend sends to entire topic
await sendToTopic('tech_news', {
  notification: { title, body }
});
```

## 🛠️ Tech Stack

- **Frontend:** React Native 0.82.1, TypeScript 5.8.3
- **Firebase:** @react-native-firebase/messaging 23.7.0
- **Notifications:** @notifee/react-native 9.1.8
- **Backend:** Node.js, Firebase Admin SDK, FCM V1 API
- **Authentication:** Google Service Account
- **Build:** Android SDK 36, Gradle 9.0.0

## 📦 Project Structure

```
.
├── src/
│   ├── services/
│   │   ├── fcmService.ts              # Core FCM functionality
│   │   ├── topicService.ts            # Topic management
│   │   └── notificationChannelService.ts  # Channel creation
│   ├── constants/
│   │   └── notificationChannels.ts    # Channel definitions
│   └── utils/
├── scripts/
│   ├── send-data-message.js           # Data message testing
│   ├── send-to-channel.js             # Channel-specific delivery
│   └── send-to-topic.js               # Topic-based messaging
├── mock-backend/
│   ├── server.js                      # Token management API
│   └── send-notification.js           # Cleanup demonstration
├── android/                           # Android native configuration
├── App.tsx                            # Main application
└── index.js                           # Background handler registration
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- React Native development environment configured
- Android Studio and SDK
- Firebase project with FCM enabled

### Installation

```bash
# Install dependencies
npm install

# Android setup
cd android && ./gradlew clean && cd ..

# Run on Android
npx react-native run-android
```

### Firebase Configuration

1. Create Firebase project in Firebase Console
2. Download `google-services.json` → `android/app/`
3. Generate service account JSON → `secrets/` (gitignored)
4. Enable Cloud Messaging API in Google Cloud Console

### Testing

```bash
# Start mock backend
node mock-backend/server.js

# Send test messages
node scripts/send-data-message.js YOUR_FCM_TOKEN dataOnly
node scripts/send-to-topic.js tech_news
node scripts/send-to-channel.js YOUR_TOKEN important
```

## 📖 Key Concepts Demonstrated

### Threading Model
- **JavaScript Thread:** Foreground message processing
- **Headless JS:** Background/quit state data processing
- **Native Service:** Always-on FCM listener at system level

### App State Handling
- **Foreground:** Custom UI, full React access
- **Background:** Headless JS, AsyncStorage, API calls
- **Quit:** Headless JS spawned on-demand with high priority

### Production Patterns
- ✅ Automated token refresh and synchronization
- ✅ Stray token detection via send failure
- ✅ Multi-device support with backend coordination
- ✅ Channel-based importance levels
- ✅ Topic-based scalable broadcasting
- ✅ Proper error handling and retry logic

## 🎓 Advanced Features

### Message Priority
```javascript
{
  android: {
    priority: 'high'  // Required for background data delivery
  }
}
```

### Combined Messages
```javascript
{
  notification: { title, body },  // System display
  data: { orderId, action }       // Custom payload
}
```

### Conditional Logic
```typescript
messaging().setBackgroundMessageHandler(async (message) => {
  if (message.data.type === 'urgent') {
    await createLocalNotification(message.data);
  } else {
    await saveToDatabase(message.data);
  }
});
```

## 📱 Supported Platforms

- ✅ **Android** - Full implementation (API 24+)
- ⏳ **iOS** - Planned (APNs integration coming soon)
- ⏳ **Web** - Planned (Web push notifications)

## 🔒 Security Best Practices

- Service account credentials in gitignored `secrets/` directory
- Environment-based configuration for production
- Token validation on backend before message delivery
- Proper error handling for invalid tokens

## 📊 Performance Considerations

- Idempotent channel creation (no overhead on app restart)
- Efficient topic subscriptions (FCM-managed, no backend storage)
- Background message batching for reduced battery impact
- Headless JS timeout handling for long-running tasks

## 🤝 Contributing

This is a demonstration project showcasing FCM implementation patterns. Feel free to fork and adapt for your own use cases.

## 📄 License

MIT License - Feel free to use this code in your projects.

## 🔗 Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Notifee Documentation](https://notifee.app/)
- [FCM V1 API Migration Guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

---

**Built with expertise in Firebase Cloud Messaging, React Native, and production-grade mobile architecture.**
