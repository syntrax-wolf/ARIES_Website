/**
 * Auth API client. Uses same-origin Next.js routes (/api/auth/*) backed by Supabase.
 */

const AUTH_BASE = "/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${AUTH_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const login = (entryNumber: string, password: string) =>
  apiFetch<{
    memberSlug: string;
    level: string;
    name: string;
    email: string;
    avatar?: string;
  }>("/auth/login", { method: "POST", body: JSON.stringify({ entryNumber, password }) });

export const me = () =>
  apiFetch<{
    memberSlug: string;
    level: string;
    name: string;
    email: string;
    avatar?: string;
  }>("/auth/me", {});

export const logout = () => apiFetch("/auth/logout", { method: "POST" });
