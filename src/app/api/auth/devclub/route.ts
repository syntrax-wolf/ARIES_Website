import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import {
  DEVCLUB_SCOPE,
  devclubRedirectUri,
  getDevclubConfig,
  isDevclubConfigured,
  oidcCookieName,
  oidcCookieOptions,
} from "@/lib/devclub";

export async function GET(req: NextRequest) {
  if (!isDevclubConfigured()) {
    return NextResponse.json(
      { error: "DevClub OAuth is not configured. Set DEVCLUB_CLIENT_ID and DEVCLUB_CLIENT_SECRET." },
      { status: 503 },
    );
  }

  const cfg = await getDevclubConfig();
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const redirectUri = devclubRedirectUri(req.url);

  const redirectTo = client.buildAuthorizationUrl(cfg, {
    redirect_uri: redirectUri,
    scope: DEVCLUB_SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  const res = NextResponse.redirect(redirectTo.href);
  res.cookies.set(
    oidcCookieName(),
    JSON.stringify({ codeVerifier, state, redirectUri }),
    oidcCookieOptions(),
  );
  return res;
}
