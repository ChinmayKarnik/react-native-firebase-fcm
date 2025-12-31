/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler - MUST be done outside of App component
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('🌙 Background message received:', remoteMessage);
  // Handle your background message here
});

AppRegistry.registerComponent(appName, () => App);
