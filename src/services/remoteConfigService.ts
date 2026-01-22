import remoteConfig from '@react-native-firebase/remote-config';
import type { AppConfiguration } from '../types/remoteConfig';

/**
 * Remote Config Service
 * Manages feature flags, A/B tests, and dynamic configuration
 */

// Default configuration values
const DEFAULT_CONFIG = {
  // Feature flags
  enable_dark_mode: false,
  enable_premium_features: false,
  show_promotional_banner: false,
  
  // UI configuration
  welcome_message: 'Welcome to FCM Showcase',
  primary_color: '#007AFF',
  max_notifications_per_day: 10,
  
  // API configuration
  api_timeout_seconds: 30,
  enable_debug_logging: false,
  
  // A/B test example
  checkout_button_text: 'Checkout',
  
  // Complex config (JSON)
  app_configuration: JSON.stringify({
    features: {
      enableNewUI: false,
      enablePremiumFeatures: false,
      enableBetaFeatures: false,
      enableDebugMode: false
    },
    api: {
      baseURL: 'https://api.production.com',
      timeout: 30000,
      maxRetries: 3,
      enableMocking: false
    },
    abTests: {
      checkoutButtonText: 'Checkout',
      primaryColor: '#007AFF',
      showPromoBanner: false
    },
    maintenanceMode: false,
    forceUpdateVersion: '0.0.0'
  })
};

class RemoteConfigService {
  private initialized = false;

  /**
   * Initialize Remote Config with defaults and fetch settings
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[RemoteConfig] Already initialized');
      return;
    }

    try {
      // Set default values (used before first fetch or as fallback)
      await remoteConfig().setDefaults(DEFAULT_CONFIG);

      // Configure fetch settings
      await remoteConfig().setConfigSettings({
        // In production, use default (12 hours)
        // In development, set to 0 to always fetch latest
        minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1 hour in prod
      });

      console.log('[RemoteConfig] Initialized with defaults');
      this.initialized = true;
    } catch (error) {
      console.error('[RemoteConfig] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Fetch and activate latest config from server
   * @returns true if new values were activated
   */
  async fetchAndActivate(): Promise<boolean> {
    try {
      const activated = await remoteConfig().fetchAndActivate();
      
      if (activated) {
        console.log('[RemoteConfig] New config activated');
        this.logCurrentConfig();
      } else {
        console.log('[RemoteConfig] No new config available (using cached)');
      }
      
      return activated;
    } catch (error) {
      console.error('[RemoteConfig] Fetch failed:', error);
      // App continues with defaults or last cached values
      return false;
    }
  }

  /**
   * Fetch config without activating (activate later)
   */
  async fetch(): Promise<void> {
    try {
      await remoteConfig().fetch();
      console.log('[RemoteConfig] Config fetched (not activated yet)');
    } catch (error) {
      console.error('[RemoteConfig] Fetch failed:', error);
    }
  }

  /**
   * Activate fetched config
   * @returns true if new values were activated
   */
  async activate(): Promise<boolean> {
    try {
      const activated = await remoteConfig().activate();
      
      if (activated) {
        console.log('[RemoteConfig] Fetched config activated');
        this.logCurrentConfig();
      }
      
      return activated;
    } catch (error) {
      console.error('[RemoteConfig] Activation failed:', error);
      return false;
    }
  }

  /**
   * Get string value
   */
  getString(key: keyof typeof DEFAULT_CONFIG): string {
    return remoteConfig().getValue(key).asString();
  }

  /**
   * Get number value
   */
  getNumber(key: keyof typeof DEFAULT_CONFIG): number {
    return remoteConfig().getValue(key).asNumber();
  }

  /**
   * Get boolean value
   */
  getBoolean(key: keyof typeof DEFAULT_CONFIG): boolean {
    return remoteConfig().getValue(key).asBoolean();
  }

  /**
   * Get JSON value (parse from string)
   */
  getJSON<T>(key: keyof typeof DEFAULT_CONFIG): T {
    const jsonString = this.getString(key);
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error(`[RemoteConfig] Failed to parse JSON for key: ${key}`);
      throw error;
    }
  }

  /**
   * Get all config values as object
   */
  getAllValues(): Record<string, any> {
    const allValues = remoteConfig().getAll();
    const result: Record<string, any> = {};
    
    Object.keys(allValues).forEach(key => {
      result[key] = allValues[key].asString();
    });
    
    return result;
  }

  /**
   * Get config source for debugging
   * Returns: 'default', 'remote', or 'static'
   */
  getSource(key: keyof typeof DEFAULT_CONFIG): string {
    return remoteConfig().getValue(key).getSource();
  }

  /**
   * Get last fetch status
   * Returns: 'success', 'failure', 'no_fetch_yet', or 'throttled'
   */
  getLastFetchStatus(): string {
    return remoteConfig().lastFetchStatus;
  }

  /**
   * Get last successful fetch time
   */
  getLastFetchTime(): Date {
    const timestamp = remoteConfig().lastFetchTime;
    return new Date(timestamp);
  }

  /**
   * Get full app configuration (parsed JSON)
   */
  getAppConfiguration(): AppConfiguration {
    return this.getJSON<AppConfiguration>('app_configuration');
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName: keyof AppConfiguration['features']): boolean {
    try {
      const config = this.getAppConfiguration();
      return config.features[featureName] || false;
    } catch {
      return false;
    }
  }

  /**
   * Get A/B test variant for current user
   */
  getABTestVariant(testName: keyof AppConfiguration['abTests']): any {
    try {
      const config = this.getAppConfiguration();
      return config.abTests[testName];
    } catch {
      return null;
    }
  }

  /**
   * Check if app is in maintenance mode
   */
  isMaintenanceMode(): boolean {
    try {
      const config = this.getAppConfiguration();
      return config.maintenanceMode;
    } catch {
      return false;
    }
  }

  /**
   * Get minimum required version (for force update)
   */
  getMinimumRequiredVersion(): string {
    try {
      const config = this.getAppConfiguration();
      return config.forceUpdateVersion;
    } catch {
      return '0.0.0';
    }
  }

  /**
   * Reset to defaults (for testing)
   */
  async reset(): Promise<void> {
    await remoteConfig().setDefaults(DEFAULT_CONFIG);
    console.log('[RemoteConfig] Reset to defaults');
  }

  /**
   * Log current configuration (debugging)
   */
  private logCurrentConfig(): void {
    console.log('[RemoteConfig] Current configuration:');
    console.log('  Dark Mode:', this.getBoolean('enable_dark_mode'));
    console.log('  Welcome Message:', this.getString('welcome_message'));
    console.log('  Primary Color:', this.getString('primary_color'));
    console.log('  API Timeout:', this.getNumber('api_timeout_seconds'));
    console.log('  Last Fetch:', this.getLastFetchTime().toISOString());
    console.log('  Last Fetch Status:', this.getLastFetchStatus());
  }
}

// Export singleton instance
export const remoteConfigService = new RemoteConfigService();
export default remoteConfigService;
