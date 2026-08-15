import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { syntheticLoginEmail } from "@/lib/supabase/env";
import { sessionFromUser } from "@/lib/auth-session";

/**
 * Login with username / entry number + password.
 * Resolves identifier → synthetic auth email via RPC, then signInWithPassword.
 * Bootstrap admin works once seeded (username admin, password from ADMIN_PASSWORD).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    entryNumber?: string;
    email?: string;
    password?: string;
  };
  const id = String(body.entryNumber || body.email || "").trim();
  const password = String(body.password || "");
  if (!id || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Prefer DB resolver (only returns email when auth_user_id is set)
  const { data: resolved } = await supabase.rpc("resolve_login_email", {
    identifier: id,
  });

  const ADMIN_USER = (process.env.ADMIN_USER || "admin").toLowerCase();
  const BLOGGER_USER = (process.env.BLOGGER_USER || "blogger").toLowerCase();
  const idLower = id.toLowerCase();

  const email =
    (typeof resolved === "string" && resolved) ||
    // Bootstrap accounts always map to synthetic emails
    (idLower === ADMIN_USER
      ? syntheticLoginEmail(ADMIN_USER)
      : idLower === BLOGGER_USER
        ? syntheticLoginEmail(BLOGGER_USER)
        : null);

  if (!email) {
    return NextResponse.json({ error: "You're not a member" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: "You're not a member" }, { status: 401 });
  }

  const session = await sessionFromUser(data.user);

  return NextResponse.json({
    memberSlug: session.memberSlug,
    level: session.level,
    name: session.name,
    avatar: session.avatar ?? "",
    email: data.user.email ?? email,
  });
}
