/**
 * User types for authentication and authorization
 */

export type UserRole = 'member' | 'admin';

/**
 * User profile stored in the system
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: number;
  lastLoginAt: number;
}

/**
 * User credentials stored (password is hashed)
 */
export interface UserCredentials {
  uid: string;
  email: string;
  passwordHash: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

/**
 * Session data stored in localStorage
 */
export interface SessionData {
  uid: string;
  expiresAt: number;
}

/**
 * Login credentials input
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signup data input
 */
export interface SignupData {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * User data export format (for admin/backup)
 */
export interface UserDataExport {
  profile: UserProfile;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
}
