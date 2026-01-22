import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏠 Home Screen</Text>
      <Text style={styles.subtitle}>Deep Linking Demo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigate to:</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Product', { id: '123' })}>
          <Text style={styles.buttonText}>Product #123</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Profile', { userId: 'john' })}>
          <Text style={styles.buttonText}>Profile: john</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.storageButton]}
          onPress={() => navigation.navigate('Storage')}>
          <Text style={styles.buttonText}>☁️ Cloud Storage Demo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.performanceButton]}
          onPress={() => navigation.navigate('Performance')}>
          <Text style={styles.buttonText}>📊 Performance Monitoring</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.messagingButton]}
          onPress={() => navigation.navigate('InAppMessaging')}>
          <Text style={styles.buttonText}>💬 In-App Messaging</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>📱 Test Deep Links:</Text>
        <Text style={styles.infoText}>Use adb to test:</Text>
        <Text style={styles.code}>adb shell am start -W -a android.intent.action.VIEW -d "myapp://product/456"</Text>
        <Text style={styles.code}>adb shell am start -W -a android.intent.action.VIEW -d "myapp://profile/jane"</Text>
        <Text style={styles.code}>adb shell am start -W -a android.intent.action.VIEW -d "myapp://settings"</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  storageButton: {
    backgroundColor: '#FF6B35',
  },
  performanceButton: {
    backgroundColor: '#4CAF50',
  },
  messagingButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  info: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
});
