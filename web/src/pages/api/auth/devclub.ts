export const prerender = false;

import * as client from "openid-client";
import {
  DEVCLUB_SCOPE,
  devclubRedirectUri,
  getDevclubConfig,
  isDevclubConfigured,
  oidcCookieName,
  oidcCookieOptions,
} from "../../../lib/gate/devclub";

export async function GET({ request }: { request: Request }) {
  if (!isDevclubConfigured()) {
    return Response.json(
      { error: "DevClub OAuth is not configured. Set DEVCLUB_CLIENT_ID and DEVCLUB_CLIENT_SECRET." },
      { status: 503 },
    );
  }

  const cfg = await getDevclubConfig();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const redirectUri = devclubRedirectUri(request.url);

  const redirectTo = client.buildAuthorizationUrl(cfg, {
    redirect_uri: redirectUri,
    scope: DEVCLUB_SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  const opts = oidcCookieOptions();
  const cookie = `${oidcCookieName()}=${encodeURIComponent(JSON.stringify({ codeVerifier, state, redirectUri }))}; Path=${opts.path}; HttpOnly; SameSite=Lax; Max-Age=${opts.maxAge}`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo.href,
      "Set-Cookie": cookie,
    },
  });
}
