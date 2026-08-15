"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, me } from "@/lib/api";
import { levelToUiRole, type UiRole } from "@/lib/roles";

export interface AuthSession {
  memberSlug: string;
  level: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  session: AuthSession | null;
  role: UiRole;
  loading: boolean;
  signIn: (entryNumber: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  role: "viewer",
  loading: true,
  signIn: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signOut: async () => {},
  refreshSession: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data = (await me()) as AuthSession;
      setSession(data);
      return data;
    } catch {
      setSession(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const signIn = async (entryNumber: string, password: string) => {
    const data = (await apiLogin(entryNumber, password)) as AuthSession;
    setSession(data);
    return data;
  };

  const signOut = async () => {
    await apiLogout().catch(() => {});
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role: session ? levelToUiRole(session.level) : "viewer",
        loading,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
