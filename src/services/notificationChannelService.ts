import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';
import { NOTIFICATION_CHANNELS } from '../constants/notificationChannels';

/**
 * Notification Channel Service
 * 
 * Handles creation and management of Android notification channels.
 * 
 * KEY CONCEPTS:
 * - Channels are Android 8.0+ only (API level 26+)
 * - Once created, channels are IMMUTABLE (user controls them)
 * - Channels must be created BEFORE sending notifications
 * - If you send to a non-existent channel, Android creates "Miscellaneous"
 */

class NotificationChannelService {
  /**
   * Initialize all notification channels
   * 
   * Call this at app startup (usually in App.tsx useEffect)
   * 
   * Why at startup?
   * - Ensures channels exist before any notification arrives
   * - Makes channels visible in settings immediately
   * - Only creates once (subsequent calls do nothing if channel exists)
   */
  async initializeChannels(): Promise<void> {
    // Channels are Android-only concept
    if (Platform.OS !== 'android') {
      console.log('📱 iOS does not use notification channels');
      return;
    }

    try {
      console.log('🔔 Initializing notification channels...');

      // Create each channel with appropriate settings
      await Promise.all([
        this.createImportantUpdatesChannel(),
        this.createMessagesChannel(),
        this.createPromotionsChannel(),
      ]);

      console.log('✅ All notification channels created');

      // Optional: Log existing channels for debugging
      await this.logExistingChannels();
    } catch (error) {
      console.error('❌ Error creating notification channels:', error);
    }
  }

  /**
   * Create "Important Updates" channel
   * 
   * HIGH importance = Sound + heads-up notification (pops on screen)
   * Use for: Order updates, delivery alerts, time-sensitive info
   */
  private async createImportantUpdatesChannel(): Promise<void> {
    const channel = NOTIFICATION_CHANNELS.IMPORTANT_UPDATES;

    await notifee.createChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    console.log(`  ✓ Created channel: ${channel.name} (HIGH importance)`);
  }

  /**
   * Create "Messages" channel
   * 
   * DEFAULT importance = Sound + notification tray (no pop-up)
   * Use for: Chat messages, social interactions
   */
  private async createMessagesChannel(): Promise<void> {
    const channel = NOTIFICATION_CHANNELS.MESSAGES;

    await notifee.createChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: true,
    });

    console.log(`  ✓ Created channel: ${channel.name} (DEFAULT importance)`);
  }

  /**
   * Create "Promotions" channel
   * 
   * LOW importance = No sound, just appears in tray
   * Use for: Marketing, deals, non-urgent info
   */
  private async createPromotionsChannel(): Promise<void> {
    const channel = NOTIFICATION_CHANNELS.PROMOTIONS;

    await notifee.createChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      importance: AndroidImportance.LOW,
      sound: undefined, // No sound for low-priority notifications
      vibration: false, // No vibration
    });

    console.log(`  ✓ Created channel: ${channel.name} (LOW importance)`);
  }

  /**
   * Get all existing channels (for debugging)
   */
  async getChannels() {
    if (Platform.OS !== 'android') {
      return [];
    }

    return await notifee.getChannels();
  }

  /**
   * Log all existing channels (helpful for debugging)
   */
  private async logExistingChannels(): Promise<void> {
    const channels = await this.getChannels();
    console.log(`📋 Total channels: ${channels.length}`);
    channels.forEach(ch => {
      console.log(`   - ${ch.name} (${ch.id})`);
    });
  }

  /**
   * Delete a channel (NOT RECOMMENDED in production)
   * 
   * Why avoid this?
   * - User loses their custom settings
   * - Confusing UX (channel disappears/reappears)
   * - Better to create new channel with different ID
   */
  async deleteChannel(channelId: string): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    await notifee.deleteChannel(channelId);
    console.log(`🗑️ Deleted channel: ${channelId}`);
  }
}

// Export singleton instance
export const notificationChannelService = new NotificationChannelService();
