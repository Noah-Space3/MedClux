'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/api';
import { Admin, Doctor, Patient, User, UserRole } from '@/types/domain';
import { useQueryClient } from '@tanstack/react-query';

type AnyUser = User | Patient | Doctor | Admin;

interface AuthContextValue {
  user: AnyUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AnyUser>;
  loginWithDemoRole: (role: UserRole) => Promise<AnyUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AnyUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const refreshSession = useCallback(async () => {
    try {
      const session = await authService.getCurrentSession();
      setUser(session?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: loggedInUser } = await authService.login(email, password);
      setUser(loggedInUser);
      queryClient.invalidateQueries();
      return loggedInUser;
    },
    [queryClient]
  );

  const loginWithDemoRole = useCallback(
    async (role: UserRole) => {
      const { user: loggedInUser } = await authService.loginWithDemoRole(role);
      setUser(loggedInUser);
      queryClient.invalidateQueries();
      return loggedInUser;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        loginWithDemoRole,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
