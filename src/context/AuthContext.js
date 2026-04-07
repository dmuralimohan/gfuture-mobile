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

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      const { data } = await authService.login(email, password);
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signup = useCallback(async (userData) => {
    setAuthLoading(true);
    try {
      const { data } = await authService.signup(userData);
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Signup failed',
      };
    } finally {
      setAuthLoading(false);
    }
  }, []);

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
