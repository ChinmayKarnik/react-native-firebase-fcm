/**
 * Notification Channel Constants
 * 
 * These IDs MUST match between:
 * 1. App code (when creating channels)
 * 2. Backend code (when sending FCM messages)
 * 
 * IMPORTANT: Once a channel is created on a user's device, you cannot
 * change its settings programmatically. Only users can modify channel settings.
 */

export const NOTIFICATION_CHANNELS = {
  IMPORTANT_UPDATES: {
    id: 'important_updates',
    name: 'Important Updates',
    description: 'Order confirmations, delivery updates, and time-sensitive alerts',
  },
  MESSAGES: {
    id: 'messages',
    name: 'Messages',
    description: 'Chat messages and direct communications',
  },
  PROMOTIONS: {
    id: 'promotions',
    name: 'Promotions & Offers',
    description: 'Marketing messages, deals, and promotional content',
  },
} as const;

// Export just the IDs for easy backend sync
export const CHANNEL_IDS = {
  IMPORTANT_UPDATES: NOTIFICATION_CHANNELS.IMPORTANT_UPDATES.id,
  MESSAGES: NOTIFICATION_CHANNELS.MESSAGES.id,
  PROMOTIONS: NOTIFICATION_CHANNELS.PROMOTIONS.id,
} as const;
