/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useEffect, useState } from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View, Alert, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
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
import { topicService, TOPICS } from './src/services/topicService';
import { remoteConfigService } from './src/services/remoteConfigService';
import { analyticsService } from './src/services/analyticsService';
import authService from './src/services/authService';
import crashlyticsService from './src/services/crashlyticsService';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

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
  
  // Auth state
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribeAuth = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (authUser) {
        console.log('User signed in:', authUser.email);
        analyticsService.setUserId(authUser.uid);
        analyticsService.setUserProperty('email_verified', authUser.emailVerified.toString());
        
        // Set Crashlytics user ID
        crashlyticsService.setUserId(authUser.uid);
        crashlyticsService.setAttribute('user_email', authUser.email || 'unknown');
      } else {
        console.log('User signed out');
        analyticsService.setUserId(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

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

    // Initialize Remote Config
    await remoteConfigService.initialize();
    await remoteConfigService.fetchAndActivate();

    // Initialize Analytics
    await analyticsService.logAppOpen();
    await analyticsService.logScreenView('HomeScreen');

    // Initialize Crashlytics
    crashlyticsService.log('App initialized successfully');
    crashlyticsService.setAttribute('app_version', '1.0.0');
    crashlyticsService.setAttribute('environment', __DEV__ ? 'development' : 'production');

    // Request permission
    const hasPermission = await requestUserPermission();

    if (hasPermission) {
      // Get FCM token
      const token = await getFCMToken();
      setFcmToken(token);

      // Subscribe to default topics
      // This happens AFTER permission granted
      // Why? No point subscribing if user denied notifications
      await topicService.subscribeToDefaultTopics();
      
      console.log('✅ FCM initialization complete');
    } else {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in settings to receive updates.'
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Authentication Section */}
      <View style={styles.authSection}>
        <Text style={styles.title}>🔐 Firebase Authentication</Text>
        
        {user ? (
          // Signed In View
          <View>
            <View style={styles.section}>
              <Text style={styles.label}>Signed in as:</Text>
              <Text style={styles.value}>{user.email}</Text>
              <Text style={styles.subValue}>UID: {user.uid}</Text>
              <Text style={styles.subValue}>
                Email Verified: {user.emailVerified ? '✅ Yes' : '❌ No'}
              </Text>
            </View>

            {!user.emailVerified && (
              <TouchableOpacity
                style={[styles.button, styles.verifyButton]}
                onPress={async () => {
                  try {
                    await authService.sendEmailVerification();
                    Alert.alert('✉️ Email Sent', 'Check your inbox for verification link');
                  } catch (error: any) {
                    Alert.alert('Error', error.message);
                  }
                }}
              >
                <Text style={styles.buttonText}>Send Verification Email</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.signOutButton]}
              onPress={async () => {
                try {
                  await authService.signOut();
                  setEmail('');
                  setPassword('');
                  Alert.alert('✅ Signed Out', 'You have been signed out successfully');
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
              }}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Sign In/Sign Up View
          <View>
            <Text style={styles.authModeLabel}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.button, styles.authButton]}
              onPress={async () => {
                if (!email || !password) {
                  Alert.alert('Error', 'Please enter email and password');
                  return;
                }

                try {
                  if (isSignUp) {
                    await authService.signUp(email, password);
                    Alert.alert('✅ Account Created', 'Please verify your email');
                    await authService.sendEmailVerification();
                  } else {
                    await authService.signIn(email, password);
                    Alert.alert('✅ Welcome Back', 'Signed in successfully');
                  }
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
              }}
            >
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.switchButton]}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.buttonText}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={async () => {
                  if (!email) {
                    Alert.alert('Error', 'Please enter your email first');
                    return;
                  }

                  try {
                    await authService.sendPasswordResetEmail(email);
                    Alert.alert('✉️ Email Sent', 'Check your inbox for password reset link');
                  } catch (error: any) {
                    Alert.alert('Error', error.message);
                  }
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

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
              analyticsService.logButtonClick('copy_token', 'HomeScreen');
              Alert.alert('✅ Copied!', 'FCM Token copied to clipboard', [
                { text: 'OK' }
              ]);
            }
          }}
        >
          <Text style={styles.buttonText}>Copy Token to Clipboard</Text>
        </TouchableOpacity>

        {/* Topic Management Buttons */}
        <View style={styles.topicSection}>
          <Text style={styles.label}>Topic Subscriptions:</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.topicButton]}
            onPress={async () => {
              await topicService.subscribeToTopic(TOPICS.TECH_NEWS);
              Alert.alert('✅ Subscribed', 'You will now receive Tech News updates');
            }}
          >
            <Text style={styles.buttonText}>Subscribe to Tech News</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.topicButton]}
            onPress={async () => {
              await topicService.unsubscribeFromTopic(TOPICS.TECH_NEWS);
              Alert.alert('📭 Unsubscribed', 'You will no longer receive Tech News');
            }}
          >
            <Text style={styles.buttonText}>Unsubscribe from Tech News</Text>
          </TouchableOpacity>
        </View>

        {/* Remote Config Section */}
        <View style={styles.topicSection}>
          <Text style={styles.label}>Remote Config:</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.configButton]}
            onPress={async () => {
              const welcomeMsg = remoteConfigService.getString('welcome_message');
              const darkMode = remoteConfigService.getBoolean('enable_dark_mode');
              const timeout = remoteConfigService.getNumber('api_timeout_seconds');
              const checkoutText = remoteConfigService.getString('checkout_button_text');
              
              Alert.alert(
                'Current Config',
                `Welcome: ${welcomeMsg}\nDark Mode: ${darkMode}\nAPI Timeout: ${timeout}s\n\nA/B Test:\nCheckout Button: "${checkoutText}"`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.buttonText}>Show Current Config</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.configButton]}
            onPress={async () => {
              try {
                const config = remoteConfigService.getAppConfiguration();
                const enabled = remoteConfigService.isFeatureEnabled('enableNewUI');
                const variant = remoteConfigService.getABTestVariant('checkoutButtonText');
                
                Alert.alert(
                  'Advanced Config',
                  `New UI Enabled: ${enabled}\nCheckout Variant: "${variant}"\nMaintenance: ${config.maintenanceMode}\nAPI: ${config.api.baseURL}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to parse config: ' + error);
              }
            }}
          >
            <Text style={styles.buttonText}>Show Advanced Config</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.configButton]}
            onPress={async () => {
              analyticsService.logButtonClick('fetch_config', 'HomeScreen');
              const activated = await remoteConfigService.fetchAndActivate();
              analyticsService.logRemoteConfigFetch(activated);
              Alert.alert(
                activated ? '✅ Config Updated' : 'ℹ️ No Changes',
                activated 
                  ? 'New configuration activated!' 
                  : 'Already using latest config',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.buttonText}>Fetch Latest Config</Text>
          </TouchableOpacity>
        </View>

        {/* Crashlytics Section */}
        <View style={styles.topicSection}>
          <Text style={styles.label}>🔥 Crashlytics - Crash Testing:</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.crashButton]}
            onPress={() => {
              crashlyticsService.testJavaScriptError();
              Alert.alert('✅ Error Logged', 'Non-fatal error sent to Crashlytics. Check Firebase Console in a few minutes.');
            }}
          >
            <Text style={styles.buttonText}>Test Non-Fatal Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.crashButton]}
            onPress={() => {
              crashlyticsService.testNullPointerError();
              Alert.alert('✅ Error Logged', 'Null pointer error logged to Crashlytics');
            }}
          >
            <Text style={styles.buttonText}>Test Null Pointer Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.crashButton]}
            onPress={() => {
              crashlyticsService.testArrayIndexError();
              Alert.alert('✅ Error Logged', 'Array index error logged to Crashlytics');
            }}
          >
            <Text style={styles.buttonText}>Test Array Error</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.crashDangerButton]}
            onPress={() => {
              Alert.alert(
                '⚠️ Warning',
                'This will crash the app! Crash report will appear in Firebase Console after restart.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Crash App', 
                    style: 'destructive',
                    onPress: () => {
                      crashlyticsService.log('User triggered test crash');
                      crashlyticsService.setAttribute('crash_type', 'intentional_test');
                      // Use native crash (more reliable than JS throw)
                      crashlyticsService.crash();
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>⚠️ FORCE CRASH (Test)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.crashDangerButton]}
            onPress={() => {
              Alert.alert(
                '⚠️ Warning',
                'This will throw uncaught JavaScript error and crash the app!',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Crash App', 
                    style: 'destructive',
                    onPress: () => {
                      crashlyticsService.testJavaScriptCrash();
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.buttonText}>⚠️ JS Crash (Test)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authSection: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  authModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#333',
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
  authButton: {
    backgroundColor: '#4CAF50',
  },
  switchButton: {
    backgroundColor: '#666',
  },
  signOutButton: {
    backgroundColor: '#F44336',
  },
  verifyButton: {
    backgroundColor: '#FF9800',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  topicSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  topicButton: {
    backgroundColor: '#34C759',
  },
  configButton: {
    backgroundColor: '#FF9500',
  },
  crashButton: {
    backgroundColor: '#9C27B0',
  },
  crashDangerButton: {
    backgroundColor: '#D32F2F',
  },
});

export default App;
