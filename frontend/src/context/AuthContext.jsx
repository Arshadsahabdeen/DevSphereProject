import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      // backend returns user fields + token at top-level (based on your backend)
      const { token: newToken, ...userData } = response.data;

      if (!newToken) {
        // fallback: maybe backend returns { user: {...}, token: '...' }
        const altToken = response.data?.user?.token || response.data?.token;
        const altUser = response.data?.user || userData;
        if (altToken) {
          localStorage.setItem('token', altToken);
          localStorage.setItem('user', JSON.stringify(altUser));
          setToken(altToken);
          setUser(altUser);
          socketService.connect(altToken);
          return { success: true };
        }
        return { success: false, error: 'Invalid login response' };
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      socketService.connect(newToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, ...rest } = response.data;

      if (!newToken) {
        // handle alternate response shape
        const altToken = response.data?.user?.token || response.data?.token;
        const altUser = response.data?.user || rest;
        if (altToken) {
          localStorage.setItem('token', altToken);
          localStorage.setItem('user', JSON.stringify(altUser));
          setToken(altToken);
          setUser(altUser);
          socketService.connect(altToken);
          return { success: true };
        }
        return { success: false, error: 'Invalid register response' };
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(rest));
      setToken(newToken);
      setUser(rest);
      socketService.connect(newToken);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    socketService.disconnect();
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
