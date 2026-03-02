import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Authentication Service
 * Handles user login, logout, and session management
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

const AUTH_KEY = 'dj_banksy_auth';
const USER_KEY = 'dj_banksy_user';
const TOKEN_KEY = 'dj_banksy_token';

/**
 * Store auth token securely
 */
export async function storeAuthToken(token: AuthToken): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web: use AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    } else {
      // Native: use SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token));
    }
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
}

/**
 * Retrieve auth token
 */
export async function getAuthToken(): Promise<AuthToken | null> {
  try {
    let tokenStr: string | null = null;

    if (Platform.OS === 'web') {
      tokenStr = await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      tokenStr = await SecureStore.getItemAsync(TOKEN_KEY);
    }

    return tokenStr ? JSON.parse(tokenStr) : null;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
}

/**
 * Store user data
 */
export async function storeUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
  }
}

/**
 * Retrieve stored user
 */
export async function getStoredUser(): Promise<User | null> {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error retrieving user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const user = await getStoredUser();
    return !!(token && user);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Login with email and password
 * (Mock implementation - integrate with your backend)
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    // TODO: Replace with actual API call to your backend
    // const response = await fetch('https://your-api.com/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password }),
    // });
    // const data = await response.json();

    // Mock user creation
    const user: User = {
      id: `user_${Date.now()}`,
      email,
      name: email.split('@')[0],
      createdAt: Date.now(),
    };

    const token: AuthToken = {
      accessToken: `token_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
      expiresIn: 3600,
    };

    await storeUser(user);
    await storeAuthToken(token);

    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Login with OAuth (Google, Apple)
 */
export async function loginWithOAuth(provider: 'google' | 'apple'): Promise<User> {
  try {
    // TODO: Implement OAuth flow using expo-auth-session
    // For now, return mock user
    const user: User = {
      id: `user_${Date.now()}`,
      email: `user_${Date.now()}@${provider}.com`,
      name: `${provider} User`,
      createdAt: Date.now(),
    };

    const token: AuthToken = {
      accessToken: `token_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
      expiresIn: 3600,
    };

    await storeUser(user);
    await storeAuthToken(token);

    return user;
  } catch (error) {
    console.error(`Error logging in with ${provider}:`, error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  try {
    const user = await getStoredUser();
    if (!user) throw new Error('No user logged in');

    const updatedUser = { ...user, ...updates };
    await storeUser(updatedUser);

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Refresh auth token
 */
export async function refreshAuthToken(): Promise<AuthToken | null> {
  try {
    const token = await getAuthToken();
    if (!token || !token.refreshToken) return null;

    // TODO: Replace with actual API call to your backend
    // const response = await fetch('https://your-api.com/auth/refresh', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ refreshToken: token.refreshToken }),
    // });
    // const newToken = await response.json();

    // Mock token refresh
    const newToken: AuthToken = {
      accessToken: `token_${Date.now()}`,
      refreshToken: `refresh_${Date.now()}`,
      expiresIn: 3600,
    };

    await storeAuthToken(newToken);
    return newToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<void> {
  try {
    // TODO: Replace with actual API call to your backend
    // await fetch('https://your-api.com/auth/delete', {
    //   method: 'DELETE',
    //   headers: { Authorization: `Bearer ${token.accessToken}` },
    // });

    await logout();
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

/**
 * Verify email
 */
export async function verifyEmail(email: string, code: string): Promise<boolean> {
  try {
    // TODO: Replace with actual API call to your backend
    // const response = await fetch('https://your-api.com/auth/verify-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, code }),
    // });
    // return response.ok;

    return true; // Mock
  } catch (error) {
    console.error('Error verifying email:', error);
    return false;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    // TODO: Replace with actual API call to your backend
    // const response = await fetch('https://your-api.com/auth/reset-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email }),
    // });
    // return response.ok;

    return true; // Mock
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return false;
  }
}

export default {
  storeAuthToken,
  getAuthToken,
  storeUser,
  getStoredUser,
  isAuthenticated,
  loginWithEmail,
  loginWithOAuth,
  logout,
  updateUserProfile,
  refreshAuthToken,
  deleteAccount,
  verifyEmail,
  requestPasswordReset,
};
