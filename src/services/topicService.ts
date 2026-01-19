import messaging from '@react-native-firebase/messaging';

/**
 * FCM Topic Service
 * 
 * Topics = Pub/Sub pattern for group notifications
 * 
 * KEY CONCEPTS:
 * - Users subscribe/unsubscribe to topics client-side
 * - Backend sends ONE message to a topic
 * - FCM delivers to ALL subscribers automatically
 * - No backend database needed for topic memberships
 * 
 * TOPIC NAMING RULES:
 * - Letters, numbers, underscore, hyphen only
 * - No spaces allowed
 * - Case-sensitive: 'TechNews' ≠ 'technews'
 * - Max length: 900 characters (but keep short!)
 */

// Define available topics as constants
// This ensures consistency across app and backend
export const TOPICS = {
  COURSES: 'courses',
  TECH_NEWS: 'tech_news',
  QUIZ_OF_THE_DAY: 'quiz_of_the_day',
  
  // Special topics (optional):
  ALL_USERS: 'all_users',  // Subscribe everyone by default
} as const;

// TypeScript: Extract type from the object values
export type TopicName = typeof TOPICS[keyof typeof TOPICS];

/**
 * Topic Service Class
 * Manages FCM topic subscriptions
 */
class TopicService {
  
  /**
   * Subscribe to a topic
   * 
   * @param topic - Topic name to subscribe to
   * 
   * WHEN THIS HAPPENS:
   * 1. App calls FCM SDK
   * 2. FCM SDK registers device token with this topic on FCM servers
   * 3. Future messages to this topic will reach this device
   * 
   * IMPORTANT:
   * - Subscription persists across app restarts
   * - Even if user reinstalls app, they stay subscribed (same device token)
   * - To unsubscribe, must explicitly call unsubscribeFromTopic()
   */
  async subscribeToTopic(topic: TopicName): Promise<void> {
    try {
      console.log(`📬 Subscribing to topic: ${topic}`);
      
      // FCM SDK handles everything
      await messaging().subscribeToTopic(topic);
      
      console.log(`✅ Successfully subscribed to: ${topic}`);
    } catch (error) {
      console.error(`❌ Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a topic
   * 
   * @param topic - Topic name to unsubscribe from
   * 
   * USE CASES:
   * - User toggles off notification preference
   * - User downgrades from premium (unsubscribe from 'premium_offers')
   * - App feature disabled
   */
  async unsubscribeFromTopic(topic: TopicName): Promise<void> {
    try {
      console.log(`📭 Unsubscribing from topic: ${topic}`);
      
      await messaging().unsubscribeFromTopic(topic);
      
      console.log(`✅ Successfully unsubscribed from: ${topic}`);
    } catch (error) {
      console.error(`❌ Error unsubscribing from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple topics at once
   * 
   * USE CASE: When user signs up, subscribe to default topics
   * 
   * @param topics - Array of topic names
   */
  async subscribeToMultipleTopics(topics: TopicName[]): Promise<void> {
    console.log(`📬 Subscribing to ${topics.length} topics...`);
    
    // Subscribe in parallel for speed
    const promises = topics.map(topic => this.subscribeToTopic(topic));
    
    try {
      await Promise.all(promises);
      console.log('✅ All topic subscriptions complete');
    } catch (error) {
      console.error('❌ Some topic subscriptions failed:', error);
      // Note: Some may have succeeded, some may have failed
      // In production, you might want more granular error handling
    }
  }

  /**
   * Unsubscribe from multiple topics
   * 
   * USE CASE: User logs out, remove all subscriptions
   */
  async unsubscribeFromMultipleTopics(topics: TopicName[]): Promise<void> {
    console.log(`📭 Unsubscribing from ${topics.length} topics...`);
    
    const promises = topics.map(topic => this.unsubscribeFromTopic(topic));
    
    try {
      await Promise.all(promises);
      console.log('✅ All topic unsubscriptions complete');
    } catch (error) {
      console.error('❌ Some topic unsubscriptions failed:', error);
    }
  }

  /**
   * Subscribe to default topics for all users
   * 
   * USE CASE: Call this at app initialization or after login
   * 
   * PATTERN: Some topics are opt-out (everyone gets them by default)
   * vs opt-in (user must explicitly subscribe)
   */
  async subscribeToDefaultTopics(): Promise<void> {
    const defaultTopics: TopicName[] = [
      TOPICS.ALL_USERS,  // Critical announcements
      // Add other default topics as needed
    ];

    console.log('📬 Subscribing to default topics...');
    await this.subscribeToMultipleTopics(defaultTopics);
  }

  /**
   * Helper: Get user-friendly topic name
   * 
   * Converts 'tech_news' → 'Tech News'
   * Useful for UI display
   */
  getTopicDisplayName(topic: TopicName): string {
    const displayNames: Record<TopicName, string> = {
      [TOPICS.COURSES]: 'Course Updates',
      [TOPICS.TECH_NEWS]: 'Tech News',
      [TOPICS.QUIZ_OF_THE_DAY]: 'Daily Quiz',
      [TOPICS.ALL_USERS]: 'Important Announcements',
    };

    return displayNames[topic] || topic;
  }
}

// Export singleton instance
export const topicService = new TopicService();
