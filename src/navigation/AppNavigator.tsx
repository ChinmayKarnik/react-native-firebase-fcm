import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking, Alert } from 'react-native';
import { RootStackParamList } from './types';
import { linking } from './linking';
import { HomeScreen } from '../screens/HomeScreen';
import { ProductScreen } from '../screens/ProductScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import StorageScreen from '../screens/StorageScreen';
import PerformanceScreen from '../screens/PerformanceScreen';
import InAppMessagingScreen from '../screens/InAppMessagingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  // Log deep link events for debugging
  useEffect(() => {
    // Get the initial URL (app opened via deep link when closed)
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('App opened with URL:', url);
        Alert.alert('Deep Link Received!', `URL: ${url}`);
      }
    });

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      Alert.alert('Deep Link Received!', `URL: ${url}`);
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer
      linking={linking}
      fallback={<></>}
      onReady={() => {
        console.log('Navigation ready');
      }}
      onStateChange={(state) => {
        console.log('Navigation state changed:', state);
      }}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Deep Linking Demo' }}
        />
        <Stack.Screen
          name="Product"
          component={ProductScreen}
          options={{ title: 'Product Details' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'User Profile' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Storage"
          component={StorageScreen}
          options={{ title: 'Cloud Storage' }}
        />
        <Stack.Screen
          name="Performance"
          component={PerformanceScreen}
          options={{ title: 'Performance Monitoring' }}
        />
        <Stack.Screen
          name="InAppMessaging"
          component={InAppMessagingScreen}
          options={{ title: 'In-App Messaging' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
