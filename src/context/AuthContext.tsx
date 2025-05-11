import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getProfile();
          setUser(userData);
        } catch {
          // If there's an error loading the profile, remove the token
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string, username: string) => {
    try {
      const data = await authAPI.login({ email, password, username });
      localStorage.setItem('token', data.token);
      setUser(data);
      setError(null);
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 