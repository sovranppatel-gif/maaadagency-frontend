"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { http, ApiError } from "./http";
import { getAccessToken, setAccessToken, clearAuth } from "./auth-storage";
import type { AdminUser } from "./types";

interface LoginResponse {
  user: AdminUser;
  accessToken: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  /** true while the initial session check (refresh + /me) is in flight. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load there's no access token yet (it lives in sessionStorage,
  // cleared on tab close) but the httpOnly refresh cookie may still be
  // valid, so silently try to resume the session before showing anything.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (!getAccessToken()) {
          await restoreFromRefresh();
          return;
        }

        try {
          const me = await http.get<AdminUser>("/auth/me", { skipAuthRetry: true });
          if (!cancelled) setUser(me);
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          clearAuth();
          await restoreFromRefresh();
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function restoreFromRefresh() {
      const refreshed = await http.post<{ accessToken: string; user: AdminUser }>(
        "/auth/refresh",
        undefined,
        { skipAuthRetry: true }
      );
      if (cancelled) return;
      setAccessToken(refreshed.accessToken);
      setUser(refreshed.user);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AdminUser> => {
    try {
      const res = await http.post<LoginResponse>("/auth/login", { email, password }, { skipAuthRetry: true });
      setAccessToken(res.accessToken);
      setUser(res.user);
      return res.user;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, "Could not reach the server. Is the backend running?");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await http.post("/auth/logout", undefined, { skipAuthRetry: true });
    } catch {
      // Best-effort: clear local state regardless of network outcome.
    }
    clearAuth();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
