import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import {
  canDirectPublish,
  canManageTeamContent,
  canPublishResource,
  canSubmitForApproval,
  isLeadership,
} from "@/lib/roles";
import { revalidateContent } from "@/lib/revalidate";
import {
  applyMemberIdentityToContributors,
  applyMemberIdentityToTeam,
} from "@/lib/member-hydrate";
import type { AriesEvent, Project, Resource, TeamData } from "@/lib/types";
import {
  reviewerSlugsForEvent,
  reviewerSlugsForProject,
  reviewerSlugsForResource,
  slugOnEvent,
  slugOnProject,
  slugOnResource,
} from "@/lib/entity-access";
import { normalizeTeamData } from "@/lib/team-years";

async function sessionInfo(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Prefer live members row (JWT app_metadata can be stale until refresh)
  const { data: member } = await supabase
    .from("members")
    .select("slug, level, data")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Prefer live members.level — JWT app_metadata can be stale (e.g. alumni still
  // tagged coordinator). Keep JWT only for the special blogger account.
  const jwtLevel = String(user.app_metadata?.level || "");
  const dbLevel = String(member?.level || "");
  const level = jwtLevel === "blogger" ? "blogger" : dbLevel || jwtLevel;
  const memberSlug = String(member?.slug || user.app_metadata?.member_slug || "");
  const name = String(
    (member?.data as { name?: string } | null)?.name ||
      user.user_metadata?.name ||
      memberSlug ||
      "Member",
  );

  return { user, level, memberSlug, name, email: user.email ?? "" };
}

async function publishDirect(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  kind: "projects" | "events" | "team",
  slug: string | undefined,
  payload: Record<string, unknown>,
  memberSlug: string,
  level: string,
) {
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
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slug: string,
  payload: Record<string, unknown>,
  memberSlug: string,
  level: string,
) {
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

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const session = await sessionInfo(supabase);
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
  if (kind !== "team" && (typeof slug !== "string" || !SLUG_RE.test(slug))) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const { level, memberSlug } = session;

  // Delete project / event / resource
  if (action === "delete" && (kind === "projects" || kind === "events" || kind === "resources")) {
    if (kind === "resources" && !canPublishResource(level)) {
      return NextResponse.json({ error: "Forbidden — cannot delete resources" }, { status: 403 });
    }
    if (kind !== "resources" && !canDirectPublish(level)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (kind === "resources") {
      const { data: row } = await supabase.from("resources").select("data").eq("id", 1).maybeSingle();
      const before = row?.data ?? [];
      const list = Array.isArray(before) ? before : [];
      const next = list.filter((r: Record<string, unknown>) => r.slug !== slug);
      const { error } = await supabase.from("resources").upsert({ id: 1, data: next });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await supabase.from("change_log").insert({
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
      const { error } = await supabase.from(table).delete().eq("slug", slug!);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await supabase.from("change_log").insert({
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
      const { error } = await supabase.from("change_requests").insert({
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
    const isOwn = memberSlug === slug;
    if (!isOwn && !isLeadership(level)) {
      return NextResponse.json(
        { error: "Forbidden — you can only edit your own profile" },
        { status: 403 },
      );
    }

    // SECURITY DEFINER RPC — reliable own-profile + leadership edits (bypasses INSERT RLS)
    const { error } = await supabase.rpc("save_member_profile", {
      p_slug: slug!,
      p_data: payload,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Leadership can set Kerberos so the person can sign up
    if (isLeadership(level) && (entryNumber !== undefined || email !== undefined)) {
      const kerberos = String(entryNumber || "")
        .trim()
        .toLowerCase()
        .replace(/@.*$/, "");
      const mail = String(email || "").trim().toLowerCase();
      try {
        const admin = createSupabaseServiceClient();
        const patch: Record<string, string | null> = {};
        if (entryNumber !== undefined) {
          patch.entry_number = kerberos || null;
          patch.username = kerberos || null;
        }
        if (email !== undefined || kerberos) {
          patch.email = mail || (kerberos ? `${kerberos}@iitd.ac.in` : null);
        }
        const { error: uErr } = await admin.from("members").update(patch).eq("slug", slug!);
        if (uErr) {
          return NextResponse.json({ error: uErr.message }, { status: 400 });
        }
      } catch (e) {
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : "Could not update Kerberos (check SUPABASE_SERVICE_ROLE_KEY)",
          },
          { status: 500 },
        );
      }
    }

    if (isLeadership(level) && requestedLevel) {
      const ALLOWED_LEVELS = new Set([
        "oc",
        "co_overall_coordinator",
        "research_lead",
        "coordinator",
        "executive",
        "member",
        "alumni",
        "visitor",
      ]);
      if (ALLOWED_LEVELS.has(requestedLevel)) {
        try {
          const admin = createSupabaseServiceClient();
          await admin.from("members").update({ level: requestedLevel }).eq("slug", slug!);
        } catch {
          // Profile data already saved; level patch is best-effort.
        }
      }
    }

    // Propagate name/avatar to JWT, team roster, alumni, and project contributor chips.
    try {
      const admin = createSupabaseServiceClient();
      const memberData = payload as { name?: string; avatar?: string; tagline?: string };
      const nextName = String(memberData.name ?? "").trim();
      const nextAvatar = memberData.avatar ? String(memberData.avatar) : "";
      const nextTagline = String(memberData.tagline ?? "").trim();

      const { data: memberRow } = await admin
        .from("members")
        .select("auth_user_id")
        .eq("slug", slug!)
        .maybeSingle();
      if (memberRow?.auth_user_id && nextName) {
        await admin.auth.admin.updateUserById(String(memberRow.auth_user_id), {
          user_metadata: { name: nextName },
        });
      }

      const { data: teamRow } = await admin.from("team").select("data").eq("id", 1).maybeSingle();
      if (teamRow?.data) {
        const { team: nextTeam, changed } = applyMemberIdentityToTeam(
          teamRow.data as TeamData,
          slug!,
          { name: nextName || undefined, avatar: nextAvatar, tagline: nextTagline },
        );
        if (changed) {
          await admin.from("team").update({ data: nextTeam }).eq("id", 1);
        }
      }

      if (nextName) {
        const { data: projectRows } = await admin.from("projects").select("slug, data");
        for (const row of projectRows ?? []) {
          const project = row.data as Project;
          const { contributors, changed } = applyMemberIdentityToContributors(
            project.contributors,
            slug!,
            nextName,
          );
          if (!changed) continue;
          await admin
            .from("projects")
            .update({ data: { ...project, contributors } })
            .eq("slug", row.slug);
        }
      }
    } catch {
      // Profile save already succeeded; denormalized sync is best-effort.
    }

    revalidateContent("members", slug!);
    return NextResponse.json({ ok: true, mode: "direct" });
  }

  if (kind === "team") {
    if (!canManageTeamContent(level)) {
      return NextResponse.json(
        { error: "Forbidden — only OC / Co-Overall Coordinator / Research Lead can edit team content" },
        { status: 403 },
      );
    }
    const result = await publishDirect(supabase, "team", slug, payload, memberSlug, level);
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
    const { data: memberRows } = await supabase.from("members").select("slug, level");
    const roster = (memberRows ?? []) as { slug: string; level: string }[];

    if (kind === "projects") {
      const { data: row } = await supabase.from("projects").select("data").eq("slug", slug!).maybeSingle();
      const existing = row?.data as Project | undefined;
      if (level === "executive") {
        const onIt = slugOnProject(existing, memberSlug) || slugOnProject(payload as Project, memberSlug);
        if (existing && !slugOnProject(existing, memberSlug)) {
          return NextResponse.json(
            { error: "You can only edit projects you are listed on. Request to join from Account." },
            { status: 403 },
          );
        }
        if (!existing && !onIt) {
          return NextResponse.json(
            { error: "Add yourself as a contributor to submit a new project." },
            { status: 403 },
          );
        }
      }
    } else {
      const { data: row } = await supabase.from("events").select("data").eq("slug", slug!).maybeSingle();
      const existing = row?.data as AriesEvent | undefined;
      if (level === "executive") {
        const onIt = slugOnEvent(existing, memberSlug) || slugOnEvent(payload as AriesEvent, memberSlug);
        if (existing && !slugOnEvent(existing, memberSlug)) {
          return NextResponse.json(
            { error: "You can only edit events you are listed on. Request to join from Account." },
            { status: 403 },
          );
        }
        if (!existing && !onIt) {
          return NextResponse.json(
            { error: "Add yourself as a contributor to submit a new event." },
            { status: 403 },
          );
        }
      }
    }

    if (canDirectPublish(level)) {
      const result = await publishDirect(supabase, kind, slug, payload, memberSlug, level);
      if ("error" in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      revalidateContent(kind, slug);
      return NextResponse.json({ ok: true, mode: "direct" });
    }

    if (canSubmitForApproval(level)) {
      const entityType = kind === "projects" ? "project" : "event";
      const reviewers =
        kind === "projects"
          ? reviewerSlugsForProject(payload as Project, roster)
          : reviewerSlugsForEvent(payload as AriesEvent, roster);
      const { error } = await supabase.from("change_requests").insert({
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
    if (level === "executive") {
      const { data: row } = await supabase.from("resources").select("data").eq("id", 1).maybeSingle();
      const list = (Array.isArray(row?.data) ? row.data : []) as Resource[];
      const existing = list.find((r) => r.slug === slug);
      if (existing && !slugOnResource(existing, memberSlug)) {
        return NextResponse.json(
          { error: "You can only edit resources you are listed on. Request to join from Account." },
          { status: 403 },
        );
      }
      const { data: memberRows } = await supabase.from("members").select("slug, level");
      const roster = (memberRows ?? []) as { slug: string; level: string }[];
      const reviewers = reviewerSlugsForResource(payload as Resource, roster);
      const { error } = await supabase.from("change_requests").insert({
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
    const result = await publishResourceDirect(supabase, slug!, payload, memberSlug, level);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    revalidateContent("resources", slug);
    return NextResponse.json({ ok: true, mode: "direct" });
  }

  return NextResponse.json({ error: "Unhandled" }, { status: 400 });
}
