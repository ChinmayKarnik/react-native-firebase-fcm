import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Product'>;
  route: RouteProp<RootStackParamList, 'Product'>;
};

export function ProductScreen({ navigation, route }: Props) {
  const { id } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📦 Product Screen</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Product ID:</Text>
        <Text style={styles.value}>{id}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>✅ Deep Link Received!</Text>
        <Text style={styles.infoText}>
          This screen was opened via deep link with ID: {id}
        </Text>
      </View>

      <View style={styles.deepLinkInfo}>
        <Text style={styles.deepLinkTitle}>How this works:</Text>
        <Text style={styles.deepLinkText}>
          1. Deep link: myapp://product/{id}
        </Text>
        <Text style={styles.deepLinkText}>
          2. React Navigation matched route: /product/:id
        </Text>
        <Text style={styles.deepLinkText}>
          3. Extracted parameter: id = "{id}"
        </Text>
        <Text style={styles.deepLinkText}>
          4. Navigated to ProductScreen with params
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>← Back to Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('Home')}>
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          🏠 Go to Home
        </Text>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  card: {
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  info: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deepLinkInfo: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  deepLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  deepLinkText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
