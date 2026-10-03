import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civicflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('civicflow_token');
      if (storedToken) {
        try {
          const res = await getMe();
          if (res && res.success) {
            setUser(res.data);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res && res.success) {
      const { token: authToken, user: userData } = res.data;
      localStorage.setItem('civicflow_token', authToken);
      setToken(authToken);
      setUser(userData);
      return userData;
    } else {
      throw new Error(res?.message || 'Login failed.');
    }
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    if (res && res.success) {
      // Auto-login after successful registration
      return await login(email, password);
    } else {
      throw new Error(res?.message || 'Registration failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('civicflow_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
