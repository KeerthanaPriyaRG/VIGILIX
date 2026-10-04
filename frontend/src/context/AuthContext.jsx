import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('vigilix_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('vigilix_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If we have a token, verify and refresh user profile from backend
    if (token) {
      authApi.getCurrentUser()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('vigilix_user', JSON.stringify(userData));
        })
        .catch(() => {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('vigilix_token');
          localStorage.removeItem('vigilix_user');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const data = await authApi.login({ username, password });
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('vigilix_token', data.access_token);
    localStorage.setItem('vigilix_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vigilix_token');
    localStorage.removeItem('vigilix_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
