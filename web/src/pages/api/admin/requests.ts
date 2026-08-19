export const prerender = false;

import { createWritableStore } from "../../../lib/content/d1";
import { resolveActor } from "../../../lib/content/actor";
import {
  actorMayReview,
  approveChangeRequest,
  enqueueJoinRequest,
  rejectChangeRequest,
} from "../../../lib/content/queue";
import { documentDbFromLocals } from "../../../lib/gate/runtime";
import { sessionFromRequest } from "../../../lib/gate/request";

async function context(request: Request, locals: unknown) {
  const session = sessionFromRequest(request);
  if (!session) return null;
  const db = await documentDbFromLocals(locals);
  const store = createWritableStore(db);
  const actor = await resolveActor(store, session);
  return { store, actor };
}

export async function GET({
  request,
  locals,
}: {
  request: Request;
  locals: unknown;
}) {
  const ctx = await context(request, locals);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const all = await ctx.store.listChangeRequests();
  const mine = all.filter((r) => r.submittedBy === ctx.actor.memberSlug);
  const inbox = actorMayReview(ctx.actor) ? all : [];
  return Response.json({
    mine,
    inbox: inbox.map((r) => ({
      id: r.id,
      entity_type: r.kind,
      entity_slug: r.slug,
      payload: r.payload,
      submitted_by: r.submittedBy,
      created_at: r.createdAt,
    })),
  });
}

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: unknown;
}) {
  const ctx = await context(request, locals);
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    requestId?: string;
    approve?: boolean;
    entityType?: "projects" | "events" | "project" | "event";
    entitySlug?: string;
    name?: string;
  };

  if (body.action === "review") {
    if (!body.requestId || typeof body.approve !== "boolean") {
      return Response.json({ error: "Invalid review" }, { status: 400 });
    }
    const result = body.approve
      ? await approveChangeRequest(ctx.store, ctx.actor, body.requestId)
      : await rejectChangeRequest(ctx.store, ctx.actor, body.requestId);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 403 });
    }
    return Response.json({ ok: true, approved: body.approve });
  }

  if (body.action === "join") {
    const kind =
      body.entityType === "project" || body.entityType === "projects" ? "projects" : "events";
    const slug = String(body.entitySlug || "").trim();
    const member = await ctx.store.getMember(ctx.actor.memberSlug);
    const result = await enqueueJoinRequest(
      ctx.store,
      ctx.actor,
      kind,
      slug,
      body.name || member?.name || ctx.actor.memberSlug,
    );
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ ok: true, mode: result.mode });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
