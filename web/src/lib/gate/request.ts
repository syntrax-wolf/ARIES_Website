import { readSessionCookie, SESSION_COOKIE, type GateSession } from "./gate";
import { runtimeVar } from "../cloudflare-env";

export function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function signingSecret(): string {
  return runtimeVar("SESSION_SECRET") || runtimeVar("ADMIN_PASSWORD");
}

export function sessionFromRequest(request: Request): GateSession | null {
  return readSessionCookie(
    cookieValue(request.headers.get("cookie"), SESSION_COOKIE),
    signingSecret(),
  );
}
