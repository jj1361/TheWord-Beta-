/**
 * Authentication Service
 * Handles user registration, login, logout, and session management
 * Uses localStorage for persistence (client-side only)
 */

import {
  UserProfile,
  UserCredentials,
  SessionData,
  LoginCredentials,
  SignupData,
} from '../types/user';

// Storage keys
const STORAGE_KEYS = {
  USERS: 'bible-app-users',
  CREDENTIALS: 'bible-app-credentials',
  SESSION: 'bible-app-session',
};

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Simple hash function using Web Crypto API
 * For production, consider using bcrypt via a backend
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique user ID
 */
function generateUID(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class AuthService {
  /**
   * Get all registered users (profiles only, no credentials)
   */
  getUsers(): UserProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save users to storage
   */
  private saveUsers(users: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  /**
   * Get all credentials (private)
   */
  private getCredentials(): UserCredentials[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save credentials to storage (private)
   */
  private saveCredentials(credentials: UserCredentials[]): void {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
  }

  /**
   * Get current session
   */
  private getSession(): SessionData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!data) return null;

      const session: SessionData = JSON.parse(data);

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  /**
   * Save session to storage
   */
  private saveSession(session: SessionData): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }

  /**
   * Clear current session
   */
  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  /**
   * Get currently logged in user (if any)
   */
  getCurrentUser(): UserProfile | null {
    const session = this.getSession();
    if (!session) return null;

    const users = this.getUsers();
    const user = users.find(u => u.uid === session.uid);

    return user || null;
  }

  /**
   * Check if a user is an admin
   */
  isAdmin(user?: UserProfile | null): boolean {
    const currentUser = user || this.getCurrentUser();
    return currentUser?.role === 'admin';
  }

  /**
   * Check if email is already registered
   */
  isEmailRegistered(email: string): boolean {
    const users = this.getUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Register a new user
   */
  async signUp(data: SignupData): Promise<UserProfile> {
    const { email, password, displayName } = data;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if email already exists
    if (this.isEmailRegistered(email)) {
      throw new Error('Email is already registered');
    }

    const users = this.getUsers();
    const credentials = this.getCredentials();

    // First user becomes admin
    const isFirstUser = users.length === 0;
    const uid = generateUID();
    const now = Date.now();

    // Create user profile
    const userProfile: UserProfile = {
      uid,
      email: email.toLowerCase(),
      displayName: displayName || email.split('@')[0],
      role: isFirstUser ? 'admin' : 'member',
      createdAt: now,
      lastLoginAt: now,
    };

    // Create credentials
    const passwordHash = await hashPassword(password);
    const userCredentials: UserCredentials = {
      uid,
      email: email.toLowerCase(),
      passwordHash,
    };

    // Save to storage
    users.push(userProfile);
    credentials.push(userCredentials);
    this.saveUsers(users);
    this.saveCredentials(credentials);

    // Create session
    const session: SessionData = {
      uid,
      expiresAt: now + SESSION_DURATION_MS,
    };
    this.saveSession(session);

    return userProfile;
  }

  /**
   * Log in an existing user
   */
  async signIn(credentials: LoginCredentials): Promise<UserProfile> {
    const { email, password } = credentials;

    const users = this.getUsers();
    const allCredentials = this.getCredentials();

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Find credentials
    const userCreds = allCredentials.find(c => c.uid === user.uid);
    if (!userCreds) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== userCreds.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Update last login time
    const now = Date.now();
    user.lastLoginAt = now;
    this.saveUsers(users);

    // Create session
    const session: SessionData = {
      uid: user.uid,
      expiresAt: now + SESSION_DURATION_MS,
    };
    this.saveSession(session);

    return user;
  }

  /**
   * Log out the current user
   */
  signOut(): void {
    this.clearSession();
  }

  /**
   * Update user profile
   */
  updateProfile(uid: string, updates: Partial<Pick<UserProfile, 'displayName' | 'role'>>): UserProfile | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);

    if (userIndex === -1) return null;

    // Apply updates
    if (updates.displayName !== undefined) {
      users[userIndex].displayName = updates.displayName;
    }
    if (updates.role !== undefined) {
      // Prevent removing the last admin
      if (updates.role !== 'admin') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount <= 1 && users[userIndex].role === 'admin') {
          throw new Error('Cannot remove the last admin');
        }
      }
      users[userIndex].role = updates.role;
    }

    this.saveUsers(users);
    return users[userIndex];
  }

  /**
   * Delete a user account
   */
  deleteUser(uid: string): boolean {
    const users = this.getUsers();
    const credentials = this.getCredentials();

    // Find user
    const user = users.find(u => u.uid === uid);
    if (!user) return false;

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin');
      }
    }

    // Remove user and credentials
    const filteredUsers = users.filter(u => u.uid !== uid);
    const filteredCredentials = credentials.filter(c => c.uid !== uid);

    this.saveUsers(filteredUsers);
    this.saveCredentials(filteredCredentials);

    // Clear session if deleting current user
    const currentUser = this.getCurrentUser();
    if (currentUser?.uid === uid) {
      this.clearSession();
    }

    // Clean up user data
    this.cleanupUserData(uid);

    return true;
  }

  /**
   * Clean up user-specific data from localStorage
   */
  private cleanupUserData(uid: string): void {
    const userPrefix = `user-${uid}-`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(userPrefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Change user password
   */
  async changePassword(uid: string, currentPassword: string, newPassword: string): Promise<void> {
    const credentials = this.getCredentials();
    const userCreds = credentials.find(c => c.uid === uid);

    if (!userCreds) {
      throw new Error('User not found');
    }

    // Verify current password
    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== userCreds.passwordHash) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Update password
    userCreds.passwordHash = await hashPassword(newPassword);
    this.saveCredentials(credentials);
  }

  /**
   * Get user by ID (admin function)
   */
  getUserById(uid: string): UserProfile | null {
    const users = this.getUsers();
    return users.find(u => u.uid === uid) || null;
  }

  /**
   * Refresh session (extend expiration)
   */
  refreshSession(): void {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + SESSION_DURATION_MS;
      this.saveSession(session);
    }
  }
}

export const authService = new AuthService();
