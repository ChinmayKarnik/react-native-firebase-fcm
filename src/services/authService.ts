import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

class AuthService {
  /**
   * Sign up with email and password
   * Creates new user account
   */
  async signUp(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      console.log('User signed up successfully:', userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error('Sign up error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      console.log('User signed in successfully:', userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error('Sign in error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   * Returns null if not signed in
   */
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return auth().currentUser !== null;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
      console.log('Password reset email sent to:', email);
    } catch (error: any) {
      console.error('Password reset error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user email
   * Requires recent authentication
   */
  async updateEmail(newEmail: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');
      
      await user.updateEmail(newEmail);
      console.log('Email updated to:', newEmail);
    } catch (error: any) {
      console.error('Update email error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user password
   * Requires recent authentication
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');
      
      await user.updatePassword(newPassword);
      console.log('Password updated successfully');
    } catch (error: any) {
      console.error('Update password error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Delete current user account
   * Requires recent authentication
   */
  async deleteAccount(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');
      
      await user.delete();
      console.log('User account deleted');
    } catch (error: any) {
      console.error('Delete account error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Re-authenticate user
   * Required for sensitive operations like email/password change or account deletion
   */
  async reauthenticate(email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');

      const credential = auth.EmailAuthProvider.credential(email, password);
      const userCredential = await user.reauthenticateWithCredential(credential);
      console.log('User re-authenticated successfully');
      return userCredential;
    } catch (error: any) {
      console.error('Re-authentication error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Send email verification
   * User must verify email before accessing certain features
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');
      
      await user.sendEmailVerification();
      console.log('Verification email sent to:', user.email);
    } catch (error: any) {
      console.error('Send verification error:', error.code, error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reload user to get latest data (e.g., email verification status)
   */
  async reloadUser(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user signed in');
      
      await user.reload();
      console.log('User data reloaded');
    } catch (error: any) {
      console.error('Reload user error:', error.code, error.message);
      throw error;
    }
  }

  /**
   * Listen to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
    return auth().onAuthStateChanged(callback);
  }

  /**
   * Handle auth errors and return user-friendly messages
   */
  private handleAuthError(error: any): Error {
    let message = 'An error occurred';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Please sign in instead.';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address format.';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak. Use at least 6 characters.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Check your connection.';
        break;
      case 'auth/requires-recent-login':
        message = 'Please sign in again to perform this action.';
        break;
      default:
        message = error.message || 'Authentication failed';
    }

    return new Error(message);
  }
}

export default new AuthService();
