// Portal-scoped access token storage.
// Admin and Employee sessions use independent keys in memory + sessionStorage,
// paired with separate HttpOnly refresh cookies (adminRefreshToken vs empRefreshToken)
// so Master Admin and Employee can both stay logged in inside the same browser.

export type AuthPortal = "admin" | "employee";

const STORAGE_KEYS: Record<AuthPortal, string> = {
  admin: "maa_admin_access_token",
  employee: "maa_employee_access_token",
};

const inMemoryTokens: Record<AuthPortal, string | null> = {
  admin: null,
  employee: null,
};

/** Resolves the active portal from an app pathname (or current browser URL). */
export function portalForPath(pathname?: string | null): AuthPortal {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/employee") ? "employee" : "admin";
}

export function getAccessToken(portal: AuthPortal = portalForPath()): string | null {
  if (inMemoryTokens[portal]) return inMemoryTokens[portal];
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(STORAGE_KEYS[portal]);
  inMemoryTokens[portal] = stored;
  return stored;
}

export function setAccessToken(token: string, portal: AuthPortal = portalForPath()) {
  inMemoryTokens[portal] = token;
  if (typeof window !== "undefined") window.sessionStorage.setItem(STORAGE_KEYS[portal], token);
}

export function clearAuth(portal: AuthPortal = portalForPath()) {
  inMemoryTokens[portal] = null;
  if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEYS[portal]);
}
