export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url;
}

export function getSupabaseAnonKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return key;
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return key;
}

export const LOGIN_EMAIL_DOMAIN = "ariesiitd.com";

export function syntheticLoginEmail(usernameOrEntry: string) {
  return `${usernameOrEntry.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}

export type MemberLevel =
  | "oc"
  | "co_overall_coordinator"
  | "research_lead"
  | "coordinator"
  | "executive"
  | "member"
  | "blogger"
  | "alumni"
  | "visitor";

export function isVisitor(level: string | null | undefined) {
  return level === "visitor";
}
