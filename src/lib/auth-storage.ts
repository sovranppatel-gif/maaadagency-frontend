// Access token storage. Kept in memory + sessionStorage (not localStorage):
// an access token is short-lived (15m) and this avoids leaving a long-lived
// credential sitting in browser storage indefinitely. The refresh token
// itself never touches JS — it lives in an httpOnly cookie set by the API.

const STORAGE_KEY = "maa_admin_access_token";

let inMemoryToken: string | null = null;

export function getAccessToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window === "undefined") return null;
  inMemoryToken = window.sessionStorage.getItem(STORAGE_KEY);
  return inMemoryToken;
}

export function setAccessToken(token: string) {
  inMemoryToken = token;
  if (typeof window !== "undefined") window.sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearAuth() {
  inMemoryToken = null;
  if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEY);
}
