# 🔥 Firebase Cloud Messaging - Complete Learning Summary

**Learning Project:** Firebase Playground  
**Purpose:** Master FCM for freelance React Native development  
**Last Updated:** January 2026

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Message Types](#message-types)
3. [App States & Handlers](#app-states--handlers)
4. [Threading Model](#threading-model)
5. [Token Management](#token-management)
6. [Notification Channels](#notification-channels)
7. [Topics & Segmentation](#topics--segmentation)
8. [Production Best Practices](#production-best-practices)
9. [Common Pitfalls](#common-pitfalls)
10. [Quick Reference](#quick-reference)

---

## Core Concepts

### What is FCM?

**Firebase Cloud Messaging** = Google's free service for sending push notifications and data messages to mobile devices.

**Architecture:**
```
Your Backend → FCM Servers → Device → Your App
```

**Key Components:**
- **FCM Token** - Unique device identifier for messaging
- **Message Payload** - Data/notification you send
- **Handlers** - Functions that process received messages
- **Channels** - Android 8+ categorization for notifications
- **Topics** - Pub/Sub pattern for group messaging

---

## Message Types

### 1. Notification Messages

**Purpose:** Simple alerts that Android displays automatically

**Payload:**
```javascript
{
  token: "device_fcm_token",
  notification: {
    title: "New Message",
    body: "Hello from FCM!"
  }
}
```

**Behavior:**
| App State | What Happens |
|-----------|-------------|
| **Foreground** | `onForegroundMessage` handler receives it, you control display |
| **Background** | System notification shown automatically, handler does NOT run |
| **Quit** | System notification shown automatically, handler does NOT run |
| **User Taps** | `onNotificationOpenedApp` or `getInitialNotification` runs |

**Use Cases:**
- Simple alerts (order updates, messages)
- When you want system to handle display
- Don't need background processing

---

### 2. Data Messages

**Purpose:** Custom data that gives you full control

**Payload:**
```javascript
{
  token: "device_fcm_token",
  data: {
    type: "chat_message",
    userId: "123",
    content: "Hello!"
  },
  android: {
    priority: 'high'  // ⚠️ REQUIRED for background delivery!
  }
}
```

**Behavior:**
| App State | What Happens |
|-----------|-------------|
| **Foreground** | `onForegroundMessage` handler runs on JS thread |
| **Background** | `setBackgroundMessageHandler` runs in **Headless JS** |
| **Quit** | `setBackgroundMessageHandler` runs in **Headless JS** (if priority: high) |
| **User Taps** | Only if you create a local notification yourself |

**Use Cases:**
- Background data sync
- Silent updates (cart items, user data)
- Complex processing logic
- Custom notification display

**Critical Requirement:**
```javascript
android: {
  priority: 'high'  // Without this, background/quit delivery FAILS!
}
```

---

### 3. Combined Messages

**Purpose:** System notification + custom data

**Payload:**
```javascript
{
  notification: {
    title: "Order Shipped!",
    body: "Your order #12345 is on the way"
  },
  data: {
    orderId: "12345",
    trackingUrl: "https://..."
  }
}
```

**Behavior:**
- System shows notification automatically
- Your handlers receive both `notification` and `data` objects
- Tap opens app with data available

**Use Cases:**
- Notification that opens specific screen (order details, chat)
- Alert with metadata for navigation

---

## App States & Handlers

### Three App States

#### 1. Foreground (App Open & Visible)

**State:** User actively using app  
**JavaScript:** Running ✅  
**React Components:** Loaded ✅  
**Handler:** `onForegroundMessage()`

**What You Can Do:**
- ✅ Access React state, Redux, Context
- ✅ Show Alerts, custom UI
- ✅ Navigate to screens
- ✅ API calls, database operations

**Example:**
```typescript
onForegroundMessage((message) => {
  Alert.alert(
    message.notification?.title,
    message.notification?.body
  );
  // Can access navigation, state, etc.
});
```

---

#### 2. Background (App Minimized)

**State:** App in memory but not visible  
**JavaScript:** Paused (can wake for Headless JS)  
**React Components:** Paused ❌  
**Handler for data messages:** `setBackgroundMessageHandler()`  
**Handler for taps:** `onNotificationOpenedApp()`

**What You Can Do:**
- ✅ AsyncStorage operations
- ✅ API calls
- ✅ Database updates
- ❌ React state, navigation (no UI loaded)

**Example:**
```typescript
// index.js (outside App component!)
messaging().setBackgroundMessageHandler(async (message) => {
  // Runs in Headless JS
  await AsyncStorage.setItem('lastMessage', JSON.stringify(message));
  // NO access to React components!
});
```

---

#### 3. Quit / Closed (App Not Running)

**State:** App completely terminated  
**JavaScript:** None (spawns Headless JS if needed)  
**React Components:** None ❌  
**Handler for data messages:** `setBackgroundMessageHandler()` (spawns new Headless JS)  
**Handler for taps:** `getInitialNotification()`

**What You Can Do:**
- ✅ Same as background (AsyncStorage, API calls)
- ❌ React state, navigation

**Example:**
```typescript
// When app launches from notification tap
useEffect(() => {
  messaging()
    .getInitialNotification()
    .then(message => {
      if (message) {
        // Navigate to screen based on message.data
      }
    });
}, []);
```

---

### Handler Summary Table

| Handler | When It Runs | Message Type | Thread |
|---------|--------------|--------------|--------|
| `onForegroundMessage()` | App in foreground | Any | JavaScript |
| `setBackgroundMessageHandler()` | Background/Quit + Data message | Data only | Headless JS |
| `onNotificationOpenedApp()` | User taps while background | Notification/Combined | JavaScript |
| `getInitialNotification()` | User taps while quit | Notification/Combined | JavaScript |

---

## Threading Model

### React Native Threads

**1. UI Thread (Native)**
- Renders Android/iOS UI
- Handles touch events
- Managed by Android/iOS system

**2. JavaScript Thread**
- Runs your React code
- State management, business logic
- Active in foreground, paused in background

**3. Native Modules Thread**
- Bridge between JS and Native
- Handles async operations

**4. Headless JS Thread**
- Special JavaScript runtime **without UI**
- Spawned for background tasks
- Used by `setBackgroundMessageHandler`

---

### Headless JS Deep Dive

**What is it?**
A lightweight JavaScript runtime that runs **without React components loaded**.

**When does it spawn?**
- Background data message arrives
- Quit state data message arrives (with `priority: 'high'`)
- Other background tasks (geolocation, etc.)

**What CAN you do?**
```typescript
messaging().setBackgroundMessageHandler(async (message) => {
  // ✅ Run JavaScript logic
  const data = JSON.parse(message.data.payload);
  
  // ✅ AsyncStorage operations
  await AsyncStorage.setItem('key', 'value');
  
  // ✅ API calls
  await fetch('https://api.example.com/update', { 
    method: 'POST',
    body: JSON.stringify(data) 
  });
  
  // ✅ Create local notification (using Notifee)
  await notifee.displayNotification({
    title: 'New Message',
    body: data.content
  });
});
```

**What CANNOT you do?**
```typescript
messaging().setBackgroundMessageHandler(async (message) => {
  // ❌ Access React state
  setCount(count + 1); // Error: no React!
  
  // ❌ Redux dispatch
  dispatch(updateCart()); // Error: no Redux!
  
  // ❌ Navigation
  navigation.navigate('Details'); // Error: no navigation!
  
  // ❌ React Context
  const user = useContext(UserContext); // Error: no hooks!
});
```

**Critical Rule:**
`setBackgroundMessageHandler` must be registered in **index.js**, not App.tsx!

```typescript
// ✅ CORRECT - index.js
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async (message) => {
  console.log('Background message', message);
});

AppRegistry.registerComponent(appName, () => App);

// ❌ WRONG - App.tsx
function App() {
  useEffect(() => {
    messaging().setBackgroundMessageHandler(/* ... */); // Won't work when app is quit!
  }, []);
}
```

---

### FCM Native Service

**What is it?**
A **separate Android service** that runs at the system level, independent of your app.

**Characteristics:**
- ✅ Always running (even when app is dead)
- ✅ Receives messages from FCM servers
- ✅ Decides which thread/handler to wake up
- ✅ Handles message routing

**Flow:**
```
FCM Server → FCM Native Service → Determines app state → Wakes appropriate handler
```

---

## Token Management

### What is an FCM Token?

A **unique identifier** for a specific app installation on a specific device.

**Format:** Long string like `dSxJ4DYbS7CyGCxYKLEU:APA91bF...`

**Characteristics:**
- ✅ Unique per app install
- ✅ Unique per device
- ✅ Changes on app reinstall
- ✅ Changes on app data clear
- ✅ Can rotate/refresh over time

---

### Token Lifecycle

**1. Initial Token Retrieval:**
```typescript
const token = await messaging().getToken();
// Save to your backend database
await registerTokenWithBackend(token);
```

**2. Token Refresh:**
```typescript
messaging().onTokenRefresh(async (newToken) => {
  // Token changed! Update backend
  await updateTokenOnBackend(newToken);
});
```

**When does token refresh?**
- App data cleared
- Firebase internal rotation (periodic)
- App reinstalled
- **NOT** on user login/logout

---

### Multi-Device Scenario

**Problem:** 1 user, 3 devices (phone, tablet, laptop)

**Tokens:**
- Device 1: `token_abc123...`
- Device 2: `token_def456...`
- Device 3: `token_ghi789...`

**Backend Storage:**
```javascript
// Database schema
{
  userId: "user_123",
  devices: [
    { token: "token_abc123...", platform: "android", lastActive: "2026-01-19" },
    { token: "token_def456...", platform: "ios", lastActive: "2026-01-18" },
    { token: "token_ghi789...", platform: "web", lastActive: "2026-01-15" }
  ]
}
```

**Sending to all devices:**
```javascript
user.devices.forEach(device => {
  sendNotification(device.token, message);
});
```

---

### Stray Token Problem

**What are stray tokens?**
Tokens in your database that are **no longer valid** (app uninstalled, data cleared).

**How they accumulate:**
1. User installs app → Gets `token_1` → Saved to backend
2. User clears app data → Gets `token_2` → Saved to backend
3. **`token_1` is now stray** (still in database but invalid)

**Solution: Cleanup on Send Failure**
```javascript
async function sendNotification(token, message) {
  try {
    await fcm.send({ token, ...message });
  } catch (error) {
    if (error.code === 'messaging/invalid-registration-token') {
      // Token is invalid, remove from database
      await deleteTokenFromDatabase(token);
    }
  }
}
```

**Best Practice:**
- Don't auto-delete old tokens
- Try sending, if FCM returns error, then delete
- Track `lastActive` timestamp for cleanup logic

---

### Token Management Best Practices

**1. Register on App Launch:**
```typescript
// App.tsx
useEffect(() => {
  const initFCM = async () => {
    const token = await messaging().getToken();
    await registerToken(token);
  };
  initFCM();
}, []);
```

**2. Update on User Login:**
```typescript
async function onLogin(userId) {
  const token = await messaging().getToken();
  await associateTokenWithUser(userId, token);
}
```

**3. Remove on Logout:**
```typescript
async function onLogout() {
  const token = await messaging().getToken();
  await removeTokenFromBackend(token);
}
```

**4. Handle Refresh:**
```typescript
messaging().onTokenRefresh(async (newToken) => {
  // Update backend with new token
  await updateTokenOnBackend(newToken);
});
```

---

## Notification Channels

**Android 8.0+ Requirement:** All notifications must belong to a channel.

### What are Channels?

**User-facing categories** for notifications that let users control behavior per category.

**Examples:**
- "Order Updates" (HIGH importance - sound + popup)
- "Messages" (DEFAULT importance - sound only)
- "Promotions" (LOW importance - silent)

---

### Channel Properties

**1. Channel ID** (Internal identifier)
```typescript
id: 'order_updates'
```

**2. Channel Name** (User sees this)
```typescript
name: 'Order Updates'
```

**3. Description** (Explains purpose)
```typescript
description: 'Delivery notifications and order status updates'
```

**4. Importance Level** (Controls behavior)
```typescript
AndroidImportance.HIGH      // Sound + heads-up (pops on screen)
AndroidImportance.DEFAULT   // Sound, notification tray (no popup)
AndroidImportance.LOW       // Silent, shows in tray
AndroidImportance.MIN       // Silent, minimized in tray
```

---

### Channel Immutability - CRITICAL CONCEPT

**Once created, channels CANNOT be changed programmatically!**

```typescript
// First time - creates channel
await notifee.createChannel({
  id: 'orders',
  name: 'Orders',
  importance: AndroidImportance.HIGH
});

// Later - try to change importance
await notifee.createChannel({
  id: 'orders',  // Same ID
  name: 'Orders',
  importance: AndroidImportance.LOW  // ❌ IGNORED!
});
// Channel stays HIGH importance!
```

**Why?** Users control channels after creation. Only they can change settings.

**Workaround:** Delete old channel + create new one with different ID
```typescript
await notifee.deleteChannel('orders');
await notifee.createChannel({
  id: 'orders_v2',  // New ID
  importance: AndroidImportance.LOW
});
```
⚠️ **Not recommended** - User loses custom settings!

---

### Creating Channels

**Best Practice: Create at app startup**

```typescript
// src/services/notificationChannelService.ts
import notifee, { AndroidImportance } from '@notifee/react-native';

class NotificationChannelService {
  async initializeChannels() {
    // Important updates - HIGH
    await notifee.createChannel({
      id: 'important_updates',
      name: 'Important Updates',
      description: 'Order confirmations, delivery updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true
    });

    // Messages - DEFAULT
    await notifee.createChannel({
      id: 'messages',
      name: 'Messages',
      description: 'Chat messages and communications',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: true
    });

    // Promotions - LOW
    await notifee.createChannel({
      id: 'promotions',
      name: 'Promotions & Offers',
      description: 'Marketing and promotional content',
      importance: AndroidImportance.LOW,
      sound: undefined,  // Silent
      vibration: false
    });
  }
}

// App.tsx
useEffect(() => {
  notificationChannelService.initializeChannels();
}, []);
```

---

### Specifying Channel in FCM Message

**Backend must specify channelId:**

```javascript
{
  token: "device_token",
  notification: {
    title: "Order Shipped!",
    body: "Your order is on the way"
  },
  android: {
    notification: {
      channelId: 'important_updates'  // 👈 Must match app's channel ID
    }
  }
}
```

**If not specified:**
- Android creates "Miscellaneous" default channel
- Unprofessional user experience
- Can't control behavior

---

### Channel User Control

**User disables channel:**
```
Settings → Apps → Your App → Notifications → Promotions → Toggle OFF
```

**What happens when you send:**
1. ✅ Backend sends notification
2. ✅ FCM delivers to device
3. ❌ Android blocks it (channel disabled)
4. ✅ Backend sees "success" (doesn't know about user settings)
5. ❌ User never sees notification

**Backend has NO visibility into user's channel preferences!**

---

### Channel Best Practices

**1. Create channels at startup** (every app launch is fine - idempotent)

**2. Synchronize IDs between app and backend:**
```typescript
// Shared constants
export const CHANNEL_IDS = {
  IMPORTANT: 'important_updates',
  MESSAGES: 'messages',
  PROMOTIONS: 'promotions'
};
```

**3. Get importance levels right the first time** (can't change later!)

**4. Default: Enable all channels** (users can disable if they want)

**5. Descriptive names and descriptions** (help users understand purpose)

---

## Topics & Segmentation

### What are Topics?

**Pub/Sub pattern** for sending notifications to groups without managing device tokens.

**Analogy:** Like subscribing to a YouTube channel
- Users subscribe to topics they're interested in
- Backend broadcasts to topic (like uploading a video)
- All subscribers receive it automatically

---

### How Topics Work

**App Side (Subscribe):**
```typescript
// User subscribes to topic
await messaging().subscribeToTopic('tech_news');

// User unsubscribes
await messaging().unsubscribeFromTopic('tech_news');
```

**Backend Side (Send):**
```javascript
{
  topic: 'tech_news',  // 👈 Just the topic name!
  notification: {
    title: "React 19 Released!",
    body: "Check out the new features"
  }
}
```

**FCM handles everything:**
- Maintains list of subscribers
- Delivers to all subscribed devices
- No backend database needed!

---

### Topic Lifecycle

**1. User subscribes:**
```typescript
await messaging().subscribeToTopic('courses');
```
**FCM internal state:**
```
Topic "courses" → [device_token_1, device_token_2, ...]
```

**2. Backend sends to topic:**
```javascript
sendToTopic('courses', message);
```
**FCM delivers to all tokens in that topic's subscriber list**

**3. User unsubscribes:**
```typescript
await messaging().unsubscribeFromTopic('courses');
```
**FCM removes token from topic's subscriber list**

---

### Topic Persistence

**Subscriptions persist across:**
- ✅ App restarts
- ✅ Phone restarts
- ✅ App updates

**Subscriptions lost on:**
- ❌ App reinstall (new FCM token = need to resubscribe)
- ❌ App data clear (new FCM token)

**Best Practice:** Auto-subscribe to default topics on app launch
```typescript
useEffect(() => {
  const initTopics = async () => {
    await messaging().subscribeToTopic('all_users');
    // Re-subscribes on every launch (idempotent)
  };
  initTopics();
}, []);
```

---

### Topic Naming Rules

**Valid:**
- ✅ `tech_news`
- ✅ `premium_users`
- ✅ `region-us-west`
- ✅ `category.electronics`

**Invalid:**
- ❌ `tech news` (no spaces)
- ❌ `user@123` (no special chars except - _ .)
- ❌ Very long names (keep under 50 characters)

**Case-sensitive:** `TechNews` ≠ `technews`

---

### Topic Strategies

**1. Opt-out (Default subscriptions):**
```typescript
// Critical topics everyone gets by default
await messaging().subscribeToTopic('all_users');
await messaging().subscribeToTopic('system_alerts');
```

**2. Opt-in (User choice):**
```typescript
// User selects interests
if (userInterests.includes('tech')) {
  await messaging().subscribeToTopic('tech_news');
}
if (userInterests.includes('sports')) {
  await messaging().subscribeToTopic('sports_updates');
}
```

**3. Hybrid (Best practice):**
```typescript
// Default critical topics
await topicService.subscribeToDefaultTopics();

// User-selected optional topics
await topicService.subscribeToMultipleTopics(userSelectedTopics);
```

---

### Backend Advantages

**Without Topics (Manual management):**
```javascript
// ❌ Complex: Query database, send individually
const users = await db.query("SELECT fcm_token FROM users WHERE interests = 'tech'");
for (const user of users) {
  await sendNotification(user.fcm_token, message);
}
// 10,000 users = 10,000 API calls! Rate limits, errors, scaling issues...
```

**With Topics (Firebase handles):**
```javascript
// ✅ Simple: One API call
await sendToTopic('tech_news', message);
// Reaches all subscribers, no database needed, no rate limits!
```

---

### Topic Best Practices

**1. Define topic constants:**
```typescript
export const TOPICS = {
  ALL_USERS: 'all_users',
  TECH_NEWS: 'tech_news',
  COURSES: 'courses'
} as const;
```

**2. Sync between app and backend** (share constants file)

**3. Don't create too many topics** (3-10 is usually enough)

**4. Use descriptive names** (tech_news better than topic1)

**5. Auto-subscribe to critical topics** (system announcements, security alerts)

---

## Production Best Practices

### 1. Message Priority Strategy

**High Priority (`priority: 'high'`):**
- ✅ Use for: Time-sensitive alerts (order delivery, chat messages)
- ❌ Don't abuse: Battery drain, user annoyance
- ✅ Required for: Background data messages

**Normal Priority:**
- ✅ Use for: Updates that can wait (news, promotions)
- ✅ Battery friendly

---

### 2. Error Handling

**Always handle FCM errors:**
```typescript
try {
  await messaging().getToken();
} catch (error) {
  if (error.code === 'messaging/permission-denied') {
    // User denied notification permission
    showPermissionPrompt();
  } else if (error.code === 'messaging/unknown') {
    // Network or Firebase issue
    logError(error);
  }
}
```

---

### 3. Permission Handling

**Android 13+ requires POST_NOTIFICATIONS permission:**
```typescript
async function requestPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // Auto-granted on older Android
}
```

---

### 4. Testing Checklist

**Test all scenarios:**
- ✅ Foreground notification
- ✅ Background notification
- ✅ Quit state notification
- ✅ Foreground data message
- ✅ Background data message
- ✅ Quit state data message (with priority: high)
- ✅ User taps notification (background)
- ✅ User taps notification (quit)
- ✅ Token refresh
- ✅ Multi-device (same user)
- ✅ Channel disabled
- ✅ Topic subscribe/unsubscribe

---

### 5. Backend Implementation

**Recommended stack:**
```javascript
// Use FCM Admin SDK
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
await admin.messaging().send({
  token: deviceToken,
  notification: { title, body },
  android: {
    priority: 'high',
    notification: { channelId: 'important_updates' }
  }
});
```

---

## Common Pitfalls

### ❌ Mistake 1: Background handler in App.tsx

**Wrong:**
```typescript
function App() {
  useEffect(() => {
    messaging().setBackgroundMessageHandler(async (message) => {
      // Won't work when app is quit!
    });
  }, []);
}
```

**Correct:**
```typescript
// index.js
messaging().setBackgroundMessageHandler(async (message) => {
  console.log('Background message', message);
});

AppRegistry.registerComponent(appName, () => App);
```

---

### ❌ Mistake 2: Forgetting android.priority for data messages

**Wrong:**
```javascript
{
  data: { type: 'update' }
  // No priority set
}
// Won't deliver in background/quit state!
```

**Correct:**
```javascript
{
  data: { type: 'update' },
  android: { priority: 'high' }
}
```

---

### ❌ Mistake 3: Not creating notification channels

**Result:**
- Generic "Miscellaneous" channel
- Can't control notification behavior
- Unprofessional app

**Fix:** Create channels at app launch!

---

### ❌ Mistake 4: Trying to navigate in background handler

**Wrong:**
```typescript
messaging().setBackgroundMessageHandler(async (message) => {
  navigation.navigate('Details'); // ❌ No navigation in Headless JS!
});
```

**Correct:**
```typescript
// Save to AsyncStorage, handle on app open
messaging().setBackgroundMessageHandler(async (message) => {
  await AsyncStorage.setItem('pendingNavigation', message.data.screen);
});

// In App.tsx
useEffect(() => {
  const screen = await AsyncStorage.getItem('pendingNavigation');
  if (screen) {
    navigation.navigate(screen);
    await AsyncStorage.removeItem('pendingNavigation');
  }
}, []);
```

---

### ❌ Mistake 5: Not handling token refresh

**Problem:** Token changes, backend has old token, notifications fail

**Fix:**
```typescript
messaging().onTokenRefresh(async (newToken) => {
  await updateBackendToken(newToken);
});
```

---

### ❌ Mistake 6: Not cleaning up stray tokens

**Problem:** Database full of invalid tokens

**Fix:** Delete tokens when FCM returns error:
```javascript
if (error.code === 'messaging/invalid-registration-token') {
  await deleteToken(token);
}
```

---

## Quick Reference

### Essential Code Snippets

**1. Get FCM Token:**
```typescript
const token = await messaging().getToken();
```

**2. Foreground Handler:**
```typescript
onForegroundMessage((message) => {
  Alert.alert(message.notification?.title, message.notification?.body);
});
```

**3. Background Handler (index.js):**
```typescript
messaging().setBackgroundMessageHandler(async (message) => {
  console.log('Background:', message);
});
```

**4. Notification Tap (Background):**
```typescript
onNotificationOpenedApp((message) => {
  navigation.navigate('Details', { id: message.data.id });
});
```

**5. Notification Tap (Quit):**
```typescript
const message = await messaging().getInitialNotification();
if (message) {
  navigation.navigate('Details', { id: message.data.id });
}
```

**6. Subscribe to Topic:**
```typescript
await messaging().subscribeToTopic('tech_news');
```

**7. Create Notification Channel:**
```typescript
await notifee.createChannel({
  id: 'important',
  name: 'Important Updates',
  importance: AndroidImportance.HIGH
});
```

---

### Backend Payload Templates

**Notification Message:**
```javascript
{
  token: "device_fcm_token",
  notification: {
    title: "New Message",
    body: "You have a new message"
  },
  android: {
    notification: {
      channelId: 'messages'
    }
  }
}
```

**Data Message:**
```javascript
{
  token: "device_fcm_token",
  data: {
    type: 'chat_message',
    userId: '123',
    content: 'Hello!'
  },
  android: {
    priority: 'high'  // Required!
  }
}
```

**Topic Message:**
```javascript
{
  topic: 'tech_news',
  notification: {
    title: "Breaking News",
    body: "React 19 released!"
  },
  android: {
    notification: {
      channelId: 'news'
    }
  }
}
```

---

### Debugging Commands

**1. Check device connection:**
```bash
adb devices
```

**2. View FCM logs:**
```bash
adb logcat -s ReactNativeJS:* MessagingService:*
```

**3. Test notification (curl):**
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/PROJECT_ID/messages:send \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "DEVICE_TOKEN",
      "notification": {
        "title": "Test",
        "body": "Test notification"
      }
    }
  }'
```

---

## Decision Trees

### "Which message type should I use?"

```
Need background processing?
├─ YES → Data message (priority: high)
├─ NO → Need custom notification display?
   ├─ YES → Data message
   └─ NO → Notification message (simpler)
```

### "Which handler should run?"

```
App state?
├─ Foreground → onForegroundMessage
├─ Background/Quit + Data message → setBackgroundMessageHandler
└─ User tapped notification?
   ├─ From background → onNotificationOpenedApp
   └─ From quit → getInitialNotification
```

### "Should I use topics or individual tokens?"

```
Sending to:
├─ All users → Topic: 'all_users'
├─ User groups (tech lovers, premium users) → Topics
├─ Specific user (personalized) → Individual token
└─ Multiple devices of same user → Individual tokens (loop)
```

---

## Resources

**Official Documentation:**
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [Notifee (Channels)](https://notifee.app/)

**This Project:**
- Branch: `firebase-fcm-learning`
- Scripts: `/scripts/send-*.js`
- Services: `/src/services/`

---

## Next Steps

**You've mastered FCM fundamentals! 🎉**

**Advanced topics to explore:**
- [ ] Deep linking (navigate to specific screens)
- [ ] FCM Analytics (track delivery, opens, conversions)
- [ ] A/B testing notifications
- [ ] Rich notifications (images, actions)
- [ ] iOS implementation (APNs integration)
- [ ] Web push notifications

**For freelance work, you now know:**
✅ How to implement FCM from scratch  
✅ Message types and when to use each  
✅ Token management at scale  
✅ Android notification channels  
✅ Topics for efficient group messaging  
✅ Common pitfalls and how to avoid them  

**Good luck with your Upwork projects! 🚀**

---

*Last updated: January 2026*  
*Project: Firebase Playground*  
*Author: Learning notes for FCM mastery*
