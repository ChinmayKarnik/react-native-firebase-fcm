/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View, Alert, Text, TouchableOpacity } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  requestUserPermission,
  getFCMToken,
  onForegroundMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from './src/utils/fcmService';
import { notificationChannelService } from './src/services/notificationChannelService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    // Initialize FCM
    initializeFCM();

    // Setup listeners
    const unsubscribeForeground = onForegroundMessage((message) => {
      const { notification, data } = message;
      
      // Check if it's a data-only message
      if (data && !notification) {
        Alert.alert(
          '📦 Data Message Received!',
          `Type: ${data.type || 'unknown'}\nData: ${JSON.stringify(data, null, 2)}`,
          [{ text: 'OK' }]
        );
      } else {
        // Regular notification message
        Alert.alert(
          'New Notification!',
          notification?.body || 'You have a new message',
          [{ text: 'OK' }]
        );
      }
      
      setLastNotification(message);
    });

    const unsubscribeTokenRefresh = onTokenRefresh((token) => {
      setFcmToken(token);
    });

    // Setup background/quit notification handler
    onNotificationOpenedApp((message) => {
      Alert.alert(
        'Notification Opened!',
        `You opened a notification: ${message.notification?.title}`,
        [{ text: 'OK' }]
      );
      setLastNotification(message);
    });

    // Cleanup listeners
    return () => {
      unsubscribeForeground();
      unsubscribeTokenRefresh();
    };
  }, []);

  const initializeFCM = async () => {
    // Initialize notification channels FIRST (before any notifications arrive)
    await notificationChannelService.initializeChannels();

    // Request permission
    const hasPermission = await requestUserPermission();

    if (hasPermission) {
      // Get FCM token
      const token = await getFCMToken();
      setFcmToken(token);
    } else {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in settings to receive updates.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fcmInfo}>
        <Text style={styles.title}>🔔 Firebase Cloud Messaging</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>FCM Token:</Text>
          <Text style={styles.value} numberOfLines={3}>
            {fcmToken || 'Loading...'}
          </Text>
        </View>

        {lastNotification && (
          <View style={styles.section}>
            <Text style={styles.label}>Last Notification:</Text>
            <Text style={styles.value}>
              {lastNotification.notification?.title || 'No title'}
            </Text>
            <Text style={styles.subValue}>
              {lastNotification.notification?.body || 'No body'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (fcmToken) {
              Clipboard.setString(fcmToken);
              Alert.alert('✅ Copied!', 'FCM Token copied to clipboard', [
                { text: 'OK' }
              ]);
            }
          }}
        >
          <Text style={styles.buttonText}>Copy Token to Clipboard</Text>
        </TouchableOpacity>
      </View>

      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fcmInfo: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
  },
  subValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default App;
