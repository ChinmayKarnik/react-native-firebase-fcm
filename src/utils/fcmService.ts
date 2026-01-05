/**
 * Firebase Cloud Messaging Service
 * 
 * This file handles all FCM-related functionality:
 * - Requesting notification permissions
 * - Getting and managing FCM tokens
 * - Handling foreground, background, and quit state notifications
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request permission to show notifications
 * 
 * iOS: Shows system permission dialog
 * Android 13+: Shows permission dialog
 * Android <13: Automatically granted
 */
export async function requestUserPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ iOS notification permission granted:', authStatus);
      } else {
        console.log('❌ iOS notification permission denied');
      }

      return enabled;
    } else {
      // Android 13+ requires runtime permission
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Android notification permission granted');
          return true;
        } else {
          console.log('❌ Android notification permission denied');
          return false;
        }
      } else {
        // Android <13 automatically grants permission
        console.log('✅ Android <13: Notification permission auto-granted');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Get the FCM token for this device
 * 
 * This token uniquely identifies this device and is used to send
 * notifications to this specific device.
 * 
 * In production: Send this token to your backend server and associate
 * it with the user's account.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    
    if (token) {
      console.log('✅ FCM Token:', token);
      console.log('💡 In production, send this token to your backend server');
      
      // TODO: Send token to your backend
      // await sendTokenToBackend(token);
      
      return token;
    } else {
      console.log('❌ No FCM token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
}

/**
 * Listen for token refresh
 * 
 * FCM tokens can change when:
 * - App is restored on a new device
 * - User uninstalls/reinstalls the app
 * - User clears app data
 */
export function onTokenRefresh(callback: (token: string) => void) {
  return messaging().onTokenRefresh((token) => {
    console.log('🔄 FCM Token refreshed:', token);
    console.log('💡 Update your backend with the new token');
    
    // TODO: Send new token to your backend
    // await sendTokenToBackend(token);
    
    callback(token);
  });
}

/**
 * Handle notifications when app is in FOREGROUND
 * 
 * When the app is open and visible, you have full control over how
 * to display the notification. You can:
 * - Show a custom in-app notification
 * - Update UI directly
 * - Show a native notification manually
 * 
 * IMPORTANT: This handles BOTH notification and data messages!
 * - Notification messages: Have 'notification' field
 * - Data messages: Only have 'data' field
 */
export function onForegroundMessage(
  callback: (message: any) => void,
) {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('📱 Foreground message received:', remoteMessage);
    
    // Extract notification and data
    const { notification, data } = remoteMessage;
    
    if (notification) {
      console.log('📋 Notification payload:', notification);
    }
    
    if (data) {
      console.log('📦 Data payload:', data);
      
      // Check if this is a data-only message
      if (!notification) {
        console.log('💡 This is a DATA-ONLY message (no notification)');
        console.log('   Your app has full control over what to do with it!');
      }
    }
    
    callback(remoteMessage);
  });
}

/**
 * Handle notifications when app is in BACKGROUND or QUIT
 * 
 * This listener is called when:
 * - User taps on a notification while app is in background
 * - User taps on a notification while app is quit/killed
 * 
 * The app will open and this callback will be triggered.
 */
export function onNotificationOpenedApp(
  callback: (message: any) => void,
) {
  // Notification caused app to open from background state
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('🔔 Notification opened app from BACKGROUND state');
    console.log('📋 Message:', remoteMessage);
    
    callback(remoteMessage);
  });
  
  // Check if app was opened by a notification (from QUIT state)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('🔔 Notification opened app from QUIT state');
        console.log('📋 Message:', remoteMessage);
        
        callback(remoteMessage);
      }
    });
}

/**
 * Setup background message handler
 * 
 * This handler runs even when the app is quit/killed.
 * It must be registered outside of your application code (typically in index.js).
 * 
 * CRITICAL: This ONLY handles DATA messages!
 * - Notification messages are handled automatically by the system
 * - Data messages arrive here for custom processing
 * 
 * Use this for:
 * - Data-only messages that need processing
 * - Updating local storage
 * - Showing custom notifications using local notification API
 * 
 * WARNING: Keep this handler lightweight! It runs in a separate JS context.
 */
export function registerBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('🌙 Background message received:', remoteMessage);
    
    const { data } = remoteMessage;
    
    if (data) {
      console.log('📦 Data payload in background:', data);
      
      // Example: Process different data message types
      if (data.type === 'data_only') {
        console.log('💡 Received data-only message in background');
        console.log('   No notification was shown automatically!');
        console.log('   You could show a local notification here if needed');
      }
      
      // You could:
      // 1. Update local database
      // 2. Show local notification
      // 3. Pre-fetch data for better UX when user opens app
    }
    
    return Promise.resolve();
  });
}
