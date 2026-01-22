import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import perf from '@react-native-firebase/perf';

const PerformanceScreen = () => {
  const [loading, setLoading] = useState(false);
  const [traceActive, setTraceActive] = useState(false);

  // Test 1: HTTP Metric (tracks network request performance)
  const testHttpMetric = async () => {
    setLoading(true);
    try {
      const metric = perf().newHttpMetric(
        'https://jsonplaceholder.typicode.com/posts',
        'GET',
      );

      await metric.start();

      // Simulate API call
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts',
      );
      const data = await response.json();

      metric.setHttpResponseCode(response.status);
      metric.setResponseContentType(response.headers.get('Content-Type') || '');
      metric.setResponsePayloadSize(JSON.stringify(data).length);

      await metric.stop();

      Alert.alert('Success', `HTTP metric tracked!\nFetched ${data.length} posts`);
    } catch (error) {
      console.error('HTTP metric error:', error);
      Alert.alert('Error', 'Failed to track HTTP metric');
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Custom Trace (tracks custom operations)
  const startCustomTrace = async () => {
    try {
      const trace = await perf().startTrace('custom_operation');
      setTraceActive(true);

      // Add custom attributes
      trace.putAttribute('user_action', 'button_press');
      trace.putMetric('items_processed', 0);

      Alert.alert('Trace Started', 'Custom trace is now running');

      // Simulate some work
      setTimeout(async () => {
        // Increment metric
        trace.incrementMetric('items_processed', 10);

        await trace.stop();
        setTraceActive(false);
        Alert.alert('Trace Stopped', 'Custom trace completed');
      }, 3000);
    } catch (error) {
      console.error('Trace error:', error);
      Alert.alert('Error', 'Failed to start trace');
    }
  };

  // Test 3: Screen Trace (tracks screen rendering)
  const testScreenTrace = async () => {
    try {
      const trace = await perf().startTrace('performance_screen_load');
      trace.putAttribute('screen_name', 'PerformanceScreen');

      // Simulate screen load work
      await new Promise(resolve => setTimeout(resolve, 1500));

      await trace.stop();
      Alert.alert('Success', 'Screen trace tracked!');
    } catch (error) {
      console.error('Screen trace error:', error);
      Alert.alert('Error', 'Failed to track screen trace');
    }
  };

  // Test 4: Enable/Disable collection
  const togglePerformanceCollection = async () => {
    try {
      const isEnabled = await perf().isPerformanceCollectionEnabled();
      await perf().setPerformanceCollectionEnabled(!isEnabled);

      Alert.alert(
        'Collection Status',
        `Performance collection is now ${!isEnabled ? 'enabled' : 'disabled'}`,
      );
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Performance Monitoring</Text>
      <Text style={styles.subtitle}>
        Track app performance metrics automatically
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatic Tracking:</Text>
        <Text style={styles.infoText}>
          ✅ App start time{'\n'}
          ✅ Screen rendering{'\n'}
          ✅ Network requests{'\n'}
          ✅ Background/Foreground transitions
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Testing:</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={testHttpMetric}
          disabled={loading}>
          <Text style={styles.buttonText}>
            📊 Test HTTP Metric
          </Text>
          {loading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, traceActive && styles.buttonActive]}
          onPress={startCustomTrace}
          disabled={traceActive}>
          <Text style={styles.buttonText}>
            {traceActive ? '⏱️ Trace Running...' : '🔍 Start Custom Trace'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={testScreenTrace}>
          <Text style={styles.buttonText}>
            📱 Test Screen Trace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.toggleButton]}
          onPress={togglePerformanceCollection}>
          <Text style={styles.buttonText}>
            ⚙️ Toggle Collection
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 How to View Metrics:</Text>
        <Text style={styles.infoText}>
          1. Open Firebase Console{'\n'}
          2. Go to Performance → Dashboard{'\n'}
          3. Wait 1-2 hours for data{'\n'}
          4. View traces, network, screens
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📈 What Gets Tracked:</Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>App Start:</Text> Time from launch to interactive{'\n'}
          <Text style={styles.bold}>HTTP Requests:</Text> URL, duration, payload size{'\n'}
          <Text style={styles.bold}>Screen Rendering:</Text> Slow/frozen frames{'\n'}
          <Text style={styles.bold}>Custom Traces:</Text> Your custom operations
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎯 Use Cases:</Text>
        <Text style={styles.infoText}>
          • Identify slow API calls{'\n'}
          • Find performance bottlenecks{'\n'}
          • Track startup time across versions{'\n'}
          • Monitor screen rendering issues{'\n'}
          • Compare performance by device/OS
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  section: {
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF9800',
  },
  toggleButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PerformanceScreen;
