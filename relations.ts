import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  loginWithEmail,
  loginWithOAuth,
  logout,
  getStoredUser,
  isAuthenticated,
  User,
} from '@/lib/services/auth-service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check authentication status on app start
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        const storedUser = await getStoredUser();
        setUser(storedUser);
        setIsSignedIn(true);
      }
    } catch (error) {
      console.error('Error bootstrapping auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const newUser = await loginWithEmail(email, password);
      setUser(newUser);
      setIsSignedIn(true);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);
      const newUser = await loginWithOAuth(provider);
      setUser(newUser);
      setIsSignedIn(true);
    } catch (error) {
      console.error(`OAuth sign in error (${provider}):`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await logout();
      setUser(null);
      setIsSignedIn(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    signIn,
    signInWithOAuth,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
