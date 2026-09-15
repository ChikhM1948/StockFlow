import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthToken, saveAuthToken } from '@/api/client';
import * as authApi from '@/api/auth';
import { Brand, User } from '@/api/types';

interface AuthContextValue {
  user: User | null;
  brand: Brand | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  onboard: (payload: { tokenId: string; name: string; email: string; password: string }) => Promise<User>;
  startTrial: (payload: {
    companyName: string;
    name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  activateSubscription: (tokenId: string) => Promise<Brand>;
  logout: () => Promise<void>;
  setBrand: (brand: Brand) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [brand, setBrandState] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await authApi.me();
        setUser(data.user);
        setBrandState(data.brand);
      } catch {
        // pas de session valide : on reste déconnecté, pas d'erreur à afficher
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    await saveAuthToken(data.authToken);
    setUser(data.user);
    const me = await authApi.me();
    setBrandState(me.brand);
    return data.user;
  };

  const onboard = async (payload: {
    tokenId: string;
    name: string;
    email: string;
    password: string;
  }) => {
    const data = await authApi.onboard(payload);
    await saveAuthToken(data.authToken);
    setUser(data.user);
    setBrandState(data.brand);
    return data.user;
  };

  const startTrial = async (payload: {
    companyName: string;
    name: string;
    email: string;
    password: string;
  }) => {
    const data = await authApi.startTrial(payload);
    await saveAuthToken(data.authToken);
    setUser(data.user);
    setBrandState(data.brand);
    return data.user;
  };

  const activateSubscription = async (tokenId: string) => {
    const data = await authApi.activateSubscription(tokenId);
    setBrandState(data.brand);
    return data.brand;
  };

  const logout = async () => {
    await clearAuthToken();
    setUser(null);
    setBrandState(null);
  };

  const value = useMemo(
    () => ({
      user,
      brand,
      isLoading,
      isAuthenticated: !!user,
      login,
      onboard,
      startTrial,
      activateSubscription,
      logout,
      setBrand: setBrandState,
    }),
    [user, brand, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  return ctx;
}
