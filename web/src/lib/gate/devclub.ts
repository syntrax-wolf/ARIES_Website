import * as client from "openid-client";

export const DEVCLUB_DISCOVERY_URL =
  "https://auth.devclub.in/api/oauth/.well-known/openid-configuration";
export const DEVCLUB_SCOPE = "openid profile email kerberos entry_number";
const COOKIE = "dc_oidc";

export function isDevclubConfigured() {
  return Boolean(process.env.DEVCLUB_CLIENT_ID?.trim() && process.env.DEVCLUB_CLIENT_SECRET?.trim());
}

export function devclubRedirectUri(requestUrl: string) {
  const fromEnv = process.env.DEVCLUB_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  const url = new URL(requestUrl);
  return `${url.origin}/api/auth/callback/devclub`;
}

export async function getDevclubConfig() {
  const clientId = process.env.DEVCLUB_CLIENT_ID?.trim();
  const clientSecret = process.env.DEVCLUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("DevClub OAuth is not configured (DEVCLUB_CLIENT_ID / DEVCLUB_CLIENT_SECRET)");
  }
  return client.discovery(new URL(DEVCLUB_DISCOVERY_URL), clientId, clientSecret);
}

export function oidcCookieName() {
  return COOKIE;
}

export function oidcCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60,
  };
}

export type OidcCookie = {
  codeVerifier: string;
  state: string;
  redirectUri: string;
};

export function parseOidcCookie(raw: string | undefined): OidcCookie | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OidcCookie;
    if (!parsed.codeVerifier || !parsed.state || !parsed.redirectUri) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function oauthErrorDetail(err: unknown): string {
  if (!err || typeof err !== "object") return "unknown";
  const e = err as { error?: string; error_description?: string; message?: string; code?: string };
  if (typeof e.error === "string") {
    return e.error_description ? `${e.error}: ${e.error_description}` : e.error;
  }
  if (typeof e.code === "string") return e.code;
  if (typeof e.message === "string") return e.message.slice(0, 180);
  return "unknown";
}

export function kerberosFromClaims(claims: Record<string, unknown>, userinfo: Record<string, unknown> | null) {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = userinfo?.[key] ?? claims[key];
      if (typeof v === "string" && v.trim()) return v.trim().toLowerCase().replace(/@.*$/, "");
    }
    return "";
  };
  return {
    kerberos: pick("kerberos"),
    entryNumber: pick("entry_number", "entryNumber"),
    email: String(userinfo?.email || claims.email || "").trim().toLowerCase(),
    name: String(userinfo?.name || claims.name || "").trim(),
    sub: String(claims.sub || userinfo?.sub || "").trim(),
  };
}
