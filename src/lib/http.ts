// Thin fetch wrapper for the Master Admin dashboard talking to the real
// Node/Express + MongoDB backend (see /server). Centralises the base URL,
// auth header, JSON envelope handling and 401 -> refresh -> retry flow so
// every lib/api/*.ts file can stay a plain async function.

import { getAccessToken, setAccessToken, clearAuth } from "./auth-storage";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: { message: string; details?: unknown };
}

let refreshPromise: Promise<string | null> | null = null;

/** Exchanges the httpOnly refresh cookie for a new access token. */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as Envelope<{ accessToken: string }>;
        const token = json.data?.accessToken ?? null;
        if (token) setAccessToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the automatic 401 -> refresh -> retry cycle (used by auth calls themselves). */
  skipAuthRetry?: boolean;
  /** Return meta (pagination) alongside data instead of just data. */
  withMeta?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { body, skipAuthRetry, withMeta, headers, ...rest } = options;
  const token = getAccessToken();

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
  });

  // Access token expired mid-session: refresh once and replay the request.
  if (res.status === 401 && !skipAuthRetry && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, true);
    clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      const loginPath = window.location.pathname.startsWith("/employee") ? "/employee/login" : "/master-admin/login";
      window.location.href = loginPath;
    }
  }

  let json: Envelope<T> | null = null;
  try {
    json = res.status === 204 ? null : ((await res.json()) as Envelope<T>);
  } catch {
    json = null;
  }

  if (!res.ok || json?.success === false) {
    const message = json?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, json?.error?.details);
  }

  if (withMeta) {
    return { data: json?.data, meta: json?.meta } as T;
  }
  return json?.data as T;
}

async function requestBlob(
  path: string,
  options: Omit<RequestOptions, "body" | "withMeta"> = {},
  isRetry = false
): Promise<Blob> {
  const { skipAuthRetry, headers, ...rest } = options;
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && !skipAuthRetry && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return requestBlob(path, options, true);
    clearAuth();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      const loginPath = window.location.pathname.startsWith("/employee") ? "/employee/login" : "/master-admin/login";
      window.location.href = loginPath;
    }
  }

  if (!res.ok) {
    let json: Envelope<unknown> | null = null;
    try {
      json = (await res.json()) as Envelope<unknown>;
    } catch {
      json = null;
    }
    throw new ApiError(res.status, json?.error?.message ?? `Request failed (${res.status})`, json?.error?.details);
  }
  return res.blob();
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  getBlob: (path: string, options?: Omit<RequestOptions, "body" | "withMeta">) =>
    requestBlob(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  del: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
};

/** Builds a query string from a filters object, skipping empty/"All" values. */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === "All") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}
