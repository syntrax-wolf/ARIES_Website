import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import {
  devclubRedirectUri,
  getDevclubConfig,
  isDevclubConfigured,
  kerberosFromClaims,
  oauthErrorDetail,
  oidcCookieName,
  parseOidcCookie,
} from "@/lib/devclub";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { syntheticLoginEmail } from "@/lib/supabase/env";

function failRedirect(req: NextRequest, message: string) {
  const url = new URL("/admin", req.url);
  url.searchParams.set("error", message);
  const res = NextResponse.redirect(url);
  res.cookies.delete(oidcCookieName());
  return res;
}

export async function GET(req: NextRequest) {
  if (!isDevclubConfigured()) {
    return failRedirect(req, "DevClub OAuth is not configured");
  }

  const url = new URL(req.url);
  const sess = parseOidcCookie(req.cookies.get(oidcCookieName())?.value);
  if (!sess) {
    return failRedirect(req, "Sign-in session expired. Try again.");
  }

  let tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers;
  try {
    const cfg = await getDevclubConfig();
    // Pin to the same redirect_uri used at authorize — openid-client otherwise
    // derives it from req.url, which can disagree with the registered URI.
    const callbackUrl = new URL(sess.redirectUri);
    callbackUrl.search = url.search;
    tokens = await client.authorizationCodeGrant(cfg, callbackUrl, {
      pkceCodeVerifier: sess.codeVerifier,
      expectedState: sess.state,
    });
  } catch (err) {
    console.error("[devclub callback] token exchange failed", err);
    return failRedirect(req, `Could not complete IIT Delhi sign-in (${oauthErrorDetail(err)})`);
  }

  const claims = (tokens.claims() ?? {}) as Record<string, unknown>;
  const cfg = await getDevclubConfig();
  let userinfo: Record<string, unknown> | null = null;
  if (claims.sub && tokens.access_token) {
    try {
      userinfo = (await client.fetchUserInfo(
        cfg,
        tokens.access_token,
        String(claims.sub),
      )) as Record<string, unknown>;
    } catch {
      userinfo = null;
    }
  }

  const identity = kerberosFromClaims(claims, userinfo);
  const idOk = (v: string) => /^[a-z0-9._-]+$/.test(v);
  if (identity.kerberos && !idOk(identity.kerberos)) identity.kerberos = "";
  if (identity.entryNumber && !idOk(identity.entryNumber)) identity.entryNumber = "";
  if (!identity.sub || (!identity.kerberos && !identity.entryNumber && !identity.email)) {
    return failRedirect(req, "DevClub did not return a Kerberos ID");
  }

  const admin = createSupabaseServiceClient();
  const identifiers = [identity.kerberos, identity.entryNumber].filter(Boolean);
  type MemberRow = {
    slug: string;
    level: string;
    email: string | null;
    auth_user_id: string | null;
    oauth_sub: string | null;
    data: { name?: string } | null;
  };
  let member: MemberRow | null = null;

  for (const id of identifiers) {
    const { data } = await admin
      .from("members")
      .select("slug, level, email, auth_user_id, oauth_sub, data")
      .or(`entry_number.eq.${id},username.eq.${id}`)
      .maybeSingle();
    if (data) {
      member = data as MemberRow;
      break;
    }
  }

  if (!member && identity.email) {
    const { data } = await admin
      .from("members")
      .select("slug, level, email, auth_user_id, oauth_sub, data")
      .eq("email", identity.email)
      .maybeSingle();
    member = (data as MemberRow | null) ?? null;
  }

  if (!member) {
    return failRedirect(req, "No ARIES profile matches this Kerberos ID. Ask OC to add you to the roster.");
  }
  if (member.oauth_sub && member.oauth_sub !== identity.sub) {
    return failRedirect(req, "This club profile is already linked to a different IITD account.");
  }

  const email =
    (member.email && member.email.includes("@") ? member.email : identity.email) ||
    syntheticLoginEmail(identity.kerberos || identity.entryNumber || member.slug);

  let userId = member.auth_user_id;
  if (!userId) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: randomBytes(32).toString("hex"),
      email_confirm: true,
      app_metadata: { level: member.level, member_slug: member.slug, oauth_sub: identity.sub },
      user_metadata: { name: member.data?.name || identity.name || member.slug },
    });
    if (cErr || !created.user) {
      return failRedirect(req, cErr?.message || "Could not create club login");
    }
    userId = created.user.id;
  } else {
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { level: member.level, member_slug: member.slug, oauth_sub: identity.sub },
    });
  }

  await admin
    .from("members")
    .update({
      auth_user_id: userId,
      oauth_sub: identity.sub,
      email,
      ...(identity.kerberos ? { entry_number: identity.kerberos, username: identity.kerberos } : {}),
    })
    .eq("slug", member.slug);

  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hash = link?.properties?.hashed_token;
  if (linkErr || !hash) {
    return failRedirect(req, linkErr?.message || "Could not start club session");
  }

  const supabase = await createSupabaseServerClient();
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: hash,
  });
  if (verifyErr) {
    return failRedirect(req, verifyErr.message || "Could not start club session");
  }

  const next = NextResponse.redirect(new URL("/account", req.url));
  next.cookies.delete(oidcCookieName());
  return next;
}
