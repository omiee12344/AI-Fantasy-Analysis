import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LoginRequest, RegisterRequest, User } from "../lib/auth";
import { firebaseAuthApi } from "../lib/firebase-auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User["profile"]>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = firebaseAuthApi.onAuthStateChanged((u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login: async (credentials) => {
        const res = await firebaseAuthApi.login(credentials);
        setUser(res.user);
      },
      register: async (userData) => {
        const res = await firebaseAuthApi.register(userData);
        setUser(res.user);
      },
      logout: async () => {
        await firebaseAuthApi.logout();
        setUser(null);
      },
      updateProfile: async (profileData) => {
        const updated = await firebaseAuthApi.updateProfile(profileData);
        setUser(updated);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

