/**
 * Authentication Context
 * Provides auth state and methods to all components
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, AuthState, LoginCredentials, SignupData } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  signUp: (data: SignupData) => Promise<UserProfile>;
  signIn: (credentials: LoginCredentials) => Promise<UserProfile>;
  signOut: () => void;
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName'>>) => UserProfile | null;
  isAdmin: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    setAuthState({
      user,
      loading: false,
      error: null,
    });
  }, []);

  // Refresh session periodically (every 30 minutes)
  useEffect(() => {
    if (authState.user) {
      const interval = setInterval(() => {
        authService.refreshSession();
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [authState.user]);

  const refreshAuth = useCallback(() => {
    const user = authService.getCurrentUser();
    setAuthState(prev => ({
      ...prev,
      user,
      error: null,
    }));
  }, []);

  const signUp = useCallback(async (data: SignupData): Promise<UserProfile> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const user = await authService.signUp(data);
      setAuthState({
        user,
        loading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to sign up';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error,
      }));
      throw err;
    }
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<UserProfile> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const user = await authService.signIn(credentials);
      setAuthState({
        user,
        loading: false,
        error: null,
      });
      return user;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to sign in';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error,
      }));
      throw err;
    }
  }, []);

  const signOut = useCallback(() => {
    authService.signOut();
    setAuthState({
      user: null,
      loading: false,
      error: null,
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<Pick<UserProfile, 'displayName'>>): UserProfile | null => {
    if (!authState.user) return null;

    const updatedUser = authService.updateProfile(authState.user.uid, updates);
    if (updatedUser) {
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
    }
    return updatedUser;
  }, [authState.user]);

  const value: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: authService.isAdmin(authState.user),
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
