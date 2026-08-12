'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Helper to safely parse API responses (JSON or text fallback)
async function parseApiResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = {
      success: false,
      message: text.includes('Internal Server Error')
        ? 'Server encountered an internal error (500). Please check backend service.'
        : `Server Error (${res.status}): ${text.substring(0, 100)}`,
    };
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('maintainiq_token');
    const savedUser = localStorage.getItem('maintainiq_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        verifyUserToken(savedToken);
      } catch (err) {
        console.error('Failed to parse saved session:', err);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token against backend
  const verifyUserToken = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await parseApiResponse(res);

      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('maintainiq_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error verifying user session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseApiResponse(res);

    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Login failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('maintainiq_token', data.token);
    localStorage.setItem('maintainiq_user', JSON.stringify(data.user));
    return data.user;
  };

  // Register handler
  const register = async (name, email, password, role) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await parseApiResponse(res);

    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Registration failed');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('maintainiq_token', data.token);
    localStorage.setItem('maintainiq_user', JSON.stringify(data.user));
    return data.user;
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('maintainiq_token');
    localStorage.removeItem('maintainiq_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
