export const prerender = false;

import { createWritableStore } from "../../../lib/content/d1";
import { publishEvent, publishProject, publishResource } from "../../../lib/content/publish";
import { resolveActor } from "../../../lib/content/actor";
import { documentDbFromLocals } from "../../../lib/gate/runtime";
import { sessionFromRequest } from "../../../lib/gate/request";
import type { AriesEvent, Project, Resource } from "../../../../../src/lib/types";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: unknown;
}) {
  const session = sessionFromRequest(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    slug?: string;
    data?: Project | AriesEvent | Resource;
  };

  const db = await documentDbFromLocals(locals);
  const store = createWritableStore(db);
  const actor = await resolveActor(store, session);

  if (body.kind === "projects") {
    const project = body.data as Project | undefined;
    if (!project || typeof project !== "object") {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }
    const slug = String(project.slug || body.slug || "").trim();
    if (!SLUG_RE.test(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });
    const result = await publishProject(store, actor, { ...project, slug });
    if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
    return Response.json({ ok: true, mode: result.mode });
  }

  if (body.kind === "events") {
    const event = body.data as AriesEvent | undefined;
    if (!event || typeof event !== "object") {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }
    const slug = String(event.slug || body.slug || "").trim();
    if (!SLUG_RE.test(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });
    const result = await publishEvent(store, actor, { ...event, slug });
    if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
    return Response.json({ ok: true, mode: result.mode });
  }

  if (body.kind === "resources") {
    const resource = body.data as Resource | undefined;
    if (!resource || typeof resource !== "object") {
      return Response.json({ error: "Invalid data" }, { status: 400 });
    }
    const slug = String(resource.slug || body.slug || "").trim();
    if (!SLUG_RE.test(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });
    const result = await publishResource(store, actor, { ...resource, slug });
    if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
    return Response.json({ ok: true, mode: result.mode });
  }

  return Response.json({ error: "Invalid kind" }, { status: 400 });
}
