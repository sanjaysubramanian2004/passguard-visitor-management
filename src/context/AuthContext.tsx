import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAdmin: boolean;
  isReceptionist: boolean;
  isEmployee: boolean;
  isLoading: boolean;
  switchableUsers: User[];
  login: (email?: string, password?: string, role?: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (user: User) => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'passguard_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [switchableUsers, setSwitchableUsers] = useState<User[]>([]);
  const { success, error } = useToast();

  const refreshUsers = useCallback(async () => {
    try {
      const res = await api.getSwitchableUsers();
      setSwitchableUsers(res.users || []);
    } catch (e) {
      console.error('Failed to load switchable users', e);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.getSwitchableUsers();
        const availableUsers = res.users || [];
        setSwitchableUsers(availableUsers);

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const stillExists = availableUsers.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
            if (stillExists) {
              setUser(stillExists);
            } else {
              setUser(null);
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            localStorage.removeItem(STORAGE_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUsers]);

  const login = async (email?: string, password?: string, role?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.login(email, password, role);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        success('Logged In Successfully', `Welcome, ${res.user.name} (${res.user.role})`);
        return true;
      }
      return false;
    } catch (err: any) {
      error('Login Failed', err.message || 'Invalid credentials. Please check your email and password.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    success('Logged Out', 'You have been signed out successfully');
  };

  const switchUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    success('Switched Role', `Now viewing as ${newUser.name} [${newUser.role}]`);
  };

  const role = user?.role || 'RECEPTIONIST';
  const isAdmin = role === 'ADMIN';
  const isReceptionist = role === 'RECEPTIONIST';
  const isEmployee = role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isReceptionist,
        isEmployee,
        isLoading,
        switchableUsers,
        login,
        logout,
        switchUser,
        refreshUsers
      }}
    >
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
