import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  canDirectPublish,
  canManageTeamContent,
  canPublishResource,
  canSubmitForApproval,
  isLeadership,
  mapTeamRoleToLevel,
} from "@/lib/roles";
import { revalidateContent } from "@/lib/revalidate";
import {
  applyMemberIdentityToContributors,
  applyMemberIdentityToTeam,
} from "@/lib/member-hydrate";
import type { AriesEvent, Member, Project, Resource, TeamData } from "@/lib/types";
import {
  canEditEntity,
  reviewerSlugsForEvent,
  reviewerSlugsForProject,
  reviewerSlugsForResource,
  slugOnEvent,
  slugOnProject,
  slugOnResource,
} from "@/lib/entity-access";
import { normalizeTeamData } from "@/lib/team-years";
import { getSessionInfo } from "@/lib/auth-session";
import type { MemberLevel } from "@/lib/supabase/env";

async function publishDirect(
  kind: "projects" | "events" | "team",
  slug: string | undefined,
  payload: Record<string, unknown>,
  memberSlug: string,
  level: string,
) {
  const supabase = createSupabaseServiceClient();
  const entitySlug = kind === "team" ? "team" : slug!;
  let before: unknown = null;

  if (kind === "projects") {
    const { data: row } = await supabase.from("projects").select("data").eq("slug", slug!).maybeSingle();
    before = row?.data ?? null;
    const { error } = await supabase.from("projects").upsert({
      slug: slug!,
      data: payload,
      featured: !!payload.featured,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  } else if (kind === "events") {
    const { data: row } = await supabase.from("events").select("data").eq("slug", slug!).maybeSingle();
    before = row?.data ?? null;
    const { error } = await supabase.from("events").upsert({
      slug: slug!,
      data: payload,
      date: (payload.date as string) || null,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  } else {
    const { data: row } = await supabase.from("team").select("data").eq("id", 1).maybeSingle();
    before = row?.data ?? null;
    const { error } = await supabase.from("team").upsert({
      id: 1,
      data: payload,
      updated_at: new Date().toISOString(),
    });
    if (error) return { error: error.message };
  }

  const { error: logErr } = await supabase.from("change_log").insert({
    entity_type: kind === "team" ? "team" : kind.slice(0, -1),
    entity_slug: entitySlug,
    actor_slug: memberSlug || "unknown",
    actor_level: level,
    source: "direct",
    summary: `Direct publish ${kind}`,
    before_data: before,
    after_data: payload,
  });
  // Don't fail the save if audit log insert fails
  if (logErr) console.warn("[admin/save] change_log:", logErr.message);

  return { ok: true as const };
}

async function publishResourceDirect(
  slug: string,
  payload: Record<string, unknown>,
  memberSlug: string,
  level: string,
) {
  const supabase = createSupabaseServiceClient();
  const { data: row } = await supabase.from("resources").select("data").eq("id", 1).maybeSingle();
  const before = row?.data ?? [];
  const list = Array.isArray(before) ? before : [];
  const index = list.findIndex((r: Record<string, unknown>) => r.slug === slug);
  const next = [...list];
  if (index >= 0) next[index] = payload;
  else next.push(payload);

  const { error } = await supabase.from("resources").upsert({ id: 1, data: next });
  if (error) return { error: error.message };

  const { error: logErr } = await supabase.from("change_log").insert({
    entity_type: "resource",
    entity_slug: slug,
    actor_slug: memberSlug || "unknown",
    actor_level: level,
    source: "direct",
    summary: `Direct publish resource ${slug}`,
    before_data: index >= 0 ? list[index] : null,
    after_data: payload,
  });
  if (logErr) console.warn("[admin/save] change_log:", logErr.message);

  return { ok: true as const };
}

const CLUB_LEVELS = new Set([
  "oc",
  "co_overall_coordinator",
  "research_lead",
  "coordinator",
  "executive",
  "member",
  "alumni",
  "visitor",
  "blogger",
]);

async function saveRosterMember(
  db: ReturnType<typeof createSupabaseServiceClient>,
  input: {
    slug: string;
    data: Record<string, unknown>;
    entryNumber?: string | null;
    email?: string | null;
    clubLevel?: string;
  },
): Promise<{ ok: true } | { error: string }> {
  const name = String(input.data.name ?? "").trim();
  if (!name) return { error: "Name is required" };

  const { data: existing } = await db
    .from("members")
    .select("data, level")
    .eq("slug", input.slug)
    .maybeSingle();
  const prev = ((existing?.data as Record<string, unknown> | null) ?? {}) as Partial<Member>;

  const nextData: Member = {
    ...prev,
    slug: input.slug,
    name,
    role: String(input.data.role ?? prev.role ?? ""),
    tagline: String(input.data.tagline ?? prev.tagline ?? ""),
    year: (input.data.year as string | undefined) || prev.year,
    location: (input.data.location as string | undefined) || prev.location || "IIT Delhi",
    avatar: (input.data.avatar as string | undefined) || prev.avatar,
    socials: prev.socials ?? [],
    blocks: prev.blocks ?? [],
  };

  const kerberos = String(input.entryNumber || "")
    .trim()
    .toLowerCase()
    .replace(/@.*$/, "");
  const mail = String(input.email || "").trim().toLowerCase();
  const requestedLevel = String(input.clubLevel || input.data.clubLevel || existing?.level || "member");
  const level: MemberLevel = CLUB_LEVELS.has(requestedLevel)
    ? (requestedLevel as MemberLevel)
    : mapTeamRoleToLevel(nextData.role) || "member";

  const row: Record<string, unknown> = {
    slug: input.slug,
    data: nextData,
    level,
    updated_at: new Date().toISOString(),
  };
  if (input.entryNumber !== undefined) {
    row.entry_number = kerberos || null;
    row.username = kerberos || null;
  }
  if (input.email !== undefined || kerberos) {
    row.email = mail || (kerberos ? `${kerberos}@iitd.ac.in` : null);
  }

  const { error } = await db.from("members").upsert(row);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const session = await getSessionInfo();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — please sign in again" }, { status: 401 });
  }

  const { kind, slug, data, action, entryNumber, email, level: requestedLevel } = (await req.json()) as {
    kind?: string;
    slug?: string;
    data?: Record<string, unknown>;
    action?: string;
    entryNumber?: string | null;
    email?: string | null;
    level?: string | null;
  };

  const ALLOWED = new Set(["members", "projects", "events", "team", "resources"]);
  const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

  if (!kind || !ALLOWED.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (kind === "members" && action === "roster") {
    if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
  } else if (kind !== "team" && kind !== "members" && (typeof slug !== "string" || !SLUG_RE.test(slug))) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const { level, memberSlug } = session;
  const db = createSupabaseServiceClient();

  // Delete project / event / resource
  if (action === "delete" && (kind === "projects" || kind === "events" || kind === "resources")) {
    if (kind === "resources" && !canPublishResource(level)) {
      return NextResponse.json({ error: "Forbidden — cannot delete resources" }, { status: 403 });
    }
    if (kind !== "resources" && !canDirectPublish(level) && !canSubmitForApproval(level)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (kind === "projects" || kind === "events") {
      const table = kind === "projects" ? "projects" : "events";
      const { data: existingRow } = await db.from(table).select("data").eq("slug", slug!).maybeSingle();
      const existing = existingRow?.data as Project | AriesEvent | undefined;
      const onIt =
        kind === "projects"
          ? slugOnProject(existing as Project | undefined, memberSlug)
          : slugOnEvent(existing as AriesEvent | undefined, memberSlug);
      if (existing && !canEditEntity(level, onIt)) {
        return NextResponse.json({ error: "You can only delete items you are listed on" }, { status: 403 });
      }
    }
    if (kind === "resources") {
      const { data: row } = await db.from("resources").select("data").eq("id", 1).maybeSingle();
      const before = row?.data ?? [];
      const list = Array.isArray(before) ? before : [];
      const next = list.filter((r: Record<string, unknown>) => r.slug !== slug);
      const { error } = await db.from("resources").upsert({ id: 1, data: next });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await db.from("change_log").insert({
        entity_type: "resource",
        entity_slug: slug!,
        actor_slug: memberSlug || "unknown",
        actor_level: level,
        source: "direct",
        summary: `Deleted resource ${slug}`,
        before_data: list.find((r: Record<string, unknown>) => r.slug === slug) ?? null,
        after_data: null,
      });
      revalidateContent("resources", slug);
      return NextResponse.json({ ok: true, mode: "direct", deleted: true });
    }
    if (canDirectPublish(level)) {
      const table = kind === "projects" ? "projects" : "events";
      const { error } = await db.from(table).delete().eq("slug", slug!);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await db.from("change_log").insert({
        entity_type: kind === "projects" ? "project" : "event",
        entity_slug: slug!,
        actor_slug: memberSlug || "unknown",
        actor_level: level,
        source: "direct",
        summary: `Deleted ${kind.slice(0, -1)} ${slug}`,
        before_data: null,
        after_data: null,
      });
      revalidateContent(kind, slug);
      return NextResponse.json({ ok: true, mode: "direct", deleted: true });
    }
    if (canSubmitForApproval(level)) {
      const entityType = kind === "projects" ? "project" : "event";
      const { error } = await db.from("change_requests").insert({
        entity_type: entityType,
        entity_slug: slug!,
        payload: { __delete: true },
        submitted_by: memberSlug,
        status: "pending",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({
        ok: true,
        mode: "pending",
        message: "Delete submitted for approval",
      });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const payload =
    kind === "team"
      ? normalizeTeamData(data as TeamData)
      : { ...data, slug };

  if (kind === "members") {
    if (action === "roster") {
      if (!isLeadership(level)) {
        return NextResponse.json({ error: "Forbidden — roster edits are leadership only" }, { status: 403 });
      }
      const saved = await saveRosterMember(db, {
        slug: slug!,
        data: data as Record<string, unknown>,
        entryNumber,
        email,
        clubLevel: (data as { clubLevel?: string }).clubLevel || requestedLevel || undefined,
      });
      if ("error" in saved) {
        return NextResponse.json({ error: saved.error }, { status: 400 });
      }
      revalidateContent("members", slug!);
      return NextResponse.json({ ok: true, mode: "direct" });
    }

    if (!memberSlug) {
      return NextResponse.json({ error: "No profile is linked to this login" }, { status: 403 });
    }

    const ownPayload: Record<string, unknown> = {
      ...(data as Record<string, unknown>),
      slug: memberSlug,
    };
    delete ownPayload.level;
    delete ownPayload.entryNumber;
    delete ownPayload.email;
    delete ownPayload.auth_user_id;
    delete ownPayload.clubLevel;

    const { error } = await supabase.rpc("save_member_profile", {
      p_slug: memberSlug,
      p_data: ownPayload,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    try {
      const memberData = ownPayload as { name?: string; avatar?: string; tagline?: string };
      const nextName = String(memberData.name ?? "").trim();
      const nextAvatar = memberData.avatar ? String(memberData.avatar) : "";
      const nextTagline = String(memberData.tagline ?? "").trim();

      const { data: memberRow } = await db
        .from("members")
        .select("auth_user_id")
        .eq("slug", memberSlug)
        .maybeSingle();
      if (memberRow?.auth_user_id && nextName) {
        await db.auth.admin.updateUserById(String(memberRow.auth_user_id), {
          user_metadata: { name: nextName },
        });
      }

      const { data: teamRow } = await db.from("team").select("data").eq("id", 1).maybeSingle();
      if (teamRow?.data) {
        const { team: nextTeam, changed } = applyMemberIdentityToTeam(
          teamRow.data as TeamData,
          memberSlug,
          { name: nextName || undefined, avatar: nextAvatar, tagline: nextTagline },
        );
        if (changed) {
          await db.from("team").update({ data: nextTeam }).eq("id", 1);
        }
      }

      if (nextName) {
        const { data: projectRows } = await db.from("projects").select("slug, data");
        for (const row of projectRows ?? []) {
          const project = row.data as Project;
          const { contributors, changed } = applyMemberIdentityToContributors(
            project.contributors,
            memberSlug,
            nextName,
          );
          if (!changed) continue;
          await db
            .from("projects")
            .update({ data: { ...project, contributors } })
            .eq("slug", row.slug);
        }
      }
    } catch {
      // Profile save already succeeded; denormalized sync is best-effort.
    }

    revalidateContent("members", memberSlug);
    return NextResponse.json({ ok: true, mode: "direct" });
  }

  if (kind === "team") {
    if (!canManageTeamContent(level)) {
      return NextResponse.json(
        { error: "Forbidden — only OC / Co-Overall Coordinator / Research Lead can edit team content" },
        { status: 403 },
      );
    }
    const result = await publishDirect("team", slug, payload, memberSlug, level);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Alumni grid photo lives on team.alumni; profile pages read members.data.avatar.
    // Keep them in sync when an alumnus is linked by slug.
    const alumni = Array.isArray((payload as { alumni?: unknown }).alumni)
      ? ((payload as { alumni: Array<{ slug?: string; photo?: string }> }).alumni ?? [])
      : [];
    try {
      const admin = createSupabaseServiceClient();
      for (const a of alumni) {
        const linked = String(a.slug ?? "").trim();
        const photo = String(a.photo ?? "").trim();
        if (!linked || !photo) continue;
        const { data: row } = await admin
          .from("members")
          .select("data")
          .eq("slug", linked)
          .maybeSingle();
        if (!row) continue;
        const prev = (row.data as Record<string, unknown> | null) ?? {};
        if (prev.avatar === photo) continue;
        const { error: syncErr } = await admin
          .from("members")
          .update({ data: { ...prev, avatar: photo } })
          .eq("slug", linked);
        if (!syncErr) revalidateContent("members", linked);
      }
    } catch {
      // Team save already succeeded; avatar sync is best-effort.
    }

    revalidateContent("team", slug);
    return NextResponse.json({ ok: true, mode: "direct" });
  }

  if (kind === "projects" || kind === "events") {
    const { data: memberRows } = await db.from("members").select("slug, level");
    const roster = (memberRows ?? []) as { slug: string; level: string }[];

    const isProject = kind === "projects";
    const { data: row } = isProject
      ? await db.from("projects").select("data").eq("slug", slug!).maybeSingle()
      : await db.from("events").select("data").eq("slug", slug!).maybeSingle();
    const existing = row?.data as Project | AriesEvent | undefined;
    const onExisting = isProject
      ? slugOnProject(existing as Project | undefined, memberSlug)
      : slugOnEvent(existing as AriesEvent | undefined, memberSlug);
    const onPayload = isProject
      ? slugOnProject(payload as Project, memberSlug)
      : slugOnEvent(payload as AriesEvent, memberSlug);
    const onEntity = existing ? onExisting : onPayload || isLeadership(level);

    if (!canEditEntity(level, onEntity)) {
      return NextResponse.json(
        {
          error: existing
            ? "You can only edit items you are listed on. Request to join from Account."
            : "Add yourself as a contributor to create this.",
        },
        { status: 403 },
      );
    }

    if (canDirectPublish(level)) {
      const result = await publishDirect(kind, slug, payload, memberSlug, level);
      if ("error" in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      revalidateContent(kind, slug);
      return NextResponse.json({ ok: true, mode: "direct" });
    }

    if (canSubmitForApproval(level)) {
      const entityType = isProject ? "project" : "event";
      const reviewers = isProject
        ? reviewerSlugsForProject(payload as Project, roster)
        : reviewerSlugsForEvent(payload as AriesEvent, roster);
      const { error } = await db.from("change_requests").insert({
        entity_type: entityType,
        entity_slug: slug!,
        payload: { ...payload, __reviewers: reviewers, __kind: "edit" },
        submitted_by: memberSlug,
        status: "pending",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({
        ok: true,
        mode: "pending",
        message: "Submitted for approval",
      });
    }

    return NextResponse.json(
      { error: `Forbidden — your role (${level || "none"}) cannot edit ${kind}` },
      { status: 403 },
    );
  }

  if (kind === "resources") {
    const { data: row } = await db.from("resources").select("data").eq("id", 1).maybeSingle();
    const list = (Array.isArray(row?.data) ? row.data : []) as Resource[];
    const existing = list.find((r) => r.slug === slug);
    const onExisting = slugOnResource(existing, memberSlug);
    const onPayload = slugOnResource(payload as Resource, memberSlug);
    const onEntity = existing ? onExisting : onPayload || isLeadership(level);

    if (level === "executive") {
      if (!canEditEntity(level, onEntity)) {
        return NextResponse.json(
          { error: "You can only edit resources you are listed on. Request to join from Account." },
          { status: 403 },
        );
      }
      const { data: memberRows } = await db.from("members").select("slug, level");
      const roster = (memberRows ?? []) as { slug: string; level: string }[];
      const reviewers = reviewerSlugsForResource(payload as Resource, roster);
      const { error } = await db.from("change_requests").insert({
        entity_type: "resource",
        entity_slug: slug!,
        payload: { ...payload, __reviewers: reviewers, __kind: "edit" },
        submitted_by: memberSlug,
        status: "pending",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({
        ok: true,
        mode: "pending",
        message: "Submitted for approval",
      });
    }
    if (!canPublishResource(level)) {
      return NextResponse.json(
        { error: "Forbidden — your role cannot publish resources" },
        { status: 403 },
      );
    }
    const result = await publishResourceDirect(slug!, payload, memberSlug, level);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidateContent("resources", slug);
    return NextResponse.json({ ok: true, mode: "direct" });
  }

  return NextResponse.json({ error: "Unhandled" }, { status: 400 });
}
