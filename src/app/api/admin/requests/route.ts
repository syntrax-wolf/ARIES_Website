import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { revalidateContent } from "@/lib/revalidate";
import { isLeadership } from "@/lib/roles";
import {
  isCoreTeam,
  reviewerSlugsForEvent,
  reviewerSlugsForProject,
  reviewerSlugsForResource,
  slugOnEvent,
  slugOnProject,
  slugOnResource,
} from "@/lib/entity-access";
import type { AriesEvent, Project, Resource } from "@/lib/types";

type RequestKind = "join" | "edit" | "create";
type EntityType = "project" | "event" | "resource";

async function actor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("slug, level, data")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const jwtLevel = String(user.app_metadata?.level || "");
  const dbLevel = String(member?.level || "");
  const level = jwtLevel === "blogger" ? "blogger" : dbLevel || jwtLevel;
  const memberSlug = String(member?.slug || user.app_metadata?.member_slug || "");
  const name = String((member?.data as { name?: string } | null)?.name || memberSlug);

  return { supabase, user, level, memberSlug, name };
}

function reviewersOf(payload: Record<string, unknown> | null | undefined): string[] {
  const raw = payload?.__reviewers;
  return Array.isArray(raw) ? raw.map(String) : [];
}

function canReview(
  level: string,
  memberSlug: string,
  payload: Record<string, unknown> | null | undefined,
) {
  if (isLeadership(level) || isCoreTeam(level)) return true;
  return reviewersOf(payload).includes(memberSlug);
}

export async function GET() {
  const session = await actor();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase, memberSlug, level } = session;
  const { data, error } = await supabase
    .from("change_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const all = data ?? [];
  const mine = all.filter((r) => r.submitted_by === memberSlug);
  const inbox = all.filter((r) => canReview(level, memberSlug, r.payload as Record<string, unknown>));

  return NextResponse.json({ mine, inbox });
}

