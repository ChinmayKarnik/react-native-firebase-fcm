import crashlytics from '@react-native-firebase/crashlytics';

class CrashlyticsService {
  /**
   * Enable/disable crash collection
   * Useful for opt-in/opt-out scenarios
   */
  async setCrashlyticsCollectionEnabled(enabled: boolean): Promise<void> {
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
    console.log(`Crashlytics collection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if Crashlytics is enabled
   */
  isCrashlyticsCollectionEnabled(): boolean {
    return crashlytics().isCrashlyticsCollectionEnabled;
  }

  /**
   * Log a non-fatal error
   * Use for caught exceptions that you want to track
   */
  recordError(error: Error, context?: string): void {
    if (context) {
      crashlytics().log(`Error context: ${context}`);
    }
    crashlytics().recordError(error);
    console.log('Non-fatal error recorded:', error.message);
  }

  /**
   * Log custom message to crash report
   * Helps understand what user was doing before crash
   */
  log(message: string): void {
    crashlytics().log(message);
  }

  /**
   * Set user identifier
   * Helps identify which users are experiencing crashes
   */
  setUserId(userId: string): void {
    crashlytics().setUserId(userId);
    console.log('Crashlytics user ID set:', userId);
  }

  /**
   * Set custom key-value pairs
   * Add context to crash reports (app state, feature flags, etc.)
   */
  setAttribute(key: string, value: string): void {
    crashlytics().setAttribute(key, value);
  }

  /**
   * Set multiple attributes at once
   */
  setAttributes(attributes: { [key: string]: string }): void {
    crashlytics().setAttributes(attributes);
  }

  /**
   * Force a crash (for testing)
   * ⚠️ Only use in development builds
   */
  crash(): void {
    console.warn('⚠️ FORCING CRASH - App will terminate');
    crashlytics().crash();
  }

  /**
   * Check for unhandled crashes on last session
   * Returns true if app crashed previously
   */
  async checkForUnsentReports(): Promise<boolean> {
    const hasReports = await crashlytics().checkForUnsentReports();
    return hasReports;
  }

  /**
   * Send unsent crash reports
   */
  async sendUnsentReports(): Promise<void> {
    await crashlytics().sendUnsentReports();
    console.log('Unsent crash reports sent');
  }

  /**
   * Delete unsent crash reports
   * Use for privacy-sensitive scenarios
   */
  async deleteUnsentReports(): Promise<void> {
    await crashlytics().deleteUnsentReports();
    console.log('Unsent crash reports deleted');
  }

  /**
   * Track button click crashes
   */
  logButtonClick(buttonName: string, screenName: string): void {
    this.log(`Button clicked: ${buttonName} on ${screenName}`);
  }

  /**
   * Track navigation crashes
   */
  logScreenView(screenName: string): void {
    this.log(`Screen viewed: ${screenName}`);
  }

  /**
   * Log handled error with breadcrumbs
   */
  logHandledError(error: Error, breadcrumbs: string[]): void {
    breadcrumbs.forEach(breadcrumb => {
      this.log(breadcrumb);
    });
    this.recordError(error);
  }

  /**
   * Common error tracking patterns
   */
  
  // Network errors
  logNetworkError(url: string, statusCode: number, error: Error): void {
    this.log(`Network error: ${url} - Status: ${statusCode}`);
    this.setAttribute('last_network_call', url);
    this.setAttribute('network_status_code', statusCode.toString());
    this.recordError(error);
  }

  // Payment errors
  logPaymentError(paymentMethod: string, amount: number, error: Error): void {
    this.log(`Payment failed: ${paymentMethod} - Amount: $${amount}`);
    this.setAttribute('payment_method', paymentMethod);
    this.setAttribute('payment_amount', amount.toString());
    this.recordError(error);
  }

  // Database errors
  logDatabaseError(operation: string, error: Error): void {
    this.log(`Database operation failed: ${operation}`);
    this.setAttribute('db_operation', operation);
    this.recordError(error);
  }

  /**
   * Test crash scenarios
   */
  
  // JavaScript error (caught)
  testJavaScriptError(): void {
    try {
      throw new Error('Test JavaScript error - This is intentional');
    } catch (error: any) {
      this.log('Testing JavaScript error handling');
      this.recordError(error, 'JavaScript error test');
    }
  }

  // JavaScript crash (uncaught)
  testJavaScriptCrash(): void {
    this.log('About to trigger JavaScript crash');
    throw new Error('Test JavaScript crash - App will crash!');
  }

  // Null pointer error
  testNullPointerError(): void {
    try {
      const obj: any = null;
      const value = obj.nonExistentProperty.value; // Will throw
    } catch (error: any) {
      this.log('Null pointer error occurred');
      this.recordError(error, 'Null pointer test');
    }
  }

  // Array index error
  testArrayIndexError(): void {
    try {
      const array: string[] = [];
      const item = array[999999]; // undefined
      const upper = item.toUpperCase(); // Will throw
    } catch (error: any) {
      this.log('Array index error occurred');
      this.recordError(error, 'Array index test');
    }
  }

  // Promise rejection
  testUnhandledPromiseRejection(): void {
    this.log('Testing unhandled promise rejection');
    Promise.reject(new Error('Unhandled promise rejection test'));
    // Note: React Native handles promise rejections, but logs warning
  }
}

export default new CrashlyticsService();
