import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  username: string;
  userType: 'normal' | 'artistic_collective';
  subscriptionStatus?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/check');
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Silently handle auth check failures to prevent error overlay
      // This is expected behavior when user is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("auth_token", data.token);
        setUser(data.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      // Clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem('posterTheMoment_verifiedEmail');
      // Force page refresh with cache busting to clear any cached state
      window.location.href = '/?t=' + Date.now();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if logout request fails
      setUser(null);
      localStorage.removeItem('posterTheMoment_verifiedEmail');
      window.location.href = '/?t=' + Date.now();
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Add page visibility listener to check auth when user returns via back button
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-check authentication when page becomes visible
        checkAuth();
      }
    };
    
    const handlePageShow = () => {
      // Re-check authentication when page is shown (back button navigation)
      checkAuth();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!localStorage.getItem('auth_token'),
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}