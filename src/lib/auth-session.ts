import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export type SessionInfo = {
  user: { id: string; email?: string };
  level: string;
  memberSlug: string;
  name: string;
  email: string;
  avatar?: string;
};

/** Club role and slug always come from the live members row, not JWT claims. */
export async function sessionFromUser(user: User): Promise<SessionInfo> {
  const admin = createSupabaseServiceClient();
  const { data: member } = await admin
    .from("members")
    .select("slug, level, data")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const jwtLevel = String(user.app_metadata?.level || "");
  const dbLevel = String(member?.level || "");
  const level = dbLevel || (jwtLevel === "blogger" ? "blogger" : "");
  const memberSlug = String(member?.slug || "");
  const data = (member?.data ?? {}) as { name?: string; avatar?: string };
  const name = String(data.name || user.user_metadata?.name || memberSlug || "Member");
  const avatar = data.avatar ? String(data.avatar) : undefined;

  return {
    user: { id: user.id, email: user.email },
    level,
    memberSlug,
    name,
    email: user.email ?? "",
    avatar,
  };
}

export async function getSessionInfo(): Promise<SessionInfo | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return sessionFromUser(user);
}
