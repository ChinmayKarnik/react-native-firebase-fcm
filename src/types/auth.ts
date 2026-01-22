export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInTime: string | null;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}
