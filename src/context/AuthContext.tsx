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
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkAdminAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Check if admin token exists in localStorage
    const adminToken = localStorage.getItem("admin_auth_token");
    setIsAdmin(!!adminToken);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/check');

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
    } catch (error) {
      // Silently handle auth check failures to prevent error overlay
      // This is expected behavior when user is not authenticated
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminAuth = async () => {
    const adminToken = localStorage.getItem("admin_auth_token");
    if (!adminToken) {
      setIsAdmin(false);
      return;
    }

    try {
      // Try to make a simple admin request to verify the token is still valid
      const response = await apiRequest('GET', '/api/admin/orders?page=1&limit=1');
      if (response.ok) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        localStorage.removeItem("admin_auth_token");
      }
    } catch (error) {
      // If the request fails, the admin token is invalid
      setIsAdmin(false);
      localStorage.removeItem("admin_auth_token");
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
        localStorage.setItem("user", JSON.stringify(data.user));
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

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/admin/login', {
        username,
        password,
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("admin_auth_token", data.sessionToken);
        setIsAdmin(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const adminLogout = async () => {
    try {
      const response = await apiRequest('POST', '/api/admin/logout');
      if (!response.ok) {
        if (response.status === 401) {
          // setLocation("/admin/login");
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch orders");
      }

      // Clear local storage and admin state
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem('posterTheMoment_verifiedEmail');
      setIsAdmin(false);
      // Force page refresh with cache busting to clear any cached state
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if logout request fails
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem('posterTheMoment_verifiedEmail');
      setIsAdmin(false);
      window.location.href = '/?t=' + Date.now();
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      // Clear local storage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
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
    const initializeAuth = async () => {
      await Promise.all([
        checkAuth(),
        checkAdminAuth()
      ]);
    };

    initializeAuth();

    // Add page visibility listener to check auth when user returns via back button
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Re-check authentication when page becomes visible
        checkAuth();
        checkAdminAuth();
      }
    };

    const handlePageShow = () => {
      // Re-check authentication when page is shown (back button navigation)
      checkAuth();
      checkAdminAuth();
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
    isAdmin,
    login,
    adminLogin,
    logout,
    adminLogout,
    checkAuth,
    checkAdminAuth,
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