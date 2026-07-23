// ===========================
// Auth Context - Global Authentication State
// ===========================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  department?: string;
  profileImage?: string;
  enrollmentNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('quizai_user');
    const storedToken = localStorage.getItem('quizai_token');

    if (storedUser && storedToken) {
      api.setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      api.get<any>('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('quizai_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('quizai_user');
          localStorage.removeItem('quizai_token');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<any>('/auth/login', { email, password });
    const { user, accessToken } = res.data;
    localStorage.setItem('quizai_token', accessToken);
    localStorage.setItem('quizai_user', JSON.stringify(user));
    api.setToken(accessToken);
    setUser(user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.post<any>('/auth/google', { idToken });
    const { user, accessToken } = res.data;
    localStorage.setItem('quizai_token', accessToken);
    localStorage.setItem('quizai_user', JSON.stringify(user));
    api.setToken(accessToken);
    setUser(user);
  };

  const register = async (data: any) => {
    const res = await api.post<any>('/auth/register', data);
    const { user, accessToken } = res.data;
    localStorage.setItem('quizai_token', accessToken);
    localStorage.setItem('quizai_user', JSON.stringify(user));
    api.setToken(accessToken);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('quizai_token');
    localStorage.removeItem('quizai_user');
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
