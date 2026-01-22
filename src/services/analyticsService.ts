import analytics from '@react-native-firebase/analytics';

/**
 * Firebase Analytics Service
 * Tracks user behavior and app performance
 */

class AnalyticsService {
  /**
   * Log a custom event
   */
  async logEvent(eventName: string, params?: Record<string, any>): Promise<void> {
    try {
      await analytics().logEvent(eventName, params);
      console.log(`[Analytics] Event logged: ${eventName}`, params);
    } catch (error) {
      console.error('[Analytics] Failed to log event:', error);
    }
  }

  /**
   * Log screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
    console.log(`[Analytics] Screen view: ${screenName}`);
  }

  /**
   * Set user property
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    await analytics().setUserProperty(name, value);
    console.log(`[Analytics] User property set: ${name} = ${value}`);
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string): Promise<void> {
    await analytics().setUserId(userId);
    console.log(`[Analytics] User ID set: ${userId}`);
  }

  /**
   * Enable/disable analytics collection
   */
  async setAnalyticsCollectionEnabled(enabled: boolean): Promise<void> {
    await analytics().setAnalyticsCollectionEnabled(enabled);
    console.log(`[Analytics] Collection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Log app open event
   */
  async logAppOpen(): Promise<void> {
    await this.logEvent('app_open');
  }

  /**
   * Log feature usage
   */
  async logFeatureUsed(featureName: string): Promise<void> {
    await this.logEvent('feature_used', { feature_name: featureName });
  }

  /**
   * Log button click
   */
  async logButtonClick(buttonName: string, screenName?: string): Promise<void> {
    await this.logEvent('button_click', {
      button_name: buttonName,
      screen_name: screenName,
    });
  }

  /**
   * Log FCM token refresh
   */
  async logFCMTokenRefresh(): Promise<void> {
    await this.logEvent('fcm_token_refresh');
  }

  /**
   * Log notification received
   */
  async logNotificationReceived(notificationType: string): Promise<void> {
    await this.logEvent('notification_received', {
      notification_type: notificationType,
    });
  }

  /**
   * Log Remote Config fetch
   */
  async logRemoteConfigFetch(success: boolean): Promise<void> {
    await this.logEvent('remote_config_fetch', { success });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
