import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Change password for the signed-in user.
 * Verifies current password, then updates to the new one.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 },
    );
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify current password with a fresh client (don't disturb the cookie session)
  const verifier = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyErr } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message || "Could not update password" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
