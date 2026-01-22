/**
 * Remote Config Type Definitions
 */

export interface FeatureFlags {
  enableNewUI: boolean;
  enablePremiumFeatures: boolean;
  enableBetaFeatures: boolean;
  enableDebugMode: boolean;
}

export interface APIConfiguration {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  enableMocking: boolean;
}

export interface ABTestVariants {
  checkoutButtonText: string;
  primaryColor: string;
  showPromoBanner: boolean;
}

export interface AppConfiguration {
  features: FeatureFlags;
  api: APIConfiguration;
  abTests: ABTestVariants;
  maintenanceMode: boolean;
  forceUpdateVersion: string;
}
