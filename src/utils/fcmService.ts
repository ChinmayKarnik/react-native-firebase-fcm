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
 */
export function onForegroundMessage(
  callback: (message: any) => void,
) {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('📱 Foreground notification received:', remoteMessage);
    
    // Extract notification data
    const { notification, data } = remoteMessage;
    
    console.log('📋 Notification:', notification);
    console.log('📦 Data:', data);
    
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
 * Use this for:
 * - Data-only messages that need processing
 * - Updating local storage
 * - Showing custom notifications
 */
export function registerBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('🌙 Background message received:', remoteMessage);
    
    // Handle background message here
    // This runs in a separate JS context, so keep it light
    
    return Promise.resolve();
  });
}