export async function POST(req: Request) {
  const session = await actor();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, memberSlug, name, level } = session;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    requestId?: string;
    approve?: boolean;
    entityType?: EntityType;
    entitySlug?: string;
    kind?: RequestKind;
  };

  if (body.action === "review") {
    if (!body.requestId || typeof body.approve !== "boolean") {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }
    const { data: pending, error: pErr } = await supabase
      .from("change_requests")
      .select("*")
      .eq("id", body.requestId)
      .eq("status", "pending")
      .maybeSingle();
    if (pErr || !pending) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (!canReview(level, memberSlug, pending.payload as Record<string, unknown>)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.approve) {
      const applied = await applyRequest(pending);
      if (applied.error) {
        return NextResponse.json({ error: applied.error }, { status: 400 });
      }
      revalidateContent(pending.entity_type, pending.entity_slug);
    }

    // No audit trail — delete both approved and rejected copies.
    await supabase.from("change_requests").delete().eq("id", body.requestId);
    return NextResponse.json({ ok: true, approved: body.approve });
  }

  if (body.action === "join") {
    const entityType = body.entityType;
    const entitySlug = String(body.entitySlug || "").trim();
    if (!entityType || !entitySlug) {
      return NextResponse.json({ error: "Pick something to join" }, { status: 400 });
    }

    const { data: memberRows } = await supabase.from("members").select("slug, level");
    const roster = (memberRows ?? []) as { slug: string; level: string }[];

    let reviewers: string[] = [];
    if (entityType === "project") {
      const { data: row } = await supabase.from("projects").select("data").eq("slug", entitySlug).maybeSingle();
      const project = row?.data as Project | undefined;
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (slugOnProject(project, memberSlug)) {
        return NextResponse.json({ error: "You are already on this project" }, { status: 409 });
      }
      reviewers = reviewerSlugsForProject(project, roster);
    } else if (entityType === "event") {
      const { data: row } = await supabase.from("events").select("data").eq("slug", entitySlug).maybeSingle();
      const event = row?.data as AriesEvent | undefined;
      if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
      if (slugOnEvent(event, memberSlug)) {
        return NextResponse.json({ error: "You are already on this event" }, { status: 409 });
      }
      reviewers = reviewerSlugsForEvent(event, roster);
    } else {
      const { data: row } = await supabase.from("resources").select("data").eq("id", 1).maybeSingle();
      const list = (Array.isArray(row?.data) ? row.data : []) as Resource[];
      const resource = list.find((r) => r.slug === entitySlug);
      if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      if (slugOnResource(resource, memberSlug)) {
        return NextResponse.json({ error: "You are already on this resource" }, { status: 409 });
      }
      reviewers = reviewerSlugsForResource(resource, roster);
    }

    const { error } = await supabase.from("change_requests").insert({
      entity_type: entityType,
      entity_slug: entitySlug,
      payload: {
        __kind: "join",
        __reviewers: reviewers,
        slug: memberSlug,
        name,
      },
      submitted_by: memberSlug,
      status: "pending",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, mode: "pending" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function applyRequest(pending: {
  entity_type: string;
  entity_slug: string;
  payload: Record<string, unknown>;
}): Promise<{ error?: string }> {
  const admin = createSupabaseServiceClient();
  const payload = pending.payload ?? {};
  const kind = String(payload.__kind || "edit");
  const entityType = pending.entity_type;
  const slug = pending.entity_slug;

  if (kind === "join") {
    const joinSlug = String(payload.slug || "");
    const joinName = String(payload.name || joinSlug);
    if (!joinSlug) return { error: "Missing joiner" };

    if (entityType === "project") {
      const { data: row } = await admin.from("projects").select("data").eq("slug", slug).maybeSingle();
      if (!row?.data) return { error: "Project gone" };
      const project = row.data as Project;
      const people = [...(project.contributors ?? [])];
      const already = people.some((c) =>
        typeof c === "string" ? c === joinSlug : c.slug === joinSlug,
      );
      if (!already) {
        people.push({ name: joinName, slug: joinSlug, kind: "member" });
        const { error } = await admin
          .from("projects")
          .update({ data: { ...project, contributors: people } })
          .eq("slug", slug);
        if (error) return { error: error.message };
      }
      return {};
    }
    if (entityType === "event") {
      const { data: row } = await admin.from("events").select("data").eq("slug", slug).maybeSingle();
      if (!row?.data) return { error: "Event gone" };
      const event = row.data as AriesEvent;
      const people = [...(event.contributors ?? [])];
      const already = people.some((c) =>
        typeof c === "string" ? c === joinSlug : c.slug === joinSlug,
      );
      if (!already) {
        people.push({ name: joinName, slug: joinSlug, kind: "member" });
        const { error } = await admin
          .from("events")
          .update({ data: { ...event, contributors: people } })
          .eq("slug", slug);
        if (error) return { error: error.message };
      }
      return {};
    }
    if (entityType === "resource") {
      const { data: row } = await admin.from("resources").select("data").eq("id", 1).maybeSingle();
      const list = (Array.isArray(row?.data) ? row.data : []) as Resource[];
      const index = list.findIndex((r) => r.slug === slug);
      if (index < 0) return { error: "Resource gone" };
      const resource = list[index];
      const authors = [...(resource.authors ?? [])];
      if (!authors.some((a) => a.slug === joinSlug)) {
        authors.push({ name: joinName, slug: joinSlug, kind: "member" });
        const next = [...list];
        next[index] = { ...resource, authors };
        const { error } = await admin.from("resources").upsert({ id: 1, data: next });
        if (error) return { error: error.message };
      }
      return {};
    }
    return { error: "Unknown entity" };
  }

  if (payload.__delete) {
    if (entityType === "project") {
      const { error } = await admin.from("projects").delete().eq("slug", slug);
      return error ? { error: error.message } : {};
    }
    if (entityType === "event") {
      const { error } = await admin.from("events").delete().eq("slug", slug);
      return error ? { error: error.message } : {};
    }
    if (entityType === "resource") {
      const { data: row } = await admin.from("resources").select("data").eq("id", 1).maybeSingle();
      const list = (Array.isArray(row?.data) ? row.data : []) as Resource[];
      const next = list.filter((r) => r.slug !== slug);
      const { error } = await admin.from("resources").upsert({ id: 1, data: next });
      return error ? { error: error.message } : {};
    }
  }

  const { __reviewers, __kind, __delete, ...clean } = payload;
  void __reviewers;
  void __kind;
  void __delete;

  if (entityType === "project") {
    const { error } = await admin.from("projects").upsert({
      slug,
      data: { ...clean, slug },
      featured: !!clean.featured,
      updated_at: new Date().toISOString(),
    });
    return error ? { error: error.message } : {};
  }
  if (entityType === "event") {
    const { error } = await admin.from("events").upsert({
      slug,
      data: { ...clean, slug },
      date: (clean.date as string) || null,
      updated_at: new Date().toISOString(),
    });
    return error ? { error: error.message } : {};
  }
  if (entityType === "resource") {
    const { data: row } = await admin.from("resources").select("data").eq("id", 1).maybeSingle();
    const list = (Array.isArray(row?.data) ? row.data : []) as Resource[];
    const index = list.findIndex((r) => r.slug === slug);
    const next = [...list];
    const item = { ...clean, slug } as Resource;
    if (index >= 0) next[index] = item;
    else next.push(item);
    const { error } = await admin.from("resources").upsert({ id: 1, data: next });
    return error ? { error: error.message } : {};
  }

  return { error: "Unhandled request" };
}
