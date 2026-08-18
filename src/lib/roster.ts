import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

/** Leadership-only roster (Kerberos / email). Uses the service role. */
export async function getRosterMembers(): Promise<Member[]> {
  const admin = createSupabaseServiceClient();
  const { data, error } = await admin
    .from("members")
    .select("slug, data, level, entry_number, email")
    .neq("slug", "admin")
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const raw = (row.data ?? {}) as Partial<Member>;
    return {
      ...raw,
      slug: row.slug as string,
      name: raw.name ?? (row.slug as string),
      role: raw.role ?? "",
      tagline: raw.tagline ?? "",
      socials: raw.socials ?? [],
      blocks: raw.blocks ?? [],
      level: row.level as Member["level"],
      entryNumber: (row.entry_number as string | null) ?? undefined,
      email: (row.email as string | null) ?? undefined,
    };
  });
}
