import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import analytics from '@react-native-firebase/analytics';

const InAppMessagingScreen = () => {
  const [suppressed, setSuppressed] = useState(false);

  const toggleSuppression = async () => {
    const newState = !suppressed;
    await inAppMessaging().setMessagesDisplaySuppressed(newState);
    setSuppressed(newState);
    Alert.alert(
      'Messages ' + (newState ? 'Suppressed' : 'Enabled'),
      newState
        ? 'In-app messages will NOT be shown'
        : 'In-app messages will be shown normally',
    );
  };

  const triggerEvent = async (eventName: string) => {
    await analytics().logEvent(eventName);
    Alert.alert(
      'Event Triggered',
      `Logged "${eventName}" event. If a campaign is set up for this event in Firebase Console, the message will appear.`,
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>In-App Messaging</Text>
      <Text style={styles.subtitle}>
        Messages created in Firebase Console appear automatically
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Control Messages:</Text>

        <TouchableOpacity
          style={[styles.button, suppressed && styles.buttonDanger]}
          onPress={toggleSuppression}>
          <Text style={styles.buttonText}>
            {suppressed ? '🔕 Messages Suppressed' : '🔔 Messages Enabled'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          {suppressed
            ? 'Messages are currently blocked'
            : 'Messages will show when triggered'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Trigger Test Events:</Text>
        <Text style={styles.infoText}>
          These events can trigger messages if you've created campaigns in
          Firebase Console
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => triggerEvent('promo_viewed')}>
          <Text style={styles.buttonText}>📢 Trigger: promo_viewed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => triggerEvent('level_complete')}>
          <Text style={styles.buttonText}>🎮 Trigger: level_complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => triggerEvent('purchase_intent')}>
          <Text style={styles.buttonText}>🛒 Trigger: purchase_intent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => triggerEvent('feature_discovered')}>
          <Text style={styles.buttonText}>✨ Trigger: feature_discovered</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>📋 How to Create Messages:</Text>
        <Text style={styles.infoText}>
          1. Go to Firebase Console → Engage → In-App Messaging
        </Text>
        <Text style={styles.infoText}>
          2. Click "Create your first campaign"
        </Text>
        <Text style={styles.infoText}>
          3. Choose style: Banner / Modal / Image
        </Text>
        <Text style={styles.infoText}>
          4. Set trigger: on_foreground or custom event
        </Text>
        <Text style={styles.infoText}>
          5. Set targeting: All users or specific
        </Text>
        <Text style={styles.infoText}>6. Publish campaign</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>💡 Example Campaigns:</Text>
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Welcome Message:</Text>
          {'\n'}Trigger: on_foreground (first time)
          {'\n'}Message: "Welcome to our app! 👋"
        </Text>
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Promo Banner:</Text>
          {'\n'}Trigger: promo_viewed
          {'\n'}Message: "50% OFF - Limited time!"
        </Text>
        <Text style={styles.exampleText}>
          <Text style={styles.bold}>Achievement:</Text>
          {'\n'}Trigger: level_complete
          {'\n'}Message: "Congrats! You completed level 5 🎉"
        </Text>
      </View>

      <View style={styles.warningContainer}>
        <Text style={styles.warningTitle}>⚠️ Testing Tips:</Text>
        <Text style={styles.warningText}>
          • Messages may take a few minutes to appear after publishing
        </Text>
        <Text style={styles.warningText}>
          • Each message shows only once per user (unless configured otherwise)
        </Text>
        <Text style={styles.warningText}>
          • Use test devices in Console to see messages immediately
        </Text>
        <Text style={styles.warningText}>
          • Clear app data to reset message impressions
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🎨 Message Types:</Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>Banner:</Text> Top/bottom bar with text +
          button
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>Modal:</Text> Center popup, blocks screen
        </Text>
        <Text style={styles.infoText}>
          <Text style={styles.bold}>Image:</Text> Full image card with button
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonDanger: {
    backgroundColor: '#E63946',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
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
    lineHeight: 20,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  warningContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default InAppMessagingScreen;
