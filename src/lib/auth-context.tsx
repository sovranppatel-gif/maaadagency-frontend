"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { http, ApiError } from "./http";
import { clearAuth, getAccessToken, portalForPath, setAccessToken, type AuthPortal } from "./auth-storage";
import type { AdminUser } from "./types";

interface LoginResponse {
  user: AdminUser;
  accessToken: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  /** true while the current portal's session check (refresh + /me) is in flight. */
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

function portalForRole(role: AdminUser["role"]): AuthPortal {
  return role === "EMPLOYEE" ? "employee" : "admin";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const portal = portalForPath(pathname);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [bootstrappedPortal, setBootstrappedPortal] = useState<AuthPortal | null>(null);

  // Re-bootstrap whenever switching between /master-admin/* and /employee/* so each
  // portal resolves only its own access token and httpOnly refresh cookie.
  useEffect(() => {
    let cancelled = false;

    async function restoreFromRefresh() {
      const refreshed = await http.post<{ accessToken: string; user: AdminUser }>(
        "/auth/refresh",
        undefined,
        { skipAuthRetry: true, portal }
      );
      if (cancelled) return;
      const targetPortal = portalForRole(refreshed.user.role);
      setAccessToken(refreshed.accessToken, targetPortal);
      setUser(targetPortal === portal ? refreshed.user : null);
    }

    async function bootstrap() {
      try {
        if (!getAccessToken(portal)) {
          await restoreFromRefresh();
          return;
        }

        try {
          const me = await http.get<AdminUser>("/auth/me", { skipAuthRetry: true, portal });
          if (cancelled) return;
          if (portalForRole(me.role) !== portal) {
            // Token stored under this portal slot belongs to the other role: clear & re-sync.
            clearAuth(portal);
            await restoreFromRefresh();
            return;
          }
          setUser(me);
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          clearAuth(portal);
          await restoreFromRefresh();
        }
      } catch {
        if (!cancelled) {
          clearAuth(portal);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrappedPortal(portal);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [portal]);

  const login = useCallback(async (email: string, password: string): Promise<AdminUser> => {
    try {
      const res = await http.post<LoginResponse>(
        "/auth/login",
        { email, password },
        { skipAuthRetry: true, portal }
      );
      const targetPortal = portalForRole(res.user.role);
      setAccessToken(res.accessToken, targetPortal);
      setUser(res.user);
      setBootstrappedPortal(targetPortal);
      return res.user;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, "Could not reach the server. Is the backend running?");
    }
  }, [portal]);

  const logout = useCallback(async () => {
    try {
      await http.post("/auth/logout", undefined, { skipAuthRetry: true, portal });
    } catch {
      // Best-effort: clear only this portal's local session.
    }
    clearAuth(portal);
    setUser(null);
    setBootstrappedPortal(portal);
  }, [portal]);

  const userMatchesPortal = user !== null && portalForRole(user.role) === portal;
  const effectiveUser = userMatchesPortal ? user : null;
  const effectiveLoading = bootstrappedPortal !== portal;

  return (
    <AuthContext.Provider value={{ user: effectiveUser, loading: effectiveLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
