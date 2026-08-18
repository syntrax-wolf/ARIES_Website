import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getSessionInfo } from "@/lib/auth-session";
import { canDirectPublish, canPublishResource, canSubmitForApproval } from "@/lib/roles";
import { slugifyName } from "@/lib/utils";
import type { Member } from "@/lib/types";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Ensure a non-ARIES person exists as a visitor-tier member so they get a profile page.
 * Only authenticated members who can edit projects/events may create visitors.
 */
export async function POST(req: Request) {
  const session = await getSessionInfo();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const level = session.level;
  if (!canDirectPublish(level) && !canSubmitForApproval(level) && !canPublishResource(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    slug?: string;
  };

  const name = String(body.name ?? "").trim();
  let slug = String(body.slug ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!slug) {
    slug = slugifyName(name);
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase letters, numbers, and hyphens, starting with a letter or number" },
      { status: 400 },
    );
  }

  const admin = createSupabaseServiceClient();

  // Never overwrite a real member or leadership account with a visitor record.
  const { data: existing } = await admin.from("members").select("slug, level, data").eq("slug", slug).maybeSingle();
  if (existing && existing.level !== "visitor") {
    return NextResponse.json(
      { error: `“${slug}” is already a club member. Pick them from the list instead.` },
      { status: 409 },
    );
  }

  const data: Member = {
    slug,
    name,
    role: "Visitor",
    tagline: "",
    socials: [],
    blocks: [],
  };

  const { error } = await admin.from("members").upsert({
    slug,
    data,
    level: "visitor",
    username: null,
    entry_number: null,
    email: null,
  });

  if (error) {
    const msg = error.message || "";
    if (/members_level_check|violates check constraint/i.test(msg)) {
      return NextResponse.json(
        {
          error:
            "Database is missing the visitor role. Run supabase/migrations/20260802000000_add_visitor_level.sql in the Supabase SQL editor, then try again.",
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, slug, name, level: "visitor" });
}
