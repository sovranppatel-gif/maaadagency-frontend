// Shared helpers for the mock API layer. Every function in lib/api/* is
// async and awaits `delay()` to simulate network latency — this keeps the
// call sites (React components) identical to what they'll look like once
// these are swapped for real `fetch("/api/...")` calls against a Node/Express
// + MongoDB backend.

export function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
