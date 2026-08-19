import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "aries_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type GateSession = {
  kind: "kerberos" | "admin";
  kerberos?: string;
  exp: number;
};

export type GateDecision =
  | { ok: true; session: Omit<GateSession, "exp"> }
  | { ok: false; error: string };

export function decideKerberosGate(kerberos: string, allowlist: string[]): GateDecision {
  const id = kerberos.trim().toLowerCase();
  if (!id) return { ok: false, error: "DevClub did not return a Kerberos ID" };
  const allowed = new Set(allowlist.map((k) => k.trim().toLowerCase()));
  if (!allowed.has(id)) {
    return { ok: false, error: "This Kerberos ID is not on the Allowlist" };
  }
  return { ok: true, session: { kind: "kerberos", kerberos: id } };
}

export function decideAdminGate(
  identifier: string,
  password: string,
  secret: string,
  adminUser = "admin",
): GateDecision {
  const id = identifier.trim().toLowerCase();
  if (!secret || !passwordEqual(password, secret) || id !== adminUser.trim().toLowerCase()) {
    return { ok: false, error: "Invalid admin credentials" };
  }
  return { ok: true, session: { kind: "admin" } };
}

export function decideSignup(): GateDecision {
  return { ok: false, error: "There is no signup. Sign in with IIT Delhi or the Admin password." };
}

export function mintSessionCookie(session: Omit<GateSession, "exp">, signingSecret: string): string {
  const payload: GateSession = { ...session, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(body, signingSecret);
  return `${body}.${sig}`;
}

export function readSessionCookie(raw: string | undefined, signingSecret: string): GateSession | null {
  if (!raw || !signingSecret) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(body, signingSecret);
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as GateSession;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.kind !== "kerberos" && payload.kind !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieHeader(value: string): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function passwordEqual(given: string, secret: string) {
  const left = Buffer.from(given);
  const right = Buffer.from(secret);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
