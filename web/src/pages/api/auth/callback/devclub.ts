export const prerender = false;

import * as client from "openid-client";
import {
  getDevclubConfig,
  isDevclubConfigured,
  kerberosFromClaims,
  oauthErrorDetail,
  oidcCookieName,
  parseOidcCookie,
} from "../../../../lib/gate/devclub";
import { documentDbFromLocals } from "../../../../lib/gate/runtime";
import {
  decideKerberosGate,
  mintSessionCookie,
  sessionCookieHeader,
} from "../../../../lib/gate/gate";

function fail(request: Request, message: string) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("error", message);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": `${oidcCookieName()}=; Path=/; HttpOnly; Max-Age=0`,
    },
  });
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function GET({ request, locals }: { request: Request; locals: unknown }) {
  if (!isDevclubConfigured()) {
    return fail(request, "DevClub OAuth is not configured");
  }

  const url = new URL(request.url);
  const sess = parseOidcCookie(readCookie(request, oidcCookieName()));
  if (!sess) {
    return fail(request, "Sign-in session expired. Try again.");
  }

  let tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers;
  try {
    const cfg = await getDevclubConfig();
    const callbackUrl = new URL(sess.redirectUri);
    callbackUrl.search = url.search;
    tokens = await client.authorizationCodeGrant(cfg, callbackUrl, {
      pkceCodeVerifier: sess.codeVerifier,
      expectedState: sess.state,
    });
  } catch (err) {
    return fail(request, `Could not complete IIT Delhi sign-in (${oauthErrorDetail(err)})`);
  }

  const claims = (tokens.claims() ?? {}) as Record<string, unknown>;
  const cfg = await getDevclubConfig();
  let userinfo: Record<string, unknown> | null = null;
  if (claims.sub && tokens.access_token) {
    try {
      userinfo = (await client.fetchUserInfo(cfg, tokens.access_token, String(claims.sub))) as Record<
        string,
        unknown
      >;
    } catch {
      userinfo = null;
    }
  }

  const identity = kerberosFromClaims(claims, userinfo);
  const kerberos = identity.kerberos || identity.entryNumber;
  if (!kerberos) {
    return fail(request, "DevClub did not return a Kerberos ID");
  }

  const db = await documentDbFromLocals(locals);
  const decision = decideKerberosGate(kerberos, await db.listAllowlist());
  if (!decision.ok) {
    return fail(request, decision.error);
  }

  const signing = process.env.SESSION_SECRET ?? "";
  if (!signing) {
    return fail(request, "SESSION_SECRET is not configured");
  }

  const cookie = mintSessionCookie(decision.session, signing);
  const headers = new Headers({ Location: new URL("/account", request.url).toString() });
  headers.append("Set-Cookie", sessionCookieHeader(cookie));
  headers.append("Set-Cookie", `${oidcCookieName()}=; Path=/; HttpOnly; Max-Age=0`);
  return new Response(null, { status: 302, headers });
}
