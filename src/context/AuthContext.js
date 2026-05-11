import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Strip large fields (e.g. base64 profile_picture) before persisting to SecureStore
// SecureStore has a ~2KB value limit on Android
function userForStorage(u) {
  if (!u) return null;
  const { profile_picture, ...rest } = u;
  return rest;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const isAuthenticated = !!user;
  const isProvider = user?.role === 'provider';
  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';

  // Load user from SecureStore on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('user');
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist user to SecureStore (without large fields)
  useEffect(() => {
    (async () => {
      try {
        if (user) {
          await SecureStore.setItemAsync('user', JSON.stringify(userForStorage(user)));
        } else {
          await SecureStore.deleteItemAsync('user');
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [user]);

  // Persist auth tokens, but do not fail login if device storage temporarily fails.
  const persistTokens = useCallback(async (accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      return null;
    } catch (e) {
      return e;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      const { data } = await authService.login(email, password);
      const tokenPersistError = await persistTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return {
        success: true,
        user: data.user,
        warning: tokenPersistError
          ? 'Logged in, but secure storage failed. Session may not persist after app restart.'
          : null,
      };
    } catch (err) {
      const fallbackMessage =
        err?.response?.data?.error ||
        err?.response?.statusText ||
        err?.message ||
        'Login failed';
      return {
        success: false,
        message: err?.response?.data?.message || fallbackMessage,
      };
    } finally {
      setAuthLoading(false);
    }
  }, [persistTokens]);

  const signup = useCallback(async (userData) => {
    setAuthLoading(true);
    try {
      const { data } = await authService.signup(userData);
      const tokenPersistError = await persistTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return {
        success: true,
        user: data.user,
        warning: tokenPersistError
          ? 'Signed up, but secure storage failed. Session may not persist after app restart.'
          : null,
      };
    } catch (err) {
      const fallbackMessage =
        err?.response?.data?.error ||
        err?.response?.statusText ||
        err?.message ||
        'Signup failed';
      return {
        success: false,
        message: err?.response?.data?.message || fallbackMessage,
      };
    } finally {
      setAuthLoading(false);
    }
  }, [persistTokens]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // ignore
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    setAuthLoading(true);
    try {
      const { data } = await authService.updateProfile(profileData);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Update failed',
      };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={ {
        user,
        loading,
        authLoading,
        isAuthenticated,
        isProvider,
        isCustomer,
        isAdmin,
        login,
        signup,
        logout,
        updateProfile,
      } }
    >
      { children }
    </AuthContext.Provider>
  );
};
